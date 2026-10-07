-- 適用状況: ステージング 2026-09-25 / 本番 2026-10-07
--
-- 移動実績の送信RPCを1本に統合し、受注機材ヘッダー単位で伝票を更新する
--
-- 前提: 20260924-ido-juchu-meisai.sql（受注2列の追加）を先に適用しておくこと。
--
-- ★ 既存3本はそのまま残す
--   ido_send_20260716_1（HT） / rf_ido_send_20251225_1（ゲート） / el_ido_send_20251225_1（未使用）は
--   触らない。HT・ゲートが新関数に乗り換えるまで動き続ける必要があるため。
--   両アプリの移行が完了したら削除する（そのときは 20260925-ido-send-rpc.rollback.sql の
--   コメントにある DROP を使う）。
--
-- なぜ統合するのか
--   3本は関数名と schema 修飾の有無を除いて中身が完全に同一だった（本番・ステージングとも
--   正規化 diff で差分0）。写経で増やした結果、el_ だけコンテナ側の upd_user が
--   updated_ctn_result_list[1].upd_user（バッチ先頭の固定値）になるずれも生じていた。
--   これ以上コピーを増やさない。
--
--   新関数は全参照を public. で修飾する（search_path に依存しない）。
--   rf_ が無修飾だったため public_org0212 の同名テーブルを踏む余地があったが、それも塞がる。
--
-- ★★ どのタグがどの明細のものかは「アプリが決める」。この関数は判断しない ★★
--   HT・ゲートは読取時にすでに「同じ機材の行を上から埋め、予定数に達したら次の行へ」という
--   充当を画面上で行っている（HT: kizai_list_grid_row_provider.dart の preModelList ループ、
--   ゲート: MovementListForm.cs の FirstOrDefault(... ResultQty < PlanQty ...)）。
--   リストを明細単位（v_ido_den2_meisai_lst）にすれば、このループがそのまま明細への充当になる。
--   アプリは充当先の行が持つ juchu_head_id / juchu_kizai_head_id を実績に載せて送る。
--
--   この関数はその2列をそのまま保存するだけ。DB側で別途判断すると、
--   画面に見えているものと保存されるものが食い違う余地が生まれるため。
--
-- ⚠️ したがって、この関数は「受注2列を送るアプリ専用」
--   受注2列を送らない現行のHT・ゲートがこれを呼ぶと、タグはすべて 0/0 で保存され、
--   受注明細の伝票行は読取数0のままになる（明細単位で数えるため）。
--   現行アプリは既存3本を呼び続けること。乗り換えは「ビュー差し替え＋受注2列の送信」と同時に行う。
--
-- 新関数が既存3本と違うところ
--   1. UPSERT が受注2列を書く
--   2. 伝票の読取数の集計が 6キー → 8キー（6キー＋受注2列）
--   それ以外（作業指示日の最新化、UPSERT のキーと更新列、ロックの取り方）は既存と同じ。
--
-- ★ row(...)::t_ido_result はカラムの物理順に依存する
--   juchu_head_id / juchu_kizai_head_id は ALTER TABLE ADD COLUMN で末尾に付いたので12・13番目。
--   列を足し引きしたらこの関数も必ず直すこと。
--
-- 関連: scripts/db-migration/ddl/20260924-ido-juchu-meisai.sql
--       scripts/db-views/staging-only/v_ido_den2_meisai_lst.sql（HT・ゲートの乗り換え先ビュー）

\set ON_ERROR_STOP on

BEGIN;

