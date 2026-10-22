-- 適用状況: ステージング 2026-10-21（2026-10-22 に読み過ぎの拒否メッセージを「準備数」→「事前数」に変えて再適用） / 本番 未適用
--
-- 入出庫の送信RPCを新しい関数 nyushuko_send_20261021_1 として作る（事前準備：事前ピッキング 80・事前最終確認 90 の送信を受ける）
-- 既存の nyushuko_send_20261009_1（del-meisai、ゲート dev が使用中）・nyushuko_send_20260626_1（HT master が使用中）は変更しない。
-- HT・ゲートは関数名を切り替えるだけで今までの送信（出庫 10/20・入庫 30・コンテナ）はそのまま動く
-- （引数・戻り値は同じ。80/90 以外の作業区分では、下の変更点 J1〜J5 の処理は一切通らない）。
--
-- 土台: db-functions/staging-only/20261009-nyushuko-send-ctn.sql（nyushuko_send_20261009_1。変更点1〜7）を丸ごと写している。
--   2026-10-21 に、そのファイルの関数本体がステージングの nyushuko_send_20261009_1 と完全一致することを確認済み。
--   そのため本番は、20261009 の関数を入れていなくてもこの DDL だけで動く（20261009 の変更点1〜7 もこの関数に入っている）。
--   20261009 の関数にあとから修正を入れた場合は、この関数にも同じ修正を入れること。
--
-- 変更点（作業区分 80/90 のときだけ。1回の送信は1つの作業区分＝読取画面ごとなので、本番と事前が混ざることは無い）
--   J1. 送信チェック（拒否は RAISE EXCEPTION。この送信の書き込みはすべて取り消される）
--       ・メインの受注機材ヘッダー（juchu_kizai_head_kbn = 1）以外、コンテナの実績が入っている送信は拒否
--       ・事前の伝票（この作業区分・作業場所・明細・機材）が無い機材は拒否（準備の無い機材・予定外）
--       ・本番（同じ受注機材ヘッダー・作業場所）が出発済みなら拒否。本番の出庫日時は t_juchu_kizai_nyushuko から取り、
--         t_nyushuko_fix（60、sagyo_fix_flg = 1）を見る（v_nyushuko_den の事前の行の shuko_fix_flg と同じ判定）
--       HT・ゲートは予定外・読み過ぎ・出発済みを画面で止めるので、ここは保険。HT はエラーの中身を出さず「送信失敗」だけ表示する。
--   J2. 実績を書いた後、明細ごとの読取数（今回の分を含む）が準備数（t_juchu_kizai_jizen.jizen_qty）を超えたら拒否する。
--       準備日を消した明細（事前準備の行が無い。受注削除として残した伝票）は準備数 0 として扱う。補正は見ない（読取数だけ）。
--   J3. 同じタグを本番（80→10、90→20）にも書く（1対1の反映）。日時は本番の同じ明細・機材・作業場所の伝票の日時。
--       本番の伝票が無ければ書かない。状態値・所属・更新者は事前の行と同じ（HT・ゲートは 80→12、90→22 で送る）。
--       本番に同じタグの行が既にあれば、受注機材ヘッダー・明細をこちらに付け替える（実績の主キーにヘッダー・明細が無いため）。
--       これで、本番のピッキング・最終確認の読取画面を開くと、事前で読んだタグが読取済みとして数えられる（アプリの改修不要）。
--   J4. コピーした本番の伝票の読取数（result_qty）を、実績から数え直す。対象は同じ受注・作業区分（10/20）・作業場所の、
--       送った機材の伝票すべて（付け替えで元の伝票の読取数が減る分も直すため）。値が変わる行だけ更新する。
--   J5. 実績の作業日時を伝票の最新の日時に置き換える処理で、80/90 は明細・機材も照合する（明細ごとに準備日時が違うため。
--       今までどおり受注・機材ヘッダー・作業区分・作業場所だけで limit 1 を取ると、別の明細の準備日時が付くことがある）。
--       HT・ゲートは出庫では明細IDを付けて送ってくる。
--
-- 前提: db-tables/staging-only/20261021-t-juchu-kizai-jizen.sql（t_juchu_kizai_jizen を参照する）。
--       ビュー・マスタとは独立（この関数はビューを参照しない）。
-- ★ 新しい関数なので GRANT を付ける（既存の送信RPCと同じく anon・authenticated に EXECUTE）
-- ★ 適用順: テーブル → マスタ → ビュー → この DDL → Web → HT・ゲート（関数名の切り替え）
--
-- ロールバック: 20261021-nyushuko-send-jizen.rollback.sql（この関数を DROP するだけ。既存の関数には影響しない）

