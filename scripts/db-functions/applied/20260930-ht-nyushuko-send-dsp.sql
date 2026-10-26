-- 適用状況: ステージング 2026-09-30（2026-10-01 作業場所の照合を外して再適用） / 本番 適用済み
--
-- HT の入出庫送信RPC nyushuko_send_20260626_1 を、ゲート（20260930-rf-nyushuko-send-dsp.sql）と同じ
-- 「親の dsp_ord_num 単位で採番・集約する」形にそろえる。関数名・引数（juchu_kizai_head_kbn を含む）は変えない。
--
-- 適用前の HT 関数とゲート関数（修正前）の違いは、入庫チェックの伝票 UPSERT が juchu_kizai_head_kbn で
-- 分岐していた点だけだった（2026-09-30 に行単位で diff 済み。HT はステージング・本番とも同一定義）。
--   - 通常（kbn = 1）: 対応表から dsp_ord_num を入れる
--   - カット/キープ（kbn <> 1）: dsp_ord_num を入れない → 親機材として読んだ行が NULL になり、
--     Web の到着・到着解除で親伝票と紐づかなかった
-- この分岐をなくし、本体はゲートの修正後と同じにする。そのうえで HT 用に次を足す。
--
-- ★ HT 用の追加: 親機材として読んだタグの明細IDを振り直す
--   HT アプリは、親機材として読んだタグに「親の明細ID」をそのまま付けて送ってくる
--   （kizai_list_grid_row_provider.dart の tempOyaKizai.juchuKizaiMeisaiId）。
--   子（返却・キープ）の明細IDは子の中で独自に振る番号なので、Web で振った番号と重なるおそれがある。
--   そこで、入庫チェックで区分が通常以外、かつ対応表にあるタグ（＝HT が親機材として読んだタグ）は、
--   送られてきた明細IDを使わず null として扱い、ゲートと同じ採番（既存行の再利用 → 無ければ max + 1）を通す。
--   HT アプリの修正は不要。
--   ※ HT は送信後も読取済みリストをクリアせず、前回分も対応表付きで再送してくるが、再利用で同じ明細IDになる。
--
-- ★ 既存データ（この修正より前に HT で作られた、明細ID＝親の明細ID・dsp_ord_num NULL の行）への配慮
--   再利用の探索で「dsp_ord_num が NULL で、明細IDが送られてきた（親の）明細IDと同じ行」も対象にする
--   （dsp_ord_num が一致する行を優先）。途中まで送信済みの返却が、修正後に別の行へ分かれないようにするため。
--   あわせて 20260930-nyushuko-den-dsp-backfill.sql で NULL を親の値で埋める。
--
-- ★ 到着済みの返却・キープでは dsp_ord_num の NULL を埋めない（on conflict）
--   到着時に dsp_ord_num が NULL だった行は、親伝票から数量が引かれていない。後から紐づけると、
--   到着解除のときに引いていない数量が親に戻され、親の入庫予定が増えてしまう。
--   （t_nyushuko_fix に入庫確定 sagyo_kbn_id = 70 がある受注機材ヘッダー・作業場所は対象外）
--
-- ★ 親の伝票を探すとき、作業場所（sagyo_id）では照合しない（2026-10-01 追加）
--   HT は対応表の親の伝票に「親の明細ID・機材・作業区分 30・作業場所＝返却の入庫場所」を入れて送ってくる
--   （kizai_list_grid_row_provider.dart の denModel。sagyoId: target.nyushukoBashoId）。
--   親の入庫が KICS・YARD に分かれた受注で返却を片方にまとめて戻すと、親のその機材の伝票は別の場所にあるので
--   見つからず、dsp_ord_num が取れない → 親と紐づかない（本番で機材 57 行・コンテナ 7 行。2026-10-01 確認）。
--   親の伝票は受注・親ヘッダー・親の明細ID・作業区分・機材で決まる（親で同じ機材が KICS・YARD の両方に入る
--   ことはない前提。コンテナは両方の場所に行があっても dsp_ord_num は同じ）ので、作業場所の条件を外す。
--   ゲートは親の実際の伝票行をそのまま送るので、ゲートの RPC は変えない。
--
-- ロールバック: 20260930-ht-nyushuko-send-dsp.rollback.sql（本番の適用前の定義そのもの）