CREATE OR REPLACE FUNCTION public.ido_send_20260925(
  ido_result_list     public.t_ido_result[],
  ido_ctn_result_list public.t_ido_ctn_result[]
)
RETURNS void
LANGUAGE plpgsql
AS $function$
declare
  -- 実績データ（最新の作業指示日反映済み）
  updated_result_list public.t_ido_result[] := '{}';
  updated_ctn_result_list public.t_ido_ctn_result[] := '{}';
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
          -- 充当先はアプリが決めて送ってくる。この関数は素通しする
          ,coalesce(r.juchu_head_id, 0)
          ,coalesce(r.juchu_kizai_head_id, 0)
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
          ,coalesce(r.juchu_head_id, 0)
          ,coalesce(r.juchu_kizai_head_id, 0)
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
    ,juchu_head_id
    ,juchu_kizai_head_id
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
    ,r.juchu_head_id
    ,r.juchu_kizai_head_id
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
    ,upd_user      = excluded.upd_user
    -- 送られてきた充当先で上書きする（アプリが決めたものが正）。
    -- ただし 0 で来たときは既存の割り当てを消さない。受注2列を送らないアプリが
    -- 混在した場合に、既に紐づいている実績を壊さないための保険
    ,juchu_head_id       = case when excluded.juchu_head_id <> 0
                                then excluded.juchu_head_id else t_ido_result.juchu_head_id end
    ,juchu_kizai_head_id = case when excluded.juchu_head_id <> 0
                                then excluded.juchu_kizai_head_id else t_ido_result.juchu_kizai_head_id end;

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
    ,juchu_head_id
    ,juchu_kizai_head_id
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
    ,r.juchu_head_id
    ,r.juchu_kizai_head_id
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
    ,upd_user      = excluded.upd_user
    ,juchu_head_id       = case when excluded.juchu_head_id <> 0
                                then excluded.juchu_head_id else t_ido_ctn_result.juchu_head_id end
    ,juchu_kizai_head_id = case when excluded.juchu_head_id <> 0
                                then excluded.juchu_kizai_head_id else t_ido_ctn_result.juchu_kizai_head_id end;

  ---------------------------------------------------------------------------------------------------------------------
  -- 移動実績テーブルのデータを元に、移動伝票ヘッダーテーブルをUPDATE
  --
  -- ★ 既存3本との違いが2つある
  --   1. 集計キーが 6キー → 8キー（受注2列を足す）。6キーのままだと同じ機材の明細行すべてに
  --      機材合計が入ってしまう（1機材2明細でタグ1本を読むと両方が read = 1 になる）
  --   2. 「実績があったグループ」だけでなく、実績が動いた機材の全明細を数え直す。
  --      タグが1本も割り当たらなかった明細の読取数を0に戻す必要があるため
  --
  -- 既存は foreach でタグ1本につき UPDATE を1回発行していた（100本読めば100回）。
  -- ここはバッチ全体で1文。更新者の入り方は既存と同じで、そのバッチでその機材を最後に読んだ人になる。
  --
  -- ★ unnest(composite[]) WITH ORDINALITY AS t(r, ord) とは書けない。
  --   別名リストを付けると composite が各列に展開され、r が1列目（integer）になってしまう。
  --   添字で1件ずつ取り出せば composite のまま扱え、(x.r).列名 で参照できる。
  ---------------------------------------------------------------------------------------------------------------------

  -- 移動実績テーブルをロック
  lock table public.t_ido_result in share mode;

  with touched as (
    -- 今回実績が動いた機材
    select distinct
      (x.r).ido_den_id    as ido_den_id
      ,(x.r).sagyo_kbn_id  as sagyo_kbn_id
      ,(x.r).sagyo_siji_id as sagyo_siji_id
      ,(x.r).sagyo_den_dat as sagyo_den_dat
      ,(x.r).sagyo_id      as sagyo_id
      ,(x.r).kizai_id      as kizai_id
      ,first_value((x.r).upd_user) over (
         partition by (x.r).ido_den_id, (x.r).sagyo_kbn_id, (x.r).sagyo_siji_id
                     ,(x.r).sagyo_den_dat, (x.r).sagyo_id, (x.r).kizai_id
         order by x.ord desc
       ) as upd_user
    from (
      select updated_result_list[i] as r, i as ord
      from generate_subscripts(updated_result_list, 1) as i
    ) x
  ),
  new_den as (
    -- その機材の全明細について、実績テーブルのタグ数を数える
    select
      d.ido_den_id
      ,d.sagyo_kbn_id
      ,d.sagyo_siji_id
      ,d.sagyo_den_dat
      ,d.sagyo_id
      ,d.kizai_id
      ,d.juchu_head_id
      ,d.juchu_kizai_head_id
      ,t.upd_user
      ,(
        select count(*)
        from public.t_ido_result as r
        where
          r.ido_den_id              = d.ido_den_id
          and r.sagyo_kbn_id        = d.sagyo_kbn_id
          and r.sagyo_siji_id       = d.sagyo_siji_id
          and r.sagyo_den_dat       = d.sagyo_den_dat
          and r.sagyo_id            = d.sagyo_id
          and r.kizai_id            = d.kizai_id
          and r.juchu_head_id       = d.juchu_head_id
          and r.juchu_kizai_head_id = d.juchu_kizai_head_id
      )::integer as counts
    from
      touched as t
      join public.t_ido_den as d
        on  d.ido_den_id    = t.ido_den_id
        and d.sagyo_kbn_id  = t.sagyo_kbn_id
        and d.sagyo_siji_id = t.sagyo_siji_id
        and d.sagyo_den_dat = t.sagyo_den_dat
        and d.sagyo_id      = t.sagyo_id
        and d.kizai_id      = t.kizai_id
  )
  update
    public.t_ido_den as den
  set
    result_qty = new_den.counts
    ,upd_dat   = now()
    ,upd_user  = new_den.upd_user
  from new_den
  where
    den.ido_den_id              = new_den.ido_den_id
    and den.sagyo_kbn_id        = new_den.sagyo_kbn_id
    and den.sagyo_siji_id       = new_den.sagyo_siji_id
    and den.sagyo_den_dat       = new_den.sagyo_den_dat
    and den.sagyo_id            = new_den.sagyo_id
    and den.kizai_id            = new_den.kizai_id
    and den.juchu_head_id       = new_den.juchu_head_id
    and den.juchu_kizai_head_id = new_den.juchu_kizai_head_id;

  ---------------------------------------------------------------------------------------------------------------------
  -- 移動コンテナ実績テーブルのデータを元に、移動伝票ヘッダーテーブルをUPDATE
  -- 上と同じ処理で、見るテーブルが t_ido_ctn_result になるだけ
  ---------------------------------------------------------------------------------------------------------------------

  -- 移動コンテナ実績テーブルをロック
  lock table public.t_ido_ctn_result in share mode;

  with touched as (
    select distinct
      (x.r).ido_den_id    as ido_den_id
      ,(x.r).sagyo_kbn_id  as sagyo_kbn_id
      ,(x.r).sagyo_siji_id as sagyo_siji_id
      ,(x.r).sagyo_den_dat as sagyo_den_dat
      ,(x.r).sagyo_id      as sagyo_id
      ,(x.r).kizai_id      as kizai_id
      ,first_value((x.r).upd_user) over (
         partition by (x.r).ido_den_id, (x.r).sagyo_kbn_id, (x.r).sagyo_siji_id
                     ,(x.r).sagyo_den_dat, (x.r).sagyo_id, (x.r).kizai_id
         order by x.ord desc
       ) as upd_user
    from (
      select updated_ctn_result_list[i] as r, i as ord
      from generate_subscripts(updated_ctn_result_list, 1) as i
    ) x
  ),
  new_den as (
    select
      d.ido_den_id
      ,d.sagyo_kbn_id
      ,d.sagyo_siji_id
      ,d.sagyo_den_dat
      ,d.sagyo_id
      ,d.kizai_id
      ,d.juchu_head_id
      ,d.juchu_kizai_head_id
      ,t.upd_user
      ,(
        select count(*)
        from public.t_ido_ctn_result as r
        where
          r.ido_den_id              = d.ido_den_id
          and r.sagyo_kbn_id        = d.sagyo_kbn_id
          and r.sagyo_siji_id       = d.sagyo_siji_id
          and r.sagyo_den_dat       = d.sagyo_den_dat
          and r.sagyo_id            = d.sagyo_id
          and r.kizai_id            = d.kizai_id
          and r.juchu_head_id       = d.juchu_head_id
          and r.juchu_kizai_head_id = d.juchu_kizai_head_id
      )::integer as counts
    from
      touched as t
      join public.t_ido_den as d
        on  d.ido_den_id    = t.ido_den_id
        and d.sagyo_kbn_id  = t.sagyo_kbn_id
        and d.sagyo_siji_id = t.sagyo_siji_id
        and d.sagyo_den_dat = t.sagyo_den_dat
        and d.sagyo_id      = t.sagyo_id
        and d.kizai_id      = t.kizai_id
  )
  update
    public.t_ido_den as den
  set
    result_qty = new_den.counts
    ,upd_dat   = now()
    ,upd_user  = new_den.upd_user
  from new_den
  where
    den.ido_den_id              = new_den.ido_den_id
    and den.sagyo_kbn_id        = new_den.sagyo_kbn_id
    and den.sagyo_siji_id       = new_den.sagyo_siji_id
    and den.sagyo_den_dat       = new_den.sagyo_den_dat
    and den.sagyo_id            = new_den.sagyo_id
    and den.kizai_id            = new_den.kizai_id
    and den.juchu_head_id       = new_den.juchu_head_id
    and den.juchu_kizai_head_id = new_den.juchu_kizai_head_id;

