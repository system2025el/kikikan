-- 適用状況: ステージング 2026-09-24 / 本番 2026-10-07
--
-- 送信RPC 3本の composite 型の要素数合わせ（20260924-ido-juchu-meisai.sql に必ずセットで適用する）
--
-- なぜ必要か
--   20260924-ido-juchu-meisai.sql で t_ido_result / t_ido_ctn_result に受注2列を足した結果、
--   composite 型が 11列 → 13列になった。関数内の row(...)::t_ido_result は列の物理順と個数に
--   依存しているため、11要素のままだと実行時に落ちる。
--
--     ERROR:  cannot cast type record to t_ido_result
--     DETAIL: Input has too few columns.
--
--   HT・ゲートからの実績送信が全部失敗するので、テーブル変更と同時に適用すること。
--
-- ★ これは「修理」であって機能追加ではない
--   row(...) の末尾に r.juchu_head_id / r.juchu_kizai_head_id を足しただけ。3本 × 2箇所 = 6箇所。
--   アプリは11列しか送ってこないので受注2列は NULL のまま流れ、INSERT 側は列を明示していないので
--   DEFAULT 0 が入る。つまり挙動は列追加前と完全に同じ。
--   タグを明細に紐づける充当ロジックは入っていない（別途あらためて設計する）。
--
-- ⚠️ 充当を入れるまで残る既知の副作用（ステージングで実測）
--   伝票の読取数を数え直す UPDATE の WHERE に受注2列が入っていないため、
--   同じ機材の明細行すべてに機材合計の読取数が入る。1機材2明細でタグを1本読むと
--   両方の行が read = 1 になり、画面上は合計2本読んだように見える。
--
--     kizai 1022 / 公演90399 plan 4 → result 1
--     kizai 1022 / 公演90559 plan 10 → result 1   ← 実際に読んだのは1本だけ
--
--   複数明細にまたがる機材でしか起きない（ステージングでは 150 / 3,832 行）。
--   充当ロジックを入れて集計を8キー（6キー＋受注2列）にすれば解消する。
--   それまで、複数明細の機材の差異表示は信用できない。
--
-- ★ 3本の本体は schema 修飾以外ほぼ同じだが、1箇所だけ食い違いがある
--   el_ido_send_20251225_1 のコンテナ側だけ upd_user が updated_ctn_result_list[1].upd_user
--   （バッチ先頭の固定値）になっており、他2本の tmp_ctn_result.upd_user とずれている。
--   今回は修理に徹するため、この差もそのまま残してある。直すなら3本まとめて別途。
--
-- 関連: scripts/db-migration/ddl/20260924-ido-juchu-meisai.sql

\set ON_ERROR_STOP on

BEGIN;