\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION public.nyushuko_send_20260626_1(nyushuko_result_list public.t_nyushuko_result[], nyushuko_ctn_result_list public.t_nyushuko_ctn_result[], result_oya_den_link_list public.ty_result_oya_den_link[], ctn_result_oya_den_link_list public.ty_ctn_result_oya_den_link[], juchu_kizai_head_kbn integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  -- 実績変更対象の受注ヘッダーID
  tgt_juchu_head_id int;

  -- 実績変更対象の作業区分ID
  tgt_sagyo_kbn_id int;

  -- 実績変更対象の作業場所ID
  tgt_sagyo_id int;

  -- 実績送信者（更新者）
  sender text;

  -- 最新の作業指示日を反映した入出庫実績データ
  updated_nyushuko_result_list public.t_nyushuko_result[];

  -- 最新の作業指示日と受注機材明細IDを反映した入出庫コンテナ実績データ
  updated_nyushuko_ctn_result_list public.t_nyushuko_ctn_result[];

  -- 以下、実績データの作業指示日と受注機材明細IDを補完するためのロジック制御用変数

  -- 入出庫実績データ、一時格納用変数
  tmp1_result_list public.t_nyushuko_result[] := '{}';
  tmp2_result_list public.t_nyushuko_result[] := '{}';

  -- 入出庫コンテナ実績データ、一時格納用変数
  tmp1_ctn_result_list public.t_nyushuko_ctn_result[] := '{}';
  tmp2_ctn_result_list public.t_nyushuko_ctn_result[] := '{}';

  -- 実績行データ
  result_rec public.t_nyushuko_result;
  ctn_result_rec public.t_nyushuko_ctn_result;

  -- 伝票機材を特定するためのキー
  -- ※juchu_head_id, juchu_kizai_head_id, sagyo_kbn_id, sagyo_den_dat, sagyo_id, kizai_id を「_」でつなげたもの
  den_kizai_key text;

  -- グループ（den_kizai_keyがキーのグループ）ごとの受注機材明細IDを記録するメモリ用マップ
  meisai_id_map jsonb := '{}'::jsonb;

  -- 明細を特定するためのキー
  -- ※juchu_head_id, juchu_kizai_head_id, sagyo_kbn_id, sagyo_den_dat, sagyo_id を「_」でつなげたもの
  meisai_key text;

  -- グループ（meisai_keyがキーのグループ）ごとの加算値を記録するメモリ用マップ
  increment_value_map jsonb := '{}'::jsonb;

  -- 該当伝票の受注機材明細ID
  matched_meisai_id int;

  -- 該当伝票の受注機材明細IDの最大値
  max_meisai_id int;

  -- 受注機材明細ID、一時格納用変数
  tmp_juchu_kizai_meisai_id int;

  -- 親機材として読んだタグの、親伝票の dsp_ord_num（入庫チェックで対応表にあるタグのみ。それ以外は null）
  oya_dsp_ord_num int;

  -- 同じ機材・同じ dsp_ord_num の既存伝票行の受注機材明細ID（再利用する明細ID）
  reuse_meisai_id int;

  -- HT が親機材として読んだタグに付けて送ってきた明細ID（親の明細ID）。振り直す前の値
  sent_meisai_id int;
begin
  ---------------------------------------------------------------------------------------------------------------------
  -- 受注ヘッダーID、作業区分ID、作業場所ID、更新者を、引数で渡された実績データから抜き出して変数にセット
  ---------------------------------------------------------------------------------------------------------------------

  -- 入出庫実績または入出庫コンテナ実績どちらかから取得できれば良い（どちらにも同じ値が入る想定のため）
  if cardinality(nyushuko_result_list) > 0 then
    -- 入出庫実績データが空でない場合
    tgt_juchu_head_id := (nyushuko_result_list[1]).juchu_head_id::int;
    tgt_sagyo_kbn_id := (nyushuko_result_list[1]).sagyo_kbn_id::int;
    tgt_sagyo_id := (nyushuko_result_list[1]).sagyo_id::int;
    sender := (nyushuko_result_list[1]).upd_user::text;
  elsif cardinality(nyushuko_ctn_result_list) > 0 then
    -- 入出庫コンテナ実績データが空でない場合
    tgt_juchu_head_id := (nyushuko_ctn_result_list[1]).juchu_head_id::int;
    tgt_sagyo_kbn_id := (nyushuko_ctn_result_list[1]).sagyo_kbn_id::int;
    tgt_sagyo_id := (nyushuko_ctn_result_list[1]).sagyo_id::int;
    sender := (nyushuko_ctn_result_list[1]).upd_user::text;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 実績データと親伝票の紐づきリストが空配列ならnullに変換
  ---------------------------------------------------------------------------------------------------------------------

  -- 入出庫実績データと親伝票の紐づきリスト
  if result_oya_den_link_list is not null and cardinality(result_oya_den_link_list) = 0 then
    result_oya_den_link_list := null;
  end if;

  -- 入出庫コンテナ実績データと親伝票の紐づきリスト
  if ctn_result_oya_den_link_list is not null and cardinality(ctn_result_oya_den_link_list) = 0 then
    ctn_result_oya_den_link_list := null;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 引数で渡された実績データの作業指示日を入出庫伝票テーブルから取得した日付で変更し、変更後の実績リストを変数にセットする
  -- ※HTアプリのリスト画面を表示した後にWEBアプリで日付が変更される可能性があるため、最新の日付を取得する
  ---------------------------------------------------------------------------------------------------------------------

  -- 入出庫伝票ヘッダーテーブルをロック
  lock table public.t_nyushuko_den in share mode;

  -- 入出庫実績データが空でない場合、実績データと対応する伝票の作業指示日を取得
  if cardinality(nyushuko_result_list) > 0 then
    select array(
      select
        row(
          r.juchu_head_id
          ,r.sagyo_kbn_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_kizai_head_id
          ,r.juchu_kizai_meisai_id
        )::public.t_nyushuko_result
      from
        unnest(nyushuko_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            public.t_nyushuko_den as d
          where
            d.juchu_head_id = r.juchu_head_id
            and d.juchu_kizai_head_id = r.juchu_kizai_head_id
            and d.sagyo_kbn_id = r.sagyo_kbn_id
            and d.sagyo_id = r.sagyo_id
          limit 1
        ) as d on true
    )
    into tmp1_result_list;
  end if;

  -- 入出庫コンテナ実績データが空でない場合、実績データと対応する伝票の作業指示日を取得
  if cardinality(nyushuko_ctn_result_list) > 0 then
    select array(
      select
        row(
          r.juchu_head_id
          ,r.sagyo_kbn_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_kizai_head_id
          ,r.juchu_kizai_meisai_id
        )::public.t_nyushuko_ctn_result
      from
        unnest(nyushuko_ctn_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            public.t_nyushuko_den as d
          where
            d.juchu_head_id = r.juchu_head_id
            and d.juchu_kizai_head_id = r.juchu_kizai_head_id
            and d.sagyo_kbn_id = r.sagyo_kbn_id
            and d.sagyo_id = r.sagyo_id
          limit 1
        ) as d on true
    )
    into tmp1_ctn_result_list;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 受注機材明細IDがない（入庫キープ/カット）の入出庫実績データに受注機材明細IDを採番してセットする
  ---------------------------------------------------------------------------------------------------------------------

  if cardinality(tmp1_result_list) > 0 then
    foreach result_rec in array tmp1_result_list loop
      -- 念のため初期化
      matched_meisai_id := null;
      max_meisai_id := null;
      oya_dsp_ord_num := null;
      reuse_meisai_id := null;
      sent_meisai_id := null;

      -- 入庫チェックで親機材として読んだタグの場合、対応表から親伝票の dsp_ord_num を求める
      --   ・受注機材明細IDがnull（ゲート）
      --   ・区分が通常以外で、対応表にあるタグ（HT。親の明細IDが付いてくる）
      -- ※作業日時では照合しない（result_rec.sagyo_den_dat は伝票の最新日時に置き換え済みで、対応表側と一致しないことがあるため）
      if tgt_sagyo_kbn_id = 30
        and result_oya_den_link_list is not null
        and (result_rec.juchu_kizai_meisai_id is null or juchu_kizai_head_kbn <> 1)
      then
        select
          d.dsp_ord_num
        into
          oya_dsp_ord_num
        from
          unnest(result_oya_den_link_list) link
          join public.t_nyushuko_den d
          on d.juchu_head_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_head_id')::int
          and d.juchu_kizai_head_id   = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_head_id')::int
          and d.juchu_kizai_meisai_id = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_meisai_id')::int
          and d.sagyo_kbn_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_kbn_id')::int
          -- 作業場所では照合しない（HT は対応表の作業場所に返却の入庫場所を入れてくるため。冒頭の★）
          and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
        where
          result_rec.juchu_head_id    = (row_to_json(link.nyushuko_result)::jsonb ->> 'juchu_head_id')::int
          and result_rec.sagyo_kbn_id = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_kbn_id')::int
          and result_rec.sagyo_id     = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_id')::int
          and result_rec.kizai_id     = (row_to_json(link.nyushuko_result)::jsonb ->> 'kizai_id')::int
          and result_rec.rfid_tag_id  = (row_to_json(link.nyushuko_result)::jsonb ->> 'rfid_tag_id')::text
        limit 1;
      end if;

      -- HT が親機材として読んだタグは、送られてきた明細ID（親の明細ID）を使わず振り直す
      if oya_dsp_ord_num is not null and result_rec.juchu_kizai_meisai_id is not null then
        sent_meisai_id := result_rec.juchu_kizai_meisai_id;
        result_rec.juchu_kizai_meisai_id := null;
      end if;

      -- キー生成
      -- ※den_kizai_key の末尾に親の dsp_ord_num を付ける（同じ機材でも親の行が違えば別の明細IDにする）
      den_kizai_key := format(
        '%s_%s_%s_%s_%s_%s_%s'
        ,result_rec.juchu_head_id
        ,result_rec.juchu_kizai_head_id
        ,result_rec.sagyo_kbn_id
        ,result_rec.sagyo_den_dat
        ,result_rec.sagyo_id
        ,result_rec.kizai_id
        ,coalesce(oya_dsp_ord_num::text, '')
      );
      meisai_key := format(
        '%s_%s_%s_%s_%s'
        ,result_rec.juchu_head_id
        ,result_rec.juchu_kizai_head_id
        ,result_rec.sagyo_kbn_id
        ,result_rec.sagyo_den_dat
        ,result_rec.sagyo_id
      );

      -- 受注機材明細IDがnullの場合
      if result_rec.juchu_kizai_meisai_id is null then
        if meisai_id_map ? den_kizai_key then
          -- グループに既に含まれている場合は受注機材明細IDを取り出す
          tmp_juchu_kizai_meisai_id := (meisai_id_map ->> den_kizai_key)::int;
        else
          -- 初めてグループが出てきた場合

          -- 親機材として読んだタグは、同じ機材・同じ dsp_ord_num の伝票行があればその明細IDを再利用する
          -- ※この修正より前に HT で作られた行（dsp_ord_num が NULL、明細ID＝親の明細ID）も対象にする。dsp_ord_num が一致する行を優先
          if oya_dsp_ord_num is not null then
            select
              d.juchu_kizai_meisai_id
            into
              reuse_meisai_id
            from
              public.t_nyushuko_den d
            where
              d.juchu_head_id           = result_rec.juchu_head_id
              and d.juchu_kizai_head_id = result_rec.juchu_kizai_head_id
              and d.sagyo_kbn_id        = result_rec.sagyo_kbn_id
              and d.sagyo_den_dat       = result_rec.sagyo_den_dat
              and d.sagyo_id            = result_rec.sagyo_id
              and d.kizai_id            = result_rec.kizai_id
              and (
                d.dsp_ord_num = oya_dsp_ord_num
                or (d.dsp_ord_num is null and d.juchu_kizai_meisai_id = sent_meisai_id)
              )
            order by
              (d.dsp_ord_num is null)
              ,d.juchu_kizai_meisai_id
            limit 1;
          end if;

          -- DBから受注機材明細IDを取得
          select
            max(case when d.kizai_id = result_rec.kizai_id then d.juchu_kizai_meisai_id end) as matched_meisai_id
            ,max(d.juchu_kizai_meisai_id) as max_meisai_id
          into
            matched_meisai_id
            ,max_meisai_id
          from
            public.t_nyushuko_den d
          where
            d.juchu_head_id           = result_rec.juchu_head_id
            and d.juchu_kizai_head_id = result_rec.juchu_kizai_head_id
            and d.sagyo_kbn_id        = result_rec.sagyo_kbn_id
            and d.sagyo_den_dat       = result_rec.sagyo_den_dat
            and d.sagyo_id            = result_rec.sagyo_id;

          -- 親機材として読んだタグは、伝票が無くても加算値で採番する
          -- （同じ機材を親の別の行の分として複数送ったとき、どれも 1 にならないように）
          if oya_dsp_ord_num is not null then
            max_meisai_id := coalesce(max_meisai_id, 0);
          end if;

          if reuse_meisai_id is not null then
            -- 再利用
            tmp_juchu_kizai_meisai_id := reuse_meisai_id;

          elsif max_meisai_id is not null then

            -- 機材明細IDのMax値 + 加算値をセット
            if increment_value_map ? meisai_key then
              -- 機材明細IDのMax値 + 加算値（マップから取り出した値 + 1）
              tmp_juchu_kizai_meisai_id := max_meisai_id + (increment_value_map ->> meisai_key)::int + 1;

              -- mapを更新
              increment_value_map := jsonb_set(
                increment_value_map
                ,array[meisai_key]
                ,to_jsonb((increment_value_map ->> meisai_key)::int + 1)
              );
            else
              -- 機材明細IDのMax値 + 加算値（1）
              tmp_juchu_kizai_meisai_id := max_meisai_id + 1;

              -- mapに追加
              increment_value_map := jsonb_set(
                increment_value_map
                ,array[meisai_key]
                ,to_jsonb(1)
              );
            end if;

          else
            -- 伝票がない場合 → 1をセット
            tmp_juchu_kizai_meisai_id := 1;

          end if;

          -- mapに追加
          meisai_id_map := jsonb_set(
            meisai_id_map
            ,array[den_kizai_key]
            ,to_jsonb(tmp_juchu_kizai_meisai_id)
          );
        end if;

        -- 受注機材明細IDセット
        result_rec.juchu_kizai_meisai_id := tmp_juchu_kizai_meisai_id;
      end if;

      tmp2_result_list := array_append(tmp2_result_list, result_rec);
    end loop;

    updated_nyushuko_result_list := tmp2_result_list;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 受注機材明細IDがない（入庫キープ/カット、出庫チェック予定外）の入出庫コンテナ実績データに受注機材明細IDを採番してセットする
  ---------------------------------------------------------------------------------------------------------------------

  if cardinality(tmp1_ctn_result_list) > 0 then
    foreach ctn_result_rec in array tmp1_ctn_result_list loop
      -- 念のため初期化
      matched_meisai_id := null;
      max_meisai_id := null;
      oya_dsp_ord_num := null;
      reuse_meisai_id := null;
      sent_meisai_id := null;

      -- 入庫チェックで親機材として読んだタグの場合、対応表から親伝票の dsp_ord_num を求める（機材の実績と同じ条件）
      -- ※作業日時では照合しない（機材の実績と同じ理由）
      -- ※HT のコンテナの対応表は実績側の明細IDが -1 だが、照合に明細IDは使わないので影響しない
      if tgt_sagyo_kbn_id = 30
        and ctn_result_oya_den_link_list is not null
        and (ctn_result_rec.juchu_kizai_meisai_id is null or juchu_kizai_head_kbn <> 1)
      then
        select
          d.dsp_ord_num
        into
          oya_dsp_ord_num
        from
          unnest(ctn_result_oya_den_link_list) link
          join public.t_nyushuko_den d
          on d.juchu_head_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_head_id')::int
          and d.juchu_kizai_head_id   = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_head_id')::int
          and d.juchu_kizai_meisai_id = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_meisai_id')::int
          and d.sagyo_kbn_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_kbn_id')::int
          -- 作業場所では照合しない（HT は対応表の作業場所に返却の入庫場所を入れてくるため。冒頭の★）
          and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
        where
          ctn_result_rec.juchu_head_id    = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'juchu_head_id')::int
          and ctn_result_rec.sagyo_kbn_id = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_kbn_id')::int
          and ctn_result_rec.sagyo_id     = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_id')::int
          and ctn_result_rec.kizai_id     = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'kizai_id')::int
          and ctn_result_rec.rfid_tag_id  = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'rfid_tag_id')::text
        limit 1;
      end if;

      -- HT が親機材として読んだタグは、送られてきた明細ID（親の明細ID）を使わず振り直す
      if oya_dsp_ord_num is not null and ctn_result_rec.juchu_kizai_meisai_id is not null then
        sent_meisai_id := ctn_result_rec.juchu_kizai_meisai_id;
        ctn_result_rec.juchu_kizai_meisai_id := null;
      end if;

      -- キー生成
      -- ※den_kizai_key の末尾に親の dsp_ord_num を付ける（同じ機材でも親の行が違えば別の明細IDにする）
      den_kizai_key := format(
        '%s_%s_%s_%s_%s_%s_%s'
        ,ctn_result_rec.juchu_head_id
        ,ctn_result_rec.juchu_kizai_head_id
        ,ctn_result_rec.sagyo_kbn_id
        ,ctn_result_rec.sagyo_den_dat
        ,ctn_result_rec.sagyo_id
        ,ctn_result_rec.kizai_id
        ,coalesce(oya_dsp_ord_num::text, '')
      );
      meisai_key := format(
        '%s_%s_%s_%s_%s'
        ,ctn_result_rec.juchu_head_id
        ,ctn_result_rec.juchu_kizai_head_id
        ,ctn_result_rec.sagyo_kbn_id
        ,ctn_result_rec.sagyo_den_dat
        ,ctn_result_rec.sagyo_id
      );

      -- 受注機材明細IDがnullの場合
      if ctn_result_rec.juchu_kizai_meisai_id is null then
        if meisai_id_map ? den_kizai_key then
          -- グループに既に含まれている場合は受注機材明細IDを取り出す
          tmp_juchu_kizai_meisai_id := (meisai_id_map ->> den_kizai_key)::int;
        else
          -- 初めてグループが出てきた場合

          -- 親機材として読んだタグは、同じ機材・同じ dsp_ord_num の伝票行があればその明細IDを再利用する
          -- ※この修正より前に HT で作られた行も対象にする（機材の実績と同じ）
          if oya_dsp_ord_num is not null then
            select
              d.juchu_kizai_meisai_id
            into
              reuse_meisai_id
            from
              public.t_nyushuko_den d
            where
              d.juchu_head_id           = ctn_result_rec.juchu_head_id
              and d.juchu_kizai_head_id = ctn_result_rec.juchu_kizai_head_id
              and d.sagyo_kbn_id        = ctn_result_rec.sagyo_kbn_id
              and d.sagyo_den_dat       = ctn_result_rec.sagyo_den_dat
              and d.sagyo_id            = ctn_result_rec.sagyo_id
              and d.kizai_id            = ctn_result_rec.kizai_id
              and (
                d.dsp_ord_num = oya_dsp_ord_num
                or (d.dsp_ord_num is null and d.juchu_kizai_meisai_id = sent_meisai_id)
              )
            order by
              (d.dsp_ord_num is null)
              ,d.juchu_kizai_meisai_id
            limit 1;
          end if;

          -- DBから受注機材明細IDを取得
          select
            max(case when d.kizai_id = ctn_result_rec.kizai_id then d.juchu_kizai_meisai_id end) as matched_meisai_id
            ,max(d.juchu_kizai_meisai_id) as max_meisai_id
          into
            matched_meisai_id
            ,max_meisai_id
          from
            public.t_nyushuko_den d
          where
            d.juchu_head_id           = ctn_result_rec.juchu_head_id
            and d.juchu_kizai_head_id = ctn_result_rec.juchu_kizai_head_id
            and d.sagyo_kbn_id        = ctn_result_rec.sagyo_kbn_id
            and d.sagyo_den_dat       = ctn_result_rec.sagyo_den_dat
            and d.sagyo_id            = ctn_result_rec.sagyo_id;

          -- 親機材として読んだタグは、伝票が無くても加算値で採番する
          if oya_dsp_ord_num is not null then
            max_meisai_id := coalesce(max_meisai_id, 0);
          end if;

          -- 入庫キープ/カットか、出庫チェック予定外かで処理を分岐
          if tgt_sagyo_kbn_id = 30 and reuse_meisai_id is not null then
            -- 入庫チェックで再利用できる場合
            tmp_juchu_kizai_meisai_id := reuse_meisai_id;

          elsif tgt_sagyo_kbn_id = 30 then
            -- 入庫チェックの場合
            if max_meisai_id is not null then
              -- 機材明細IDのMax値 + 加算値をセット
              if increment_value_map ? meisai_key then
                -- 機材明細IDのMax値 + 加算値（マップから取り出した値 + 1）
                tmp_juchu_kizai_meisai_id := max_meisai_id + (increment_value_map ->> meisai_key)::int + 1;

                -- mapを更新
                increment_value_map := jsonb_set(
                  increment_value_map
                  ,array[meisai_key]
                  ,to_jsonb((increment_value_map ->> meisai_key)::int + 1)
                );
              else
                -- 機材明細IDのMax値 + 加算値（1）
                tmp_juchu_kizai_meisai_id := max_meisai_id + 1;

                -- mapに追加
                increment_value_map := jsonb_set(
                  increment_value_map
                  ,array[meisai_key]
                  ,to_jsonb(1)
                );
              end if;

            else
              -- 伝票がない場合 → 1をセット
              tmp_juchu_kizai_meisai_id := 1;

            end if;
          else
            -- 入庫チェック以外（出庫チェック予定外）の場合
            if matched_meisai_id is not null then
              -- 伝票に対象機材がある場合 → その機材明細IDをセット
              tmp_juchu_kizai_meisai_id := matched_meisai_id;

            elsif max_meisai_id is not null then
              -- 伝票に対象機材がない場合 → 機材明細IDのMax値 + 加算値をセット
              if increment_value_map ? meisai_key then
                -- 機材明細IDのMax値 + 加算値（マップから取り出した値 + 1）
                tmp_juchu_kizai_meisai_id := max_meisai_id + (increment_value_map ->> meisai_key)::int + 1;

                -- mapを更新
                increment_value_map := jsonb_set(
                  increment_value_map
                  ,array[meisai_key]
                  ,to_jsonb((increment_value_map ->> meisai_key)::int + 1)
                );
              else
                -- 機材明細IDのMax値 + 加算値（1）
                tmp_juchu_kizai_meisai_id := max_meisai_id + 1;

                -- mapに追加
                increment_value_map := jsonb_set(
                  increment_value_map
                  ,array[meisai_key]
                  ,to_jsonb(1)
                );
              end if;

            else
              -- 伝票がない場合 → 1をセット
              tmp_juchu_kizai_meisai_id := 1;

            end if;
          end if;

          -- mapに追加
          meisai_id_map := jsonb_set(
            meisai_id_map
            ,array[den_kizai_key]
            ,to_jsonb(tmp_juchu_kizai_meisai_id)
          );
        end if;

        -- 受注機材明細IDセット
        ctn_result_rec.juchu_kizai_meisai_id := tmp_juchu_kizai_meisai_id;
      end if;

      tmp2_ctn_result_list := array_append(tmp2_ctn_result_list, ctn_result_rec);
    end loop;

    updated_nyushuko_ctn_result_list := tmp2_ctn_result_list;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 入出庫実績テーブルと入出庫コンテナ実績テーブルをUPSERT
  ---------------------------------------------------------------------------------------------------------------------

  -- 入出庫実績テーブルUPSERT（対象行のロックも自動で行われる）
  insert into public.t_nyushuko_result (
    juchu_head_id
    ,sagyo_kbn_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
    ,juchu_kizai_head_id
    ,juchu_kizai_meisai_id
  )
  select
    r.juchu_head_id
    ,r.sagyo_kbn_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
    ,r.juchu_kizai_head_id
    ,r.juchu_kizai_meisai_id
  from
    unnest(updated_nyushuko_result_list) as r
  on conflict (
    juchu_head_id
    ,sagyo_kbn_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id = excluded.shozoku_id
    ,upd_dat = now()
    ,upd_user = excluded.upd_user
    ,juchu_kizai_head_id = excluded.juchu_kizai_head_id
    ,juchu_kizai_meisai_id = excluded.juchu_kizai_meisai_id;

  -- 入出庫コンテナ実績テーブルUPSERT（対象行のロックも自動で行われる）
  insert into public.t_nyushuko_ctn_result (
    juchu_head_id
    ,sagyo_kbn_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
    ,juchu_kizai_head_id
    ,juchu_kizai_meisai_id
  )
  select
    r.juchu_head_id
    ,r.sagyo_kbn_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
    ,r.juchu_kizai_head_id
    ,r.juchu_kizai_meisai_id
  from
    unnest(updated_nyushuko_ctn_result_list) as r
  on conflict (
    juchu_head_id
    ,sagyo_kbn_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id = excluded.shozoku_id
    ,upd_dat = now()
    ,upd_user = excluded.upd_user
    ,juchu_kizai_head_id = excluded.juchu_kizai_head_id
    ,juchu_kizai_meisai_id = excluded.juchu_kizai_meisai_id;

  ---------------------------------------------------------------------------------------------------------------------
  -- 入出庫実績テーブルのデータを元に入出庫伝票ヘッダーテーブルをUPSERT
  ---------------------------------------------------------------------------------------------------------------------

  -- 入出庫実績テーブルをロック
  lock table public.t_nyushuko_result in share mode;

  -- 作業区分でUPSERT処理を分岐
  if tgt_sagyo_kbn_id = 30 then
    -- 入庫チェックの場合
    -- ※dsp_ord_num は GROUP BY に入れず、タグごとに求めて max() で集約する
    --   （同じ明細に「今回の対応表に無い前回分のタグ（null）」と「今回のタグ（値）」が混ざっても1行にまとめるため）
    -- ※対応表との照合に作業日時は使わない（採番時と同じ理由）
    with t_nyushuko_result_with_oya_dsp as (
      select
        r.juchu_head_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,(
          select
            d.dsp_ord_num
          from
            unnest(result_oya_den_link_list) link
            join public.t_nyushuko_den d
            on d.juchu_head_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_head_id')::int
            and d.juchu_kizai_head_id   = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_head_id')::int
            and d.juchu_kizai_meisai_id = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_meisai_id')::int
            and d.sagyo_kbn_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_kbn_id')::int
            -- 作業場所では照合しない（冒頭の★）
            and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
          where
            r.juchu_head_id     = (row_to_json(link.nyushuko_result)::jsonb ->> 'juchu_head_id')::int
            and r.sagyo_kbn_id  = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_kbn_id')::int
            and r.sagyo_id      = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_id')::int
            and r.kizai_id      = (row_to_json(link.nyushuko_result)::jsonb ->> 'kizai_id')::int
            and r.rfid_tag_id   = (row_to_json(link.nyushuko_result)::jsonb ->> 'rfid_tag_id')::text
          limit 1
        ) as oya_dsp_ord_num
      from
        public.t_nyushuko_result as r
      where
        r.juchu_head_id    = tgt_juchu_head_id
        and r.sagyo_kbn_id = tgt_sagyo_kbn_id
        and r.sagyo_id     = tgt_sagyo_id
        and r.kizai_id in (
          select
            inner_nr.kizai_id
          from
            unnest(updated_nyushuko_result_list) as inner_nr
        )
        and r.juchu_kizai_head_id in (
          select
            inner_nr.juchu_kizai_head_id
          from
            unnest(updated_nyushuko_result_list) as inner_nr
        )
    )
    ,t_nyushuko_result_with_next_numbers as (
      select
        r.juchu_head_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,count(*) as plan_qty
        ,count(*) as result_qty
        ,now() as add_dat
        ,sender as add_user
        ,max(r.oya_dsp_ord_num) as dsp_ord_num
      from
        t_nyushuko_result_with_oya_dsp as r
      group by
        r.juchu_head_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
    )
    insert into public.t_nyushuko_den as den (
      juchu_head_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,plan_qty
      ,result_qty
      ,add_dat
      ,add_user
      ,dsp_ord_num
    )
    select
      n.juchu_head_id
      ,n.juchu_kizai_head_id
      ,n.juchu_kizai_meisai_id
      ,n.sagyo_kbn_id
      ,n.sagyo_den_dat
      ,n.sagyo_id
      ,n.kizai_id
      ,n.plan_qty
      ,n.result_qty
      ,n.add_dat
      ,n.add_user
      ,n.dsp_ord_num
    from
      t_nyushuko_result_with_next_numbers n
    on conflict (
      juchu_head_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
    )
    do update set
      result_qty = excluded.result_qty
      -- NULL の既存行だけ埋める。ただし到着済み（入庫確定あり）の受注機材ヘッダー・作業場所は埋めない
      -- （到着時に親から引かれていない行を紐づけると、到着解除で親の入庫予定が増えるため）
      ,dsp_ord_num = case
        when den.dsp_ord_num is null
          and not exists (
            select
              1
            from
              public.t_nyushuko_fix f
            where
              f.juchu_head_id           = den.juchu_head_id
              and f.juchu_kizai_head_id = den.juchu_kizai_head_id
              and f.sagyo_kbn_id        = 70
              and f.sagyo_id            = den.sagyo_id
          )
        then excluded.dsp_ord_num
        else den.dsp_ord_num
      end
      ,upd_dat = now()
      ,upd_user = sender;
  else
    -- 入庫チェック以外の場合
    with t_nyushuko_result_with_next_numbers as (
      select
        r.juchu_head_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,count(*) as plan_qty
        ,count(*) as result_qty
        ,now() as add_dat
        ,sender as add_user
        ,row_number() over ( -- INSERT時のdsp_ord_numの加算値を取得する
          partition by
            r.juchu_head_id
            ,r.juchu_kizai_head_id
            ,r.sagyo_kbn_id
            ,r.sagyo_den_dat
            ,r.sagyo_id
          order by 1
        ) as insert_seq
      from
        public.t_nyushuko_result as r
      where
        r.juchu_head_id    = tgt_juchu_head_id
        and r.sagyo_kbn_id = tgt_sagyo_kbn_id
        and r.sagyo_id     = tgt_sagyo_id
        and r.kizai_id in (
          select
            inner_nr.kizai_id
          from
            unnest(updated_nyushuko_result_list) as inner_nr
        )
        and r.juchu_kizai_head_id in (
          select
            inner_nr.juchu_kizai_head_id
          from
            unnest(updated_nyushuko_result_list) as inner_nr
        )
      group by
        r.juchu_head_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
    )
    insert into public.t_nyushuko_den as den (
      juchu_head_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,plan_qty
      ,result_qty
      ,add_dat
      ,add_user
      ,dsp_ord_num
    )
    select
      n.juchu_head_id
      ,n.juchu_kizai_head_id
      ,n.juchu_kizai_meisai_id
      ,n.sagyo_kbn_id
      ,n.sagyo_den_dat
      ,n.sagyo_id
      ,n.kizai_id
      ,n.plan_qty
      ,n.result_qty
      ,n.add_dat
      ,n.add_user
      ,( -- dsp_ord_numは明細内のdsp_ord_numの最大値 + 加算値
        select
          coalesce(max(inner_d.dsp_ord_num), 0)
        from
          public.t_nyushuko_den inner_d
        where
          inner_d.juchu_head_id           = n.juchu_head_id
          and inner_d.juchu_kizai_head_id = n.juchu_kizai_head_id
          and inner_d.sagyo_kbn_id        = n.sagyo_kbn_id
          and inner_d.sagyo_den_dat       = n.sagyo_den_dat
          and inner_d.sagyo_id            = n.sagyo_id
      ) + n.insert_seq
    from
      t_nyushuko_result_with_next_numbers n
    on conflict (
      juchu_head_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
    )
    do update set
      result_qty = excluded.result_qty
      ,upd_dat = now()
      ,upd_user = sender;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 入出庫コンテナ実績テーブルのデータを元に入出庫伝票ヘッダーテーブルをUPSERT
  ---------------------------------------------------------------------------------------------------------------------

  -- 入出庫コンテナ実績テーブルをロック
  lock table public.t_nyushuko_ctn_result in share mode;

  -- 作業区分でUPSERT処理を分岐
  if tgt_sagyo_kbn_id = 30 then
    -- 入庫チェックの場合
    -- ※dsp_ord_num は GROUP BY に入れず、タグごとに求めて max() で集約する（機材の実績と同じ理由）
    with t_nyushuko_ctn_result_with_oya_dsp as (
      select
        r.juchu_head_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,(
          select
            d.dsp_ord_num
          from
            unnest(ctn_result_oya_den_link_list) link
            join public.t_nyushuko_den d
            on d.juchu_head_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_head_id')::int
            and d.juchu_kizai_head_id   = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_head_id')::int
            and d.juchu_kizai_meisai_id = (row_to_json(link.nyushuko_den)::jsonb ->> 'juchu_kizai_meisai_id')::int
            and d.sagyo_kbn_id          = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_kbn_id')::int
            -- 作業場所では照合しない（冒頭の★）
            and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
          where
            r.juchu_head_id     = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'juchu_head_id')::int
            and r.sagyo_kbn_id  = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_kbn_id')::int
            and r.sagyo_id      = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_id')::int
            and r.kizai_id      = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'kizai_id')::int
            and r.rfid_tag_id   = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'rfid_tag_id')::text
          limit 1
        ) as oya_dsp_ord_num
      from
        public.t_nyushuko_ctn_result as r
      where
        r.juchu_head_id    = tgt_juchu_head_id
        and r.sagyo_kbn_id = tgt_sagyo_kbn_id
        and r.sagyo_id     = tgt_sagyo_id
        and r.kizai_id in (
          select
            inner_nr.kizai_id
          from
            unnest(updated_nyushuko_ctn_result_list) as inner_nr
        )
        and r.juchu_kizai_head_id in (
          select
            inner_nr.juchu_kizai_head_id
          from
            unnest(updated_nyushuko_ctn_result_list) as inner_nr
        )
    )
    ,t_nyushuko_ctn_result_with_next_numbers as (
      select
        r.juchu_head_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,count(*) as plan_qty
        ,count(*) as result_qty
        ,now() as add_dat
        ,sender as add_user
        ,max(r.oya_dsp_ord_num) as dsp_ord_num
      from
        t_nyushuko_ctn_result_with_oya_dsp as r
      group by
        r.juchu_head_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
    )
    insert into public.t_nyushuko_den as den (
      juchu_head_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,plan_qty
      ,result_qty
      ,add_dat
      ,add_user
      ,dsp_ord_num
    )
    select
      n.juchu_head_id
      ,n.juchu_kizai_head_id
      ,n.juchu_kizai_meisai_id
      ,n.sagyo_kbn_id
      ,n.sagyo_den_dat
      ,n.sagyo_id
      ,n.kizai_id
      ,n.plan_qty
      ,n.result_qty
      ,n.add_dat
      ,n.add_user
      ,n.dsp_ord_num
    from
      t_nyushuko_ctn_result_with_next_numbers n
    on conflict (
      juchu_head_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
    )
    do update set
      result_qty = excluded.result_qty
      -- NULL の既存行だけ埋める。ただし到着済み（入庫確定あり）の受注機材ヘッダー・作業場所は埋めない
      -- （到着時に親から引かれていない行を紐づけると、到着解除で親の入庫予定が増えるため）
      ,dsp_ord_num = case
        when den.dsp_ord_num is null
          and not exists (
            select
              1
            from
              public.t_nyushuko_fix f
            where
              f.juchu_head_id           = den.juchu_head_id
              and f.juchu_kizai_head_id = den.juchu_kizai_head_id
              and f.sagyo_kbn_id        = 70
              and f.sagyo_id            = den.sagyo_id
          )
        then excluded.dsp_ord_num
        else den.dsp_ord_num
      end
      ,upd_dat = now()
      ,upd_user = sender;
  else
    -- 入庫チェック以外の場合
    with t_nyushuko_ctn_result_with_next_numbers as (
      select
        r.juchu_head_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,count(*) as plan_qty
        ,count(*) as result_qty
        ,now() as add_dat
        ,sender as add_user
        ,row_number() over ( -- INSERT時のdsp_ord_numの加算値を取得する
          partition by
            r.juchu_head_id
            ,r.juchu_kizai_head_id
            ,r.sagyo_kbn_id
            ,r.sagyo_den_dat
            ,r.sagyo_id
          order by 1
        ) as insert_seq
      from
        public.t_nyushuko_ctn_result as r
      where
        r.juchu_head_id    = tgt_juchu_head_id
        and r.sagyo_kbn_id = tgt_sagyo_kbn_id
        and r.sagyo_id     = tgt_sagyo_id
        and r.kizai_id in (
          select
            inner_nr.kizai_id
          from
            unnest(updated_nyushuko_ctn_result_list) as inner_nr
        )
        and r.juchu_kizai_head_id in (
          select
            inner_nr.juchu_kizai_head_id
          from
            unnest(updated_nyushuko_ctn_result_list) as inner_nr
        )
      group by
        r.juchu_head_id
        ,r.sagyo_kbn_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
        ,r.juchu_kizai_head_id
        ,r.juchu_kizai_meisai_id
    )
    insert into public.t_nyushuko_den as den (
      juchu_head_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,plan_qty
      ,result_qty
      ,add_dat
      ,add_user
      ,dsp_ord_num
    )
    select
      n.juchu_head_id
      ,n.juchu_kizai_head_id
      ,n.juchu_kizai_meisai_id
      ,n.sagyo_kbn_id
      ,n.sagyo_den_dat
      ,n.sagyo_id
      ,n.kizai_id
      ,n.plan_qty
      ,n.result_qty
      ,n.add_dat
      ,n.add_user
      ,( -- dsp_ord_numは明細内のdsp_ord_numの最大値 + 加算値
        select
          coalesce(max(inner_d.dsp_ord_num), 0)
        from
          public.t_nyushuko_den inner_d
        where
          inner_d.juchu_head_id           = n.juchu_head_id
          and inner_d.juchu_kizai_head_id = n.juchu_kizai_head_id
          and inner_d.sagyo_kbn_id        = n.sagyo_kbn_id
          and inner_d.sagyo_den_dat       = n.sagyo_den_dat
          and inner_d.sagyo_id            = n.sagyo_id
      ) + n.insert_seq
    from
      t_nyushuko_ctn_result_with_next_numbers n
    on conflict (
      juchu_head_id
      ,sagyo_kbn_id
      ,sagyo_den_dat
      ,sagyo_id
      ,kizai_id
      ,juchu_kizai_head_id
      ,juchu_kizai_meisai_id
    )
    do update set
      result_qty = excluded.result_qty
      ,upd_dat = now()
      ,upd_user = sender;
  end if;
end;
$function$
;

COMMIT;