end;
$function$;

COMMENT ON FUNCTION public.ido_send_20260925(public.t_ido_result[], public.t_ido_ctn_result[]) IS
  '移動実績の送信。HT・ゲート共通。充当先（受注2列）はアプリが決めて送る。この関数は保存と読取数の明細単位での更新だけを行う';

GRANT EXECUTE ON FUNCTION public.ido_send_20260925(public.t_ido_result[], public.t_ido_ctn_result[]) TO anon;
GRANT EXECUTE ON FUNCTION public.ido_send_20260925(public.t_ido_result[], public.t_ido_ctn_result[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ido_send_20260925(public.t_ido_result[], public.t_ido_ctn_result[]) TO service_role;

-- 一時期、充当と読取数の数え直しを別関数に切り出していたが、既存3本と同じく本体に入れる方針にした
DROP FUNCTION IF EXISTS public.ido_recount_result_qty(public.t_ido_result[], boolean);
DROP FUNCTION IF EXISTS public.ido_allocate_juchu(public.t_ido_result[], boolean);

COMMIT;

-- 適用後の確認用（手で流す）
--   select p.proname, pg_get_function_identity_arguments(p.oid), p.proacl::text
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public'
--     and p.proname in ('ido_send_20260925','ido_send_20260716_1',
--                       'rf_ido_send_20251225_1','el_ido_send_20251225_1')
--   order by 1;
