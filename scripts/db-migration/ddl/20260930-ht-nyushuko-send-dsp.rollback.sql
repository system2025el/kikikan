-- 20260930-ht-nyushuko-send-dsp.sql のロールバック
--
-- 本番の適用前の定義（2026-09-30 に pg_get_functiondef で取得、md5 acc961c7e6addd1c2c9e16d8888fcbcb）をそのまま戻す。
-- ステージングの適用前の定義も同一（md5 一致）。
--
-- 本番に適用する直前に、本番の定義の md5 が上の値のままか確認すること。
--
--   select md5(pg_get_functiondef('public.nyushuko_send_20260626_1'::regproc));

\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION public.nyushuko_send_20260626_1(nyushuko_result_list t_nyushuko_result[], nyushuko_ctn_result_list t_nyushuko_ctn_result[], result_oya_den_link_list ty_result_oya_den_link[], ctn_result_oya_den_link_list ty_ctn_result_oya_den_link[], juchu_kizai_head_kbn integer)
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
  -- 受注機材明細IDがない入出庫実績データに受注機材明細IDを採番してセットする
  ---------------------------------------------------------------------------------------------------------------------

  if cardinality(tmp1_result_list) > 0 then
    foreach result_rec in array tmp1_result_list loop
      -- キー生成
      den_kizai_key := format(
        '%s_%s_%s_%s_%s_%s'
        ,result_rec.juchu_head_id
        ,result_rec.juchu_kizai_head_id
        ,result_rec.sagyo_kbn_id
        ,result_rec.sagyo_den_dat
        ,result_rec.sagyo_id
        ,result_rec.kizai_id
      );
      meisai_key := format(
        '%s_%s_%s_%s_%s'
        ,result_rec.juchu_head_id
        ,result_rec.juchu_kizai_head_id
        ,result_rec.sagyo_kbn_id
        ,result_rec.sagyo_den_dat
        ,result_rec.sagyo_id
      );

      -- 念のため初期化
      matched_meisai_id := null;
      max_meisai_id := null;

      -- 受注機材明細IDがnullの場合
      if result_rec.juchu_kizai_meisai_id is null then
        if meisai_id_map ? den_kizai_key then
          -- グループに既に含まれている場合は受注機材明細IDを取り出す
          tmp_juchu_kizai_meisai_id := (meisai_id_map ->> den_kizai_key)::int;
        else
          -- 初めてグループが出てきた場合
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
  -- 受注機材明細IDがない（出庫チェック予定外）の入出庫コンテナ実績データに受注機材明細IDを採番してセットする
  ---------------------------------------------------------------------------------------------------------------------

  if cardinality(tmp1_ctn_result_list) > 0 then
    foreach ctn_result_rec in array tmp1_ctn_result_list loop
      -- キー生成
      den_kizai_key := format(
        '%s_%s_%s_%s_%s_%s'
        ,ctn_result_rec.juchu_head_id
        ,ctn_result_rec.juchu_kizai_head_id
        ,ctn_result_rec.sagyo_kbn_id
        ,ctn_result_rec.sagyo_den_dat
        ,ctn_result_rec.sagyo_id
        ,ctn_result_rec.kizai_id
      );
      meisai_key := format(
        '%s_%s_%s_%s_%s'
        ,ctn_result_rec.juchu_head_id
        ,ctn_result_rec.juchu_kizai_head_id
        ,ctn_result_rec.sagyo_kbn_id
        ,ctn_result_rec.sagyo_den_dat
        ,ctn_result_rec.sagyo_id
      );

      -- 念のため初期化
      matched_meisai_id := null;
      max_meisai_id := null;

      -- 受注機材明細IDがnullの場合
      if ctn_result_rec.juchu_kizai_meisai_id is null then
        if meisai_id_map ? den_kizai_key then
          -- グループに既に含まれている場合は受注機材明細IDを取り出す
          tmp_juchu_kizai_meisai_id := (meisai_id_map ->> den_kizai_key)::int;
        else
          -- 初めてグループが出てきた場合
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

          -- 入庫キープ/カットか、出庫チェック予定外かで処理を分岐
          if tgt_sagyo_kbn_id = 30 then
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

    -- 入庫チェックの場合、受注機材ヘッダー区分で分岐
    if juchu_kizai_head_kbn = 1 then
      -- 受注機材ヘッダー区分が通常の場合
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
              and d.sagyo_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_id')::int
              and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
            where
              r.juchu_head_id     = (row_to_json(link.nyushuko_result)::jsonb ->> 'juchu_head_id')::int
              and r.sagyo_kbn_id  = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_kbn_id')::int
              and r.sagyo_den_dat = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_den_dat')::timestamptz
              and r.sagyo_id      = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_id')::int
              and r.kizai_id      = (row_to_json(link.nyushuko_result)::jsonb ->> 'kizai_id')::int
              and r.rfid_tag_id   = (row_to_json(link.nyushuko_result)::jsonb ->> 'rfid_tag_id')::text
            limit 1
          ) as dsp_ord_num
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
              and d.sagyo_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_id')::int
              and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
            where
              r.juchu_head_id     = (row_to_json(link.nyushuko_result)::jsonb ->> 'juchu_head_id')::int
              and r.sagyo_kbn_id  = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_kbn_id')::int
              and r.sagyo_den_dat = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_den_dat')::timestamptz
              and r.sagyo_id      = (row_to_json(link.nyushuko_result)::jsonb ->> 'sagyo_id')::int
              and r.kizai_id      = (row_to_json(link.nyushuko_result)::jsonb ->> 'kizai_id')::int
              and r.rfid_tag_id   = (row_to_json(link.nyushuko_result)::jsonb ->> 'rfid_tag_id')::text
            limit 1
          )
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
        ,upd_dat = now()
        ,upd_user = sender;

    else
      -- 受注機材ヘッダー区分がカット/キープの場合
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
            and d.sagyo_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_id')::int
            and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
          where
            r.juchu_head_id     = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'juchu_head_id')::int
            and r.sagyo_kbn_id  = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_kbn_id')::int
            and r.sagyo_den_dat = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_den_dat')::timestamptz
            and r.sagyo_id      = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_id')::int
            and r.kizai_id      = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'kizai_id')::int
            and r.rfid_tag_id   = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'rfid_tag_id')::text
          limit 1
        ) as dsp_ord_num
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
            and d.sagyo_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'sagyo_id')::int
            and d.kizai_id              = (row_to_json(link.nyushuko_den)::jsonb ->> 'kizai_id')::int
          where
            r.juchu_head_id     = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'juchu_head_id')::int
            and r.sagyo_kbn_id  = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_kbn_id')::int
            and r.sagyo_den_dat = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_den_dat')::timestamptz
            and r.sagyo_id      = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'sagyo_id')::int
            and r.kizai_id      = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'kizai_id')::int
            and r.rfid_tag_id   = (row_to_json(link.nyushuko_ctn_result)::jsonb ->> 'rfid_tag_id')::text
          limit 1
        )
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