\set ON_ERROR_STOP on

BEGIN;
CREATE OR REPLACE FUNCTION public.nyushuko_send_20261021_1(nyushuko_result_list public.t_nyushuko_result[], nyushuko_ctn_result_list public.t_nyushuko_ctn_result[], result_oya_den_link_list public.ty_result_oya_den_link[], ctn_result_oya_den_link_list public.ty_ctn_result_oya_den_link[], juchu_kizai_head_kbn integer)
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

  -- 出庫チェック（最終確認）の予定外コンテナで、同じ受注機材ヘッダーの別の作業場所にある同じ機材の明細ID
  -- （K と Y で同じコンテナの明細IDをそろえるため）
  other_basho_meisai_id int;

  -- 出庫の予定外コンテナの明細IDを受注機材ヘッダー単位で採番するときの、加算値マップのキー
  -- ※juchu_head_id, juchu_kizai_head_id を「_」でつなげて先頭に head_ を付けたもの（meisai_key と重ならない）
  head_meisai_key text;

  -- 事前準備（80/90）の送信を拒否するときの理由に出す機材
  jizen_ng_kizai_id int;
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
            -- 事前（80/90）は明細ごとに準備日時が違うので、明細・機材も照合する（変更点 J5）
            and (
              r.sagyo_kbn_id not in (80, 90)
              or (d.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id and d.kizai_id = r.kizai_id)
            )
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
            -- 事前（80/90）は明細ごとに準備日時が違うので、明細・機材も照合する（変更点 J5）
            and (
              r.sagyo_kbn_id not in (80, 90)
              or (d.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id and d.kizai_id = r.kizai_id)
            )
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

            -- 出庫チェック（最終確認）で、この作業場所の伝票に対象機材が無い場合は、
            -- 同じ受注機材ヘッダーの別の作業場所にある同じ機材（受注コンテナ明細・出庫チェックの伝票）の明細IDを探す
            other_basho_meisai_id := null;
            if matched_meisai_id is null and tgt_sagyo_kbn_id = 20 then
              select
                min(x.juchu_kizai_meisai_id)
              into
                other_basho_meisai_id
              from (
                select
                  c.juchu_kizai_meisai_id
                from
                  public.t_juchu_ctn_meisai c
                where
                  c.juchu_head_id           = ctn_result_rec.juchu_head_id
                  and c.juchu_kizai_head_id = ctn_result_rec.juchu_kizai_head_id
                  and c.kizai_id            = ctn_result_rec.kizai_id
                  and c.shozoku_id         <> ctn_result_rec.sagyo_id
                union all
                select
                  d.juchu_kizai_meisai_id
                from
                  public.t_nyushuko_den d
                where
                  d.juchu_head_id           = ctn_result_rec.juchu_head_id
                  and d.juchu_kizai_head_id = ctn_result_rec.juchu_kizai_head_id
                  and d.sagyo_kbn_id        = 20
                  and d.sagyo_id           <> ctn_result_rec.sagyo_id
                  and d.kizai_id            = ctn_result_rec.kizai_id
              ) x;
            end if;

            if matched_meisai_id is not null then
              -- 伝票に対象機材がある場合 → その機材明細IDをセット
              tmp_juchu_kizai_meisai_id := matched_meisai_id;

            elsif other_basho_meisai_id is not null then
              -- 別の作業場所に同じ機材がある場合 → その明細IDをセット（K と Y で明細IDをそろえる）
              tmp_juchu_kizai_meisai_id := other_basho_meisai_id;

            else
              -- 受注機材ヘッダー内に対象機材がない場合 → ヘッダー内のコンテナの明細IDのMax値 + 加算値をセット
              -- ※Max値は受注コンテナ明細と、コンテナの入出庫伝票（全作業区分・全作業場所）から取る（変更点6）。
              --   この作業場所の伝票だけの Max値だと、別の作業場所の別のコンテナと明細IDが重なるため。
              --   機材とは明細IDが重なってよい（コンテナかどうかで区別できる）ので、機材の明細IDは見ない
              select
                greatest(
                  coalesce((
                    select max(c.juchu_kizai_meisai_id) from public.t_juchu_ctn_meisai c
                    where c.juchu_head_id = ctn_result_rec.juchu_head_id
                      and c.juchu_kizai_head_id = ctn_result_rec.juchu_kizai_head_id
                  ), 0)
                  ,coalesce((
                    select max(d.juchu_kizai_meisai_id) from public.t_nyushuko_den d
                    join public.m_kizai k on k.kizai_id = d.kizai_id
                    where d.juchu_head_id = ctn_result_rec.juchu_head_id
                      and d.juchu_kizai_head_id = ctn_result_rec.juchu_kizai_head_id
                      and k.ctn_flg = 1
                  ), 0)
                )
              into
                max_meisai_id;

              -- 加算値はヘッダー単位で数える（この送信で採番した分を飛ばす）
              head_meisai_key := format('head_%s_%s', ctn_result_rec.juchu_head_id, ctn_result_rec.juchu_kizai_head_id);
              tmp_juchu_kizai_meisai_id := max_meisai_id + coalesce((increment_value_map ->> head_meisai_key)::int, 0) + 1;
              increment_value_map := jsonb_set(
                increment_value_map
                ,array[head_meisai_key]
                ,to_jsonb(coalesce((increment_value_map ->> head_meisai_key)::int, 0) + 1)
              );

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
  -- 事前準備（事前ピッキング 80・事前最終確認 90）の送信チェック（変更点 J1）
  -- ※拒否は RAISE EXCEPTION。この送信の書き込みはすべて取り消される
  ---------------------------------------------------------------------------------------------------------------------

  if tgt_sagyo_kbn_id in (80, 90) then
    -- 事前準備はメインの受注機材ヘッダーの機材だけ（返却・キープ・コンテナは対象外）
    if nyushuko_send_20261021_1.juchu_kizai_head_kbn <> 1 then
      raise exception '事前準備はメインの受注機材ヘッダーだけ送信できます（区分 %）', nyushuko_send_20261021_1.juchu_kizai_head_kbn;
    end if;
    if cardinality(nyushuko_ctn_result_list) > 0 then
      raise exception '事前準備ではコンテナは送信できません';
    end if;

    -- 事前の伝票（この作業区分・作業場所・明細・機材）が無い機材は送信できない（準備の無い機材・予定外）
    select
      r.kizai_id
    into
      jizen_ng_kizai_id
    from
      unnest(updated_nyushuko_result_list) as r
    where
      r.juchu_kizai_meisai_id is null
      or not exists (
        select
          1
        from
          public.t_nyushuko_den d
        where
          d.juchu_head_id             = r.juchu_head_id
          and d.juchu_kizai_head_id   = r.juchu_kizai_head_id
          and d.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id
          and d.kizai_id              = r.kizai_id
          and d.sagyo_kbn_id          = r.sagyo_kbn_id
          and d.sagyo_id              = r.sagyo_id
      )
    limit 1;
    if found then
      raise exception '事前準備の無い機材は送信できません（機材ID %）', jizen_ng_kizai_id;
    end if;

    -- 本番（同じ受注機材ヘッダー・作業場所の出庫）が出発済みなら送信できない
    -- ※出発は本番の出庫日時の確定（t_nyushuko_fix 60）。本番の出庫日時は t_juchu_kizai_nyushuko から取る（v_nyushuko_den と同じ）
    if exists (
      select
        1
      from
        (select distinct r.juchu_kizai_head_id from unnest(updated_nyushuko_result_list) as r) h
        join public.t_juchu_kizai_nyushuko n
          on n.juchu_head_id         = tgt_juchu_head_id
          and n.juchu_kizai_head_id  = h.juchu_kizai_head_id
          and n.nyushuko_shubetu_id  = 1
          and n.nyushuko_basho_id    = tgt_sagyo_id
        join public.t_nyushuko_fix f
          on f.juchu_head_id         = tgt_juchu_head_id
          and f.juchu_kizai_head_id  = h.juchu_kizai_head_id
          and f.sagyo_kbn_id         = 60
          and f.sagyo_den_dat        = n.nyushuko_dat
          and f.sagyo_id             = tgt_sagyo_id
          and f.sagyo_fix_flg        = 1
    ) then
      raise exception '本番の出庫が出発済みのため、事前準備は送信できません';
    end if;
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
  -- 事前準備（80/90）: 準備数を超える読取の拒否と、本番（10/20）への実績のコピー（変更点 J2・J3）
  ---------------------------------------------------------------------------------------------------------------------

  if tgt_sagyo_kbn_id in (80, 90) then
    -- 明細ごとの読取数（この送信で増えた分を含む）が準備数を超えたら拒否する
    -- ※準備数を減らしてあえて少なく用意する場合があるため。準備日を消した明細（事前準備の行が無い）は 0 として扱う
    select
      c.kizai_id
    into
      jizen_ng_kizai_id
    from
      (
        select
          r.juchu_head_id
          ,r.juchu_kizai_head_id
          ,r.juchu_kizai_meisai_id
          ,r.kizai_id
          ,count(*) as n
        from
          public.t_nyushuko_result r
        where
          r.juchu_head_id    = tgt_juchu_head_id
          and r.sagyo_kbn_id = tgt_sagyo_kbn_id
          and r.sagyo_id     = tgt_sagyo_id
          and (r.juchu_kizai_head_id, r.juchu_kizai_meisai_id, r.kizai_id) in (
            select
              u.juchu_kizai_head_id
              ,u.juchu_kizai_meisai_id
              ,u.kizai_id
            from
              unnest(updated_nyushuko_result_list) as u
          )
        group by
          r.juchu_head_id
          ,r.juchu_kizai_head_id
          ,r.juchu_kizai_meisai_id
          ,r.kizai_id
      ) c
      left join public.t_juchu_kizai_jizen j
        on j.juchu_head_id           = c.juchu_head_id
        and j.juchu_kizai_head_id    = c.juchu_kizai_head_id
        and j.juchu_kizai_meisai_id  = c.juchu_kizai_meisai_id
        and j.kizai_id               = c.kizai_id
    where
      c.n > coalesce(j.jizen_qty, 0)
    limit 1;
    if found then
      raise exception '事前数を超えて読み取った機材は送信できません（機材ID %）', jizen_ng_kizai_id;
    end if;

    -- 同じタグを本番（80→10、90→20）の同じ明細・機材・作業場所の伝票の日時で書く（1対1の反映）
    -- ※本番の伝票が無ければ書かない。状態値・所属・更新者は事前の行と同じ（HT・ゲートは 80→12、90→22 で送る）
    -- ※本番に同じタグの行が既にあれば（合体ヘッダーの別のヘッダーで読んだ行など）、ヘッダー・明細をこちらに付け替える
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
      ,tgt_sagyo_kbn_id - 70
      ,hd.sagyo_den_dat
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
      join lateral (
        select
          d.sagyo_den_dat
        from
          public.t_nyushuko_den d
        where
          d.juchu_head_id             = r.juchu_head_id
          and d.juchu_kizai_head_id   = r.juchu_kizai_head_id
          and d.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id
          and d.kizai_id              = r.kizai_id
          and d.sagyo_kbn_id          = tgt_sagyo_kbn_id - 70
          and d.sagyo_id              = r.sagyo_id
        order by
          d.sagyo_den_dat desc
        limit 1
      ) as hd on true
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
  end if;

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
      -- 親機材として読んだタグ（対応表にあるタグ）が既存行に合流した場合、予定数を読取数まで引き上げる
      -- ※新規行（INSERT）の「予定数＝読取数」と同じ考え方。greatest のため再送信しても値は変わらない
      -- ※自明細（子明細）として読んだタグのみの場合は予定数を変えない
      -- ※到着済み（入庫確定あり）の受注機材ヘッダー・作業場所は変えない（dsp_ord_num と同じ理由）
      ,plan_qty = case
        when excluded.dsp_ord_num is not null
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
        then greatest(den.plan_qty, excluded.plan_qty)
        else den.plan_qty
      end
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
        -- 通常の受注で受注機材明細が無い（読取画面を開いた後に削除された）機材は予定数0で作る（受注削除として出すため。冒頭の変更点5）
        -- 明細はあっても出庫場所が送信の作業場所と違う（読取画面を開いた後に出庫場所が変わった）機材も同じ（冒頭の変更点7）
        ,case
          when nyushuko_send_20261021_1.juchu_kizai_head_kbn = 1
            and not exists (
              select
                1
              from
                public.t_juchu_kizai_meisai m
              where
                m.juchu_head_id           = r.juchu_head_id
                and m.juchu_kizai_head_id = r.juchu_kizai_head_id
                and m.juchu_kizai_meisai_id = r.juchu_kizai_meisai_id
                and m.kizai_id            = r.kizai_id
                and m.shozoku_id          = r.sagyo_id
            )
          then 0
          else count(*)
        end as plan_qty
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
      -- 親機材として読んだタグ（対応表にあるタグ）が既存行に合流した場合、予定数を読取数まで引き上げる（機材の実績と同じ理由）
      ,plan_qty = case
        when excluded.dsp_ord_num is not null
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
        then greatest(den.plan_qty, excluded.plan_qty)
        else den.plan_qty
      end
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
      ,case
        -- 出庫チェック（最終確認）のコンテナは、受注コンテナ明細と同じ表示順にして K と Y でそろえる
        --   別の作業場所に同じ機材があればその表示順、無ければ 受注機材明細・受注コンテナ明細の表示順の最大値 + 加算値
        --   （受注機材明細も含めた最大値なので、同じ作業場所の機材の伝票の表示順とは重ならない）
        when n.sagyo_kbn_id = 20 then
          coalesce(
            (
              select
                min(c.dsp_ord_num)
              from
                public.t_juchu_ctn_meisai c
              where
                c.juchu_head_id           = n.juchu_head_id
                and c.juchu_kizai_head_id = n.juchu_kizai_head_id
                and c.kizai_id            = n.kizai_id
                and c.shozoku_id         <> n.sagyo_id
            )
            ,(
              select
                min(od.dsp_ord_num)
              from
                public.t_nyushuko_den od
              where
                od.juchu_head_id           = n.juchu_head_id
                and od.juchu_kizai_head_id = n.juchu_kizai_head_id
                and od.sagyo_kbn_id        = 20
                and od.sagyo_id           <> n.sagyo_id
                and od.kizai_id            = n.kizai_id
            )
            ,greatest(
              coalesce((
                select
                  max(km.dsp_ord_num)
                from
                  public.t_juchu_kizai_meisai km
                where
                  km.juchu_head_id           = n.juchu_head_id
                  and km.juchu_kizai_head_id = n.juchu_kizai_head_id
              ), 0)
              ,coalesce((
                select
                  max(cm.dsp_ord_num)
                from
                  public.t_juchu_ctn_meisai cm
                where
                  cm.juchu_head_id           = n.juchu_head_id
                  and cm.juchu_kizai_head_id = n.juchu_kizai_head_id
              ), 0)
            ) + n.insert_seq
          )
        else
          ( -- dsp_ord_numは明細内のdsp_ord_numの最大値 + 加算値
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
      end
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
      -- 出庫チェック（最終確認）のコンテナは、読取数が予定数を超えたら予定数を読取数まで引き上げる（値は減らない）
      -- ※出発済み（出庫確定あり）の受注機材ヘッダー・作業場所と、キープは変えない
      -- ※予定数は出発時に Web で 読取数 + 補正数 に確定する（入庫の到着と同じ考え方）
      ,plan_qty = case
        when den.sagyo_kbn_id = 20
          and not exists (
            select
              1
            from
              public.t_nyushuko_fix f
            where
              f.juchu_head_id           = den.juchu_head_id
              and f.juchu_kizai_head_id = den.juchu_kizai_head_id
              and f.sagyo_kbn_id        = 60
              and f.sagyo_id            = den.sagyo_id
          )
          and not exists (
            select
              1
            from
              public.t_juchu_kizai_head h
            where
              h.juchu_head_id           = den.juchu_head_id
              and h.juchu_kizai_head_id = den.juchu_kizai_head_id
              and h.juchu_kizai_head_kbn = 3
          )
        then greatest(den.plan_qty, excluded.plan_qty)
        else den.plan_qty
      end
      ,upd_dat = now()
      ,upd_user = sender;

    -- 出庫チェック（最終確認）のコンテナは、伝票と同時に受注コンテナ明細（その作業場所の行）を作る
    -- ※既にある行は、予定数を伝票の予定数まで引き上げるだけ（表示順・メモは変えない）
    -- ※出発済み（出庫確定あり）の受注機材ヘッダー・作業場所と、キープは対象外
    if tgt_sagyo_kbn_id = 20 then
      insert into public.t_juchu_ctn_meisai as cm (
        juchu_head_id
        ,juchu_kizai_head_id
        ,juchu_kizai_meisai_id
        ,kizai_id
        ,shozoku_id
        ,plan_kizai_qty
        ,dsp_ord_num
        ,indent_num
        ,add_dat
        ,add_user
      )
      select distinct on (d.juchu_kizai_head_id, d.juchu_kizai_meisai_id, d.kizai_id)
        d.juchu_head_id
        ,d.juchu_kizai_head_id
        ,d.juchu_kizai_meisai_id
        ,d.kizai_id
        ,d.sagyo_id
        ,d.plan_qty
        ,d.dsp_ord_num
        ,0
        ,now()
        ,sender
      from
        public.t_nyushuko_den d
        join public.t_juchu_kizai_head h
          on h.juchu_head_id           = d.juchu_head_id
          and h.juchu_kizai_head_id    = d.juchu_kizai_head_id
          and h.juchu_kizai_head_kbn  <> 3
      where
        d.juchu_head_id    = tgt_juchu_head_id
        and d.sagyo_kbn_id = 20
        and d.sagyo_id     = tgt_sagyo_id
        and exists (
          select
            1
          from
            unnest(updated_nyushuko_ctn_result_list) as r
          where
            r.juchu_kizai_head_id       = d.juchu_kizai_head_id
            and r.juchu_kizai_meisai_id = d.juchu_kizai_meisai_id
            and r.kizai_id              = d.kizai_id
            and r.sagyo_den_dat         = d.sagyo_den_dat
        )
        and not exists (
          select
            1
          from
            public.t_nyushuko_fix f
          where
            f.juchu_head_id           = d.juchu_head_id
            and f.juchu_kizai_head_id = d.juchu_kizai_head_id
            and f.sagyo_kbn_id        = 60
            and f.sagyo_id            = d.sagyo_id
        )
      order by
        d.juchu_kizai_head_id
        ,d.juchu_kizai_meisai_id
        ,d.kizai_id
        ,d.sagyo_den_dat desc
      on conflict (
        juchu_head_id
        ,juchu_kizai_head_id
        ,juchu_kizai_meisai_id
        ,kizai_id
        ,shozoku_id
      )
      do update set
        plan_kizai_qty = greatest(coalesce(cm.plan_kizai_qty, 0), excluded.plan_kizai_qty)
        ,upd_dat = now()
        ,upd_user = sender;
    end if;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 事前準備（80/90）: コピーした本番（10/20）の伝票の読取数を数え直す（変更点 J4）
  -- ※上の UPSERT は送信した作業区分（80/90）の伝票しか数え直さないため。
  --   同じ受注・作業区分・作業場所の、送った機材の本番の伝票をすべて実績から数え直す
  --   （タグが合体ヘッダーの別のヘッダー・明細から付け替わった場合、元の伝票の読取数も減らすため）
  ---------------------------------------------------------------------------------------------------------------------

  if tgt_sagyo_kbn_id in (80, 90) then
    update public.t_nyushuko_den as den
    set
      result_qty = c.n
      ,upd_dat = now()
      ,upd_user = sender
    from
      (
        select
          d.juchu_head_id
          ,d.juchu_kizai_head_id
          ,d.juchu_kizai_meisai_id
          ,d.sagyo_kbn_id
          ,d.sagyo_den_dat
          ,d.sagyo_id
          ,d.kizai_id
          ,(
            select
              count(*)
            from
              public.t_nyushuko_result r
            where
              r.juchu_head_id             = d.juchu_head_id
              and r.juchu_kizai_head_id   = d.juchu_kizai_head_id
              and r.juchu_kizai_meisai_id = d.juchu_kizai_meisai_id
              and r.sagyo_kbn_id          = d.sagyo_kbn_id
              and r.sagyo_den_dat         = d.sagyo_den_dat
              and r.sagyo_id              = d.sagyo_id
              and r.kizai_id              = d.kizai_id
          )::int as n
        from
          public.t_nyushuko_den d
        where
          d.juchu_head_id    = tgt_juchu_head_id
          and d.sagyo_kbn_id = tgt_sagyo_kbn_id - 70
          and d.sagyo_id     = tgt_sagyo_id
          and d.kizai_id in (
            select
              u.kizai_id
            from
              unnest(updated_nyushuko_result_list) as u
          )
      ) c
    where
      den.juchu_head_id             = c.juchu_head_id
      and den.juchu_kizai_head_id   = c.juchu_kizai_head_id
      and den.juchu_kizai_meisai_id = c.juchu_kizai_meisai_id
      and den.sagyo_kbn_id          = c.sagyo_kbn_id
      and den.sagyo_den_dat         = c.sagyo_den_dat
      and den.sagyo_id              = c.sagyo_id
      and den.kizai_id              = c.kizai_id
      and coalesce(den.result_qty, 0) <> c.n;
  end if;
end;
$function$
;

GRANT EXECUTE ON FUNCTION public.nyushuko_send_20261021_1(public.t_nyushuko_result[], public.t_nyushuko_ctn_result[], public.ty_result_oya_den_link[], public.ty_ctn_result_oya_den_link[], integer) TO anon, authenticated;

COMMIT;