---------------------------------------------------------------------------------------------------
-- 1. ido_send_20260716_1 … HT（Flutter）専用
---------------------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.ido_send_20260716_1(ido_result_list t_ido_result[], ido_ctn_result_list t_ido_ctn_result[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  -- 実績データ（最新の作業指示日反映済み）
  updated_result_list public.t_ido_result[] := '{}';
  updated_ctn_result_list public.t_ido_ctn_result[] := '{}';

  -- 一時変数
  tmp_result public.t_ido_result;
  tmp_ctn_result public.t_ido_ctn_result;
begin
  ---------------------------------------------------------------------------------------------------------------------
  -- 引数で渡された実績データの作業指示日を移動伝票テーブルから取得した日付で変更し、変更後の実績リストを変数にセットする
  -- ※HTアプリのリスト画面を表示した後にWEBアプリで日付が変更される可能性があるため、最新の日付を取得する
  ---------------------------------------------------------------------------------------------------------------------

  -- 移動伝票テーブルをロック
  lock table public.t_ido_den in share mode;

  -- 移動実績データが空でない場合、実績データと対応する伝票の作業指示日を取得
  if cardinality(ido_result_list) > 0 then
    select array(
      select
        row(
          r.ido_den_id
          ,r.sagyo_kbn_id
          ,r.sagyo_siji_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          -- 受注2列。アプリは送ってこないので NULL のまま流れる
          ,r.juchu_head_id
          ,r.juchu_kizai_head_id
        )::public.t_ido_result
      from
        unnest(ido_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            public.t_ido_den as d
          where
            d.ido_den_id        = r.ido_den_id
            and d.sagyo_kbn_id  = r.sagyo_kbn_id
            and d.sagyo_siji_id = r.sagyo_siji_id
            and d.sagyo_id      = r.sagyo_id
          limit 1
        ) as d on true
    )
    into updated_result_list;
  end if;

  -- 移動コンテナ実績データが空でない場合、実績データと対応する伝票の作業指示日を取得
  if cardinality(ido_ctn_result_list) > 0 then
    select array(
      select
        row(
          r.ido_den_id
          ,r.sagyo_kbn_id
          ,r.sagyo_siji_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_head_id
          ,r.juchu_kizai_head_id
        )::public.t_ido_ctn_result
      from
        unnest(ido_ctn_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            public.t_ido_den as d
          where
            d.ido_den_id        = r.ido_den_id
            and d.sagyo_kbn_id  = r.sagyo_kbn_id
            and d.sagyo_siji_id = r.sagyo_siji_id
            and d.sagyo_id      = r.sagyo_id
          limit 1
        ) as d on true
    )
    into updated_ctn_result_list;
  end if;

  ---------------------------------------------------------------------------------------------------------------------
  -- 移動実績テーブルと移動コンテナ実績テーブルUPSERT
  ---------------------------------------------------------------------------------------------------------------------

  -- 移動実績テーブルUPSERT（対象行のロックも自動で行われる）
  insert into public.t_ido_result (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
  )
  select
    r.ido_den_id
    ,r.sagyo_kbn_id
    ,r.sagyo_siji_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
  from
    unnest(updated_result_list) as r
  on conflict (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id    = excluded.shozoku_id
    ,upd_dat       = now()
    ,upd_user      = excluded.upd_user;

  -- 移動コンテナ実績テーブルUPSERT（対象行のロックも自動で行われる）
  insert into public.t_ido_ctn_result (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
  )
  select
    r.ido_den_id
    ,r.sagyo_kbn_id
    ,r.sagyo_siji_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
  from
    unnest(updated_ctn_result_list) as r
  on conflict (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id    = excluded.shozoku_id
    ,upd_dat       = now()
    ,upd_user      = excluded.upd_user;

  ---------------------------------------------------------------------------------------------------------------------
  -- 移動実績テーブルのデータを元に、移動伝票ヘッダーテーブルをUPDATE
  ---------------------------------------------------------------------------------------------------------------------

  -- 移動実績テーブルをロック
  lock table public.t_ido_result in share mode;

  foreach tmp_result in array updated_result_list loop
    update
      public.t_ido_den as den
    set
      result_qty = new_den.counts
      ,upd_dat   = now()
      ,upd_user  = tmp_result.upd_user
    from (
      select
        ido_den_id
        ,sagyo_kbn_id
        ,sagyo_siji_id
        ,sagyo_den_dat
        ,sagyo_id
        ,kizai_id
        ,count(*) as counts
      from
        public.t_ido_result as r
      where
        r.ido_den_id        = tmp_result.ido_den_id
        and r.sagyo_kbn_id  = tmp_result.sagyo_kbn_id
        and r.sagyo_siji_id = tmp_result.sagyo_siji_id
        and r.sagyo_id      = tmp_result.sagyo_id
        and r.kizai_id      = tmp_result.kizai_id
      group by
        r.ido_den_id
        ,r.sagyo_kbn_id
        ,r.sagyo_siji_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
    ) as new_den
    where
      den.ido_den_id        = new_den.ido_den_id
      and den.sagyo_kbn_id  = new_den.sagyo_kbn_id
      and den.sagyo_siji_id = new_den.sagyo_siji_id
      and den.sagyo_den_dat = new_den.sagyo_den_dat
      and den.sagyo_id      = new_den.sagyo_id
      and den.kizai_id      = new_den.kizai_id;
  end loop;

  ---------------------------------------------------------------------------------------------------------------------
  -- 移動コンテナ実績テーブルのデータを元に、移動伝票ヘッダーテーブルをUPDATE
  ---------------------------------------------------------------------------------------------------------------------

  -- 移動コンテナ実績テーブルをロック
  lock table public.t_ido_ctn_result in share mode;

  foreach tmp_ctn_result in array updated_ctn_result_list loop
    update
      public.t_ido_den as den
    set
      result_qty = new_den.counts
      ,upd_dat   = now()
      ,upd_user  = tmp_ctn_result.upd_user
    from (
      select
        ido_den_id
        ,sagyo_kbn_id
        ,sagyo_siji_id
        ,sagyo_den_dat
        ,sagyo_id
        ,kizai_id
        ,count(*) as counts
      from
        public.t_ido_ctn_result as r
      where
        r.ido_den_id        = tmp_ctn_result.ido_den_id
        and r.sagyo_kbn_id  = tmp_ctn_result.sagyo_kbn_id
        and r.sagyo_siji_id = tmp_ctn_result.sagyo_siji_id
        and r.sagyo_id      = tmp_ctn_result.sagyo_id
        and r.kizai_id      = tmp_ctn_result.kizai_id
      group by
        r.ido_den_id
        ,r.sagyo_kbn_id
        ,r.sagyo_siji_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
    ) as new_den
    where
      den.ido_den_id        = new_den.ido_den_id
      and den.sagyo_kbn_id  = new_den.sagyo_kbn_id
      and den.sagyo_siji_id = new_den.sagyo_siji_id
      and den.sagyo_den_dat = new_den.sagyo_den_dat
      and den.sagyo_id      = new_den.sagyo_id
      and den.kizai_id      = new_den.kizai_id;
  end loop;

end;
$function$;

---------------------------------------------------------------------------------------------------
-- 2. rf_ido_send_20251225_1 … ゲート（C#）開発用
---------------------------------------------------------------------------------------------------
-- 本体は 1 と同じ。schema 修飾が無いのが元定義なので、そこも元のまま残している
CREATE OR REPLACE FUNCTION public.rf_ido_send_20251225_1(ido_result_list t_ido_result[], ido_ctn_result_list t_ido_ctn_result[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  updated_result_list t_ido_result[] := '{}';
  updated_ctn_result_list t_ido_ctn_result[] := '{}';

  tmp_result t_ido_result;
  tmp_ctn_result t_ido_ctn_result;
begin
  lock table t_ido_den in share mode;

  if cardinality(ido_result_list) > 0 then
    select array(
      select
        row(
          r.ido_den_id
          ,r.sagyo_kbn_id
          ,r.sagyo_siji_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_head_id
          ,r.juchu_kizai_head_id
        )::t_ido_result
      from
        unnest(ido_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            t_ido_den as d
          where
            d.ido_den_id        = r.ido_den_id
            and d.sagyo_kbn_id  = r.sagyo_kbn_id
            and d.sagyo_siji_id = r.sagyo_siji_id
            and d.sagyo_id      = r.sagyo_id
          limit 1
        ) as d on true
    )
    into updated_result_list;
  end if;

  if cardinality(ido_ctn_result_list) > 0 then
    select array(
      select
        row(
          r.ido_den_id
          ,r.sagyo_kbn_id
          ,r.sagyo_siji_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_head_id
          ,r.juchu_kizai_head_id
        )::t_ido_ctn_result
      from
        unnest(ido_ctn_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            t_ido_den as d
          where
            d.ido_den_id        = r.ido_den_id
            and d.sagyo_kbn_id  = r.sagyo_kbn_id
            and d.sagyo_siji_id = r.sagyo_siji_id
            and d.sagyo_id      = r.sagyo_id
          limit 1
        ) as d on true
    )
    into updated_ctn_result_list;
  end if;

  insert into t_ido_result (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
  )
  select
    r.ido_den_id
    ,r.sagyo_kbn_id
    ,r.sagyo_siji_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
  from
    unnest(updated_result_list) as r
  on conflict (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id    = excluded.shozoku_id
    ,upd_dat       = now()
    ,upd_user      = excluded.upd_user;

  insert into t_ido_ctn_result (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
  )
  select
    r.ido_den_id
    ,r.sagyo_kbn_id
    ,r.sagyo_siji_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
  from
    unnest(updated_ctn_result_list) as r
  on conflict (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id    = excluded.shozoku_id
    ,upd_dat       = now()
    ,upd_user      = excluded.upd_user;

  lock table t_ido_result in share mode;

  foreach tmp_result in array updated_result_list loop
    update
      t_ido_den as den
    set
      result_qty = new_den.counts
      ,upd_dat   = now()
      ,upd_user  = tmp_result.upd_user
    from (
      select
        ido_den_id
        ,sagyo_kbn_id
        ,sagyo_siji_id
        ,sagyo_den_dat
        ,sagyo_id
        ,kizai_id
        ,count(*) as counts
      from
        t_ido_result as r
      where
        r.ido_den_id        = tmp_result.ido_den_id
        and r.sagyo_kbn_id  = tmp_result.sagyo_kbn_id
        and r.sagyo_siji_id = tmp_result.sagyo_siji_id
        and r.sagyo_id      = tmp_result.sagyo_id
        and r.kizai_id      = tmp_result.kizai_id
      group by
        r.ido_den_id
        ,r.sagyo_kbn_id
        ,r.sagyo_siji_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
    ) as new_den
    where
      den.ido_den_id        = new_den.ido_den_id
      and den.sagyo_kbn_id  = new_den.sagyo_kbn_id
      and den.sagyo_siji_id = new_den.sagyo_siji_id
      and den.sagyo_den_dat = new_den.sagyo_den_dat
      and den.sagyo_id      = new_den.sagyo_id
      and den.kizai_id      = new_den.kizai_id;
  end loop;

  lock table t_ido_ctn_result in share mode;

  foreach tmp_ctn_result in array updated_ctn_result_list loop
    update
      t_ido_den as den
    set
      result_qty = new_den.counts
      ,upd_dat   = now()
      ,upd_user  = tmp_ctn_result.upd_user
    from (
      select
        ido_den_id
        ,sagyo_kbn_id
        ,sagyo_siji_id
        ,sagyo_den_dat
        ,sagyo_id
        ,kizai_id
        ,count(*) as counts
      from
        t_ido_ctn_result as r
      where
        r.ido_den_id        = tmp_ctn_result.ido_den_id
        and r.sagyo_kbn_id  = tmp_ctn_result.sagyo_kbn_id
        and r.sagyo_siji_id = tmp_ctn_result.sagyo_siji_id
        and r.sagyo_id      = tmp_ctn_result.sagyo_id
        and r.kizai_id      = tmp_ctn_result.kizai_id
      group by
        r.ido_den_id
        ,r.sagyo_kbn_id
        ,r.sagyo_siji_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
    ) as new_den
    where
      den.ido_den_id        = new_den.ido_den_id
      and den.sagyo_kbn_id  = new_den.sagyo_kbn_id
      and den.sagyo_siji_id = new_den.sagyo_siji_id
      and den.sagyo_den_dat = new_den.sagyo_den_dat
      and den.sagyo_id      = new_den.sagyo_id
      and den.kizai_id      = new_den.kizai_id;
  end loop;

end;
$function$;

---------------------------------------------------------------------------------------------------
-- 3. el_ido_send_20251225_1 … ゲート（C#）本番用
---------------------------------------------------------------------------------------------------
-- ★ コンテナ側の upd_user だけ他2本と違う（updated_ctn_result_list[1].upd_user）。
--   既存の差なので、修理に徹して今回はそのまま残す。
CREATE OR REPLACE FUNCTION public.el_ido_send_20251225_1(ido_result_list t_ido_result[], ido_ctn_result_list t_ido_ctn_result[])
 RETURNS void
 LANGUAGE plpgsql
AS $function$
declare
  updated_result_list public.t_ido_result[] := '{}';
  updated_ctn_result_list public.t_ido_ctn_result[] := '{}';

  tmp_result public.t_ido_result;
  tmp_ctn_result public.t_ido_ctn_result;
begin
  lock table public.t_ido_den in share mode;

  if cardinality(ido_result_list) > 0 then
    select array(
      select
        row(
          r.ido_den_id
          ,r.sagyo_kbn_id
          ,r.sagyo_siji_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_head_id
          ,r.juchu_kizai_head_id
        )::public.t_ido_result
      from
        unnest(ido_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            public.t_ido_den as d
          where
            d.ido_den_id        = r.ido_den_id
            and d.sagyo_kbn_id  = r.sagyo_kbn_id
            and d.sagyo_siji_id = r.sagyo_siji_id
            and d.sagyo_id      = r.sagyo_id
          limit 1
        ) as d on true
    )
    into updated_result_list;
  end if;

  if cardinality(ido_ctn_result_list) > 0 then
    select array(
      select
        row(
          r.ido_den_id
          ,r.sagyo_kbn_id
          ,r.sagyo_siji_id
          ,coalesce(d.sagyo_den_dat, r.sagyo_den_dat)
          ,r.sagyo_id
          ,r.kizai_id
          ,r.rfid_tag_id
          ,r.rfid_kizai_sts
          ,r.shozoku_id
          ,r.upd_dat
          ,r.upd_user
          ,r.juchu_head_id
          ,r.juchu_kizai_head_id
        )::public.t_ido_ctn_result
      from
        unnest(ido_ctn_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            public.t_ido_den as d
          where
            d.ido_den_id        = r.ido_den_id
            and d.sagyo_kbn_id  = r.sagyo_kbn_id
            and d.sagyo_siji_id = r.sagyo_siji_id
            and d.sagyo_id      = r.sagyo_id
          limit 1
        ) as d on true
    )
    into updated_ctn_result_list;
  end if;

  insert into public.t_ido_result (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
  )
  select
    r.ido_den_id
    ,r.sagyo_kbn_id
    ,r.sagyo_siji_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
  from
    unnest(updated_result_list) as r
  on conflict (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id    = excluded.shozoku_id
    ,upd_dat       = now()
    ,upd_user      = excluded.upd_user;

  insert into public.t_ido_ctn_result (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
    ,rfid_kizai_sts
    ,shozoku_id
    ,upd_dat
    ,upd_user
  )
  select
    r.ido_den_id
    ,r.sagyo_kbn_id
    ,r.sagyo_siji_id
    ,r.sagyo_den_dat
    ,r.sagyo_id
    ,r.kizai_id
    ,r.rfid_tag_id
    ,r.rfid_kizai_sts
    ,r.shozoku_id
    ,now()
    ,r.upd_user
  from
    unnest(updated_ctn_result_list) as r
  on conflict (
    ido_den_id
    ,sagyo_kbn_id
    ,sagyo_siji_id
    ,sagyo_den_dat
    ,sagyo_id
    ,kizai_id
    ,rfid_tag_id
  )
  do update set
    rfid_kizai_sts = excluded.rfid_kizai_sts
    ,shozoku_id    = excluded.shozoku_id
    ,upd_dat       = now()
    ,upd_user      = excluded.upd_user;

  lock table public.t_ido_result in share mode;

  foreach tmp_result in array updated_result_list loop
    update
      public.t_ido_den as den
    set
      result_qty = new_den.counts
      ,upd_dat   = now()
      ,upd_user  = tmp_result.upd_user
    from (
      select
        ido_den_id
        ,sagyo_kbn_id
        ,sagyo_siji_id
        ,sagyo_den_dat
        ,sagyo_id
        ,kizai_id
        ,count(*) as counts
      from
        public.t_ido_result as r
      where
        r.ido_den_id        = tmp_result.ido_den_id
        and r.sagyo_kbn_id  = tmp_result.sagyo_kbn_id
        and r.sagyo_siji_id = tmp_result.sagyo_siji_id
        and r.sagyo_id      = tmp_result.sagyo_id
        and r.kizai_id      = tmp_result.kizai_id
      group by
        r.ido_den_id
        ,r.sagyo_kbn_id
        ,r.sagyo_siji_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
    ) as new_den
    where
      den.ido_den_id        = new_den.ido_den_id
      and den.sagyo_kbn_id  = new_den.sagyo_kbn_id
      and den.sagyo_siji_id = new_den.sagyo_siji_id
      and den.sagyo_den_dat = new_den.sagyo_den_dat
      and den.sagyo_id      = new_den.sagyo_id
      and den.kizai_id      = new_den.kizai_id;
  end loop;

  lock table public.t_ido_ctn_result in share mode;

  foreach tmp_ctn_result in array updated_ctn_result_list loop
    update
      public.t_ido_den as den
    set
      result_qty = new_den.counts
      ,upd_dat   = now()
      ,upd_user  = updated_ctn_result_list[1].upd_user
    from (
      select
        ido_den_id
        ,sagyo_kbn_id
        ,sagyo_siji_id
        ,sagyo_den_dat
        ,sagyo_id
        ,kizai_id
        ,count(*) as counts
      from
        public.t_ido_ctn_result as r
      where
        r.ido_den_id        = tmp_ctn_result.ido_den_id
        and r.sagyo_kbn_id  = tmp_ctn_result.sagyo_kbn_id
        and r.sagyo_siji_id = tmp_ctn_result.sagyo_siji_id
        and r.sagyo_id      = tmp_ctn_result.sagyo_id
        and r.kizai_id      = tmp_ctn_result.kizai_id
      group by
        r.ido_den_id
        ,r.sagyo_kbn_id
        ,r.sagyo_siji_id
        ,r.sagyo_den_dat
        ,r.sagyo_id
        ,r.kizai_id
    ) as new_den
    where
      den.ido_den_id        = new_den.ido_den_id
      and den.sagyo_kbn_id  = new_den.sagyo_kbn_id
      and den.sagyo_siji_id = new_den.sagyo_siji_id
      and den.sagyo_den_dat = new_den.sagyo_den_dat
      and den.sagyo_id      = new_den.sagyo_id
      and den.kizai_id      = new_den.kizai_id;
  end loop;

end;
$function$;

COMMIT;
