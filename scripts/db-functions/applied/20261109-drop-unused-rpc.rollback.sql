-- 20261109-drop-unused-rpc.sql のロールバック
--
-- 削除した14本を、削除直前の本番の定義（2026-11-09 に pg_get_functiondef で取得）・所有者・権限で作り直す。
-- 2026-11-09 に本番・ステージングとも、削除と同じトランザクションの中でこの内容から作り直して元と一致することを確認済み。
--
-- ★ ステージングに流すときの注意
--   rf_nyushuko_send_20251225_1・rf_v_rfid_refresh_20251225_1・el_v_rfid_refresh_20251225_1 はステージングの元の定義と違う
--   （本番の定義で作り直すことになる）。test_proc（ステージングのみ）も入っていない。
--   ステージングの元のとおりに戻すなら、デスクトップ「不要RPC/stg_20261109/restore_all.sql」を使う。
-- ★ 関数本体の改行コードは元の定義のまま（CRLF を含む）。git の autocrlf で変わることがあるが、動作には影響しない。
--   バイト一致が必要ならデスクトップ「不要RPC/prod_20261109/restore_all.sql」を使う。
-- ★ 権限の付け方は環境で違う（ステージングは関数を作ると anon にも自動で EXECUTE が付く）ので、
--   いったん REVOKE してから元の権限を付け直している。

\set ON_ERROR_STOP on

BEGIN;

-- el_den_info_20251225_1(integer,integer,integer,integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.el_den_info_20251225_1(p_juchu_head_id integer, p_sagyo_kbn_id integer, p_sagyo_id integer, p_juchu_kizai_head_kbn integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  kizai_id_list integer[];
  juchu_kizai_head_list jsonb;
  result jsonb;
begin
  with target as (
    -- t_nyushuko_denから対象の伝票を絞り込む
    select
      *
    from
      public.t_nyushuko_den
    where
      juchu_head_id    = p_juchu_head_id
      and sagyo_kbn_id = p_sagyo_kbn_id
      and sagyo_id     = p_sagyo_id
  )
  select -- 各リスト生成
    array(select distinct kizai_id from target) as kizai_id_list
    ,jsonb_agg(
      obj order by (obj->>'juchu_kizai_head_id')::int
    ) as juchu_kizai_head_list
  into
    kizai_id_list
    ,juchu_kizai_head_list
  from (
    select distinct
      jsonb_build_object(
        'juchu_kizai_head_id', h.juchu_kizai_head_id,
        'juchu_kizai_head_name', h.head_nam,
        'kizai_id_list', (
          select
            array_agg(d.kizai_id order by d.kizai_id)
          from
            public.t_nyushuko_den d
          where
            d.juchu_head_id           = p_juchu_head_id
            and d.juchu_kizai_head_id = h.juchu_kizai_head_id
            and d.sagyo_kbn_id        = p_sagyo_kbn_id
            and d.sagyo_id            = p_sagyo_id
        )
      ) as obj
    from
      target t
      join public.t_juchu_kizai_head h
      on t.juchu_head_id         = h.juchu_head_id
      and t.juchu_kizai_head_id  = h.juchu_kizai_head_id
      and h.juchu_kizai_head_kbn = p_juchu_kizai_head_kbn
  ) s;

  -- 結果をjsonbとしてまとめる
  result := jsonb_build_object(
    'kizai_id_list', kizai_id_list
    ,'juchu_kizai_head_list', juchu_kizai_head_list
  );

  return result;
end;
$function$;

ALTER FUNCTION public.el_den_info_20251225_1(integer,integer,integer,integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.el_den_info_20251225_1(integer,integer,integer,integer) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.el_den_info_20251225_1(integer,integer,integer,integer) TO PUBLIC;

-- el_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[])
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
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

ALTER FUNCTION public.el_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.el_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.el_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]) TO PUBLIC;

-- el_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.el_nyuko_list_cut_keep_20251225_1(juchu_head_id integer, target_datetime timestamp with time zone, basho_id integer, juchu_kizai_head_kbn integer)
 RETURNS TABLE(bld_cod text, tana_cod text, eda_cod text, kizai_id integer, kizai_nam text, plan_qty integer, result_qty integer, juchu_kizai_head_id integer, juchu_kizai_meisai_id integer, ctn_flg integer, dsp_ord_num_meisai integer, oya_juchu_kizai_head_id integer, oya_plan_qty integer, mem2 text)
 LANGUAGE sql
 STABLE
AS $function$

/*
  1. 条件に合致する「子」レコード（oya_juchu_kizai_head_idがNULLではないレコード）を抽出
  2. 抽出された子の「oya_juchu_kizai_head_id」の値（親のjuchu_kizai_head_id）を親レコードの「juchu_kizai_head_id」と照合
  3. 最終的に抽出されたすべての子レコードと親レコードを返す
*/

with
-- 1. 抽出条件に合致する「子」レコードを取得 oya_juchu_kizai_head_idに値があるものは「子」
children as (
  select
    den_lst.bld_cod
    ,den_lst.tana_cod
    ,den_lst.eda_cod
    ,den_lst.kizai_id
    ,den_lst.kizai_nam
    ,den_lst.plan_qty
    ,den_lst.result_qty
    ,den_lst.juchu_kizai_head_id
    ,den_lst.juchu_kizai_meisai_id
    ,den_lst.ctn_flg
    ,den_lst.dsp_ord_num_meisai
    ,den_lst.oya_juchu_kizai_head_id
    ,den_lst.oya_plan_qty
    ,den_lst.mem2
  from
    public.v_nyushuko_den2_lst_oyako as den_lst
  where
    den_lst.oya_juchu_kizai_head_id  is not null
    and
    den_lst.juchu_head_id = el_nyuko_list_cut_keep_20251225_1.juchu_head_id
    and
    den_lst.nyushuko_basho_id = el_nyuko_list_cut_keep_20251225_1.basho_id
    and
    den_lst.sagyo_kbn_id = 30
    and
    den_lst.juchu_kizai_head_kbnv::integer = el_nyuko_list_cut_keep_20251225_1.juchu_kizai_head_kbn   
    and
    den_lst.nyushuko_dat = el_nyuko_list_cut_keep_20251225_1.target_datetime
),
-- 2. 子が持つoya_juchu_kizai_head_idと親のjuchu_kizai_head_idが一致する「親」レコードを取得
parents as (
  select
    den_lst.bld_cod
    ,den_lst.tana_cod
    ,den_lst.eda_cod
    ,den_lst.kizai_id
    ,den_lst.kizai_nam
    ,den_lst.plan_qty
    ,den_lst.result_qty
    ,den_lst.juchu_kizai_head_id
    ,den_lst.juchu_kizai_meisai_id
    ,den_lst.ctn_flg
    ,den_lst.dsp_ord_num_meisai
    ,den_lst.oya_juchu_kizai_head_id
    ,den_lst.oya_plan_qty
    ,den_lst.mem2
  from
  public.v_nyushuko_den2_lst_oyako as den_lst
  left join
  children on den_lst.juchu_kizai_head_id = children.oya_juchu_kizai_head_id
  where
  den_lst.oya_juchu_kizai_head_id  is null 
  and
  den_lst.juchu_head_id = el_nyuko_list_cut_keep_20251225_1.juchu_head_id
  and
  den_lst.nyushuko_basho_id = el_nyuko_list_cut_keep_20251225_1.basho_id
  and
  den_lst.sagyo_kbn_id = 30
  and
  den_lst.juchu_kizai_head_kbnv::integer = 1
  and
  den_lst.juchu_kizai_head_id = children.oya_juchu_kizai_head_id
)

-- 3. 親と子のレコードを統合して返す

select *
from(
  select
    c.bld_cod
    ,c.tana_cod
    ,c.eda_cod
    ,c.kizai_id
    ,c.kizai_nam
    ,c.plan_qty
    ,c.result_qty
    ,c.juchu_kizai_head_id
    ,c.juchu_kizai_meisai_id
    ,c.ctn_flg
    ,c.dsp_ord_num_meisai
    ,c.oya_juchu_kizai_head_id
    ,c.oya_plan_qty
    ,c.mem2
  from children as c
  UNION
  select
    p.bld_cod
    ,p.tana_cod
    ,p.eda_cod
    ,p.kizai_id
    ,p.kizai_nam
    ,p.plan_qty
    ,p.result_qty
    ,p.juchu_kizai_head_id
    ,p.juchu_kizai_meisai_id
    ,p.ctn_flg
    ,p.dsp_ord_num_meisai
    ,p.oya_juchu_kizai_head_id
    ,p.oya_plan_qty
    ,p.mem2
  from parents as p
) as combi_records

order by
  oya_juchu_kizai_head_id is null 
  ,ctn_flg
  ,dsp_ord_num_meisai
$function$;

ALTER FUNCTION public.el_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.el_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.el_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer) TO PUBLIC;

-- el_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[])
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.el_nyushuko_send_20251225_1(nyushuko_result_list t_nyushuko_result[], nyushuko_ctn_result_list t_nyushuko_ctn_result[], result_oya_den_link_list ty_result_oya_den_link[], ctn_result_oya_den_link_list ty_ctn_result_oya_den_link[])
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
  -- 受注機材明細IDがない（入庫キープ/カット）の入出庫実績データに受注機材明細IDを採番してセットする
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
  -- 受注機材明細IDがない（入庫キープ/カット、出庫チェック予定外）の入出庫コンテナ実績データに受注機材明細IDを採番してセットする
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
    -- 入庫チェックの場合
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
$function$;

ALTER FUNCTION public.el_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.el_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.el_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]) TO PUBLIC;

-- el_v_rfid_refresh_20251225_1()
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.el_v_rfid_refresh_20251225_1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  refresh materialized view public.v_rfid;
end;
$function$;

ALTER FUNCTION public.el_v_rfid_refresh_20251225_1() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.el_v_rfid_refresh_20251225_1() FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.el_v_rfid_refresh_20251225_1() TO PUBLIC;

-- ido_send_20260716_1(t_ido_result[],t_ido_ctn_result[])
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
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

ALTER FUNCTION public.ido_send_20260716_1(t_ido_result[],t_ido_ctn_result[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.ido_send_20260716_1(t_ido_result[],t_ido_ctn_result[]) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.ido_send_20260716_1(t_ido_result[],t_ido_ctn_result[]) TO PUBLIC;

-- nyuko_list_cut_keep_20260716_1(integer,timestamp with time zone,integer,integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.nyuko_list_cut_keep_20260716_1(juchu_head_id integer, target_datetime timestamp with time zone, basho_id integer, juchu_kizai_head_kbn integer)
 RETURNS TABLE(bld_cod text, tana_cod text, eda_cod text, kizai_id integer, kizai_nam text, plan_qty integer, result_qty integer, juchu_kizai_head_id integer, juchu_kizai_meisai_id integer, ctn_flg integer, dsp_ord_num_meisai integer, oya_juchu_kizai_head_id integer, oya_plan_qty integer, mem2 text)
 LANGUAGE sql
 STABLE
AS $function$

/*
  1. 条件に合致する「子」レコード（oya_juchu_kizai_head_idがNULLではないレコード）を抽出
  2. 抽出された子の「oya_juchu_kizai_head_id」の値（親のjuchu_kizai_head_id）を親レコードの「juchu_kizai_head_id」と照合
  3. 最終的に抽出されたすべての子レコードと親レコードを返す
*/

with
-- 1. 抽出条件に合致する「子」レコードを取得 oya_juchu_kizai_head_idに値があるものは「子」
children as (
  select
    den_lst.bld_cod
    ,den_lst.tana_cod
    ,den_lst.eda_cod
    ,den_lst.kizai_id
    ,den_lst.kizai_nam
    ,den_lst.plan_qty
    ,den_lst.result_qty
    ,den_lst.juchu_kizai_head_id
    ,den_lst.juchu_kizai_meisai_id
    ,den_lst.ctn_flg
    ,den_lst.dsp_ord_num_meisai
    ,den_lst.oya_juchu_kizai_head_id
    ,den_lst.oya_plan_qty
    ,den_lst.mem2
  from
    public.v_nyushuko_den2_lst_oyako as den_lst
  where
    den_lst.oya_juchu_kizai_head_id  is not null
    and
    den_lst.juchu_head_id = nyuko_list_cut_keep_20260716_1.juchu_head_id
    and
    den_lst.nyushuko_basho_id = nyuko_list_cut_keep_20260716_1.basho_id
    and
    den_lst.sagyo_kbn_id = 30
    and
    den_lst.juchu_kizai_head_kbnv::integer = nyuko_list_cut_keep_20260716_1.juchu_kizai_head_kbn   
    and
    den_lst.nyushuko_dat = nyuko_list_cut_keep_20260716_1.target_datetime
),
-- 2. 子が持つoya_juchu_kizai_head_idと親のjuchu_kizai_head_idが一致する「親」レコードを取得
parents as (
  select
    den_lst.bld_cod
    ,den_lst.tana_cod
    ,den_lst.eda_cod
    ,den_lst.kizai_id
    ,den_lst.kizai_nam
    ,den_lst.plan_qty
    ,den_lst.result_qty
    ,den_lst.juchu_kizai_head_id
    ,den_lst.juchu_kizai_meisai_id
    ,den_lst.ctn_flg
    ,den_lst.dsp_ord_num_meisai
    ,den_lst.oya_juchu_kizai_head_id
    ,den_lst.oya_plan_qty
    ,den_lst.mem2
  from
  public.v_nyushuko_den2_lst_oyako as den_lst
  left join
  children on den_lst.juchu_kizai_head_id = children.oya_juchu_kizai_head_id
  where
  den_lst.oya_juchu_kizai_head_id  is null 
  and
  den_lst.juchu_head_id = nyuko_list_cut_keep_20260716_1.juchu_head_id
  and
  den_lst.nyushuko_basho_id = nyuko_list_cut_keep_20260716_1.basho_id
  and
  den_lst.sagyo_kbn_id = 30
  and
  den_lst.juchu_kizai_head_kbnv::integer = 1
  and
  den_lst.juchu_kizai_head_id = children.oya_juchu_kizai_head_id
)

-- 3. 親と子のレコードを統合して返す

select *
from(
  select
    c.bld_cod
    ,c.tana_cod
    ,c.eda_cod
    ,c.kizai_id
    ,c.kizai_nam
    ,c.plan_qty
    ,c.result_qty
    ,c.juchu_kizai_head_id
    ,c.juchu_kizai_meisai_id
    ,c.ctn_flg
    ,c.dsp_ord_num_meisai
    ,c.oya_juchu_kizai_head_id
    ,c.oya_plan_qty
    ,c.mem2
  from children as c
  UNION
  select
    p.bld_cod
    ,p.tana_cod
    ,p.eda_cod
    ,p.kizai_id
    ,p.kizai_nam
    ,p.plan_qty
    ,p.result_qty
    ,p.juchu_kizai_head_id
    ,p.juchu_kizai_meisai_id
    ,p.ctn_flg
    ,p.dsp_ord_num_meisai
    ,p.oya_juchu_kizai_head_id
    ,p.oya_plan_qty
    ,p.mem2
  from parents as p
) as combi_records

order by
  oya_juchu_kizai_head_id is null 
  ,ctn_flg
  ,dsp_ord_num_meisai
$function$;

ALTER FUNCTION public.nyuko_list_cut_keep_20260716_1(integer,timestamp with time zone,integer,integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.nyuko_list_cut_keep_20260716_1(integer,timestamp with time zone,integer,integer) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.nyuko_list_cut_keep_20260716_1(integer,timestamp with time zone,integer,integer) TO PUBLIC;

-- nyushuko_send_20260626_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
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
$function$;

ALTER FUNCTION public.nyushuko_send_20260626_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.nyushuko_send_20260626_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.nyushuko_send_20260626_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) TO PUBLIC;

-- nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.nyushuko_send_20261009_1(nyushuko_result_list t_nyushuko_result[], nyushuko_ctn_result_list t_nyushuko_ctn_result[], result_oya_den_link_list ty_result_oya_den_link[], ctn_result_oya_den_link_list ty_ctn_result_oya_den_link[], juchu_kizai_head_kbn integer)
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
          when nyushuko_send_20261009_1.juchu_kizai_head_kbn = 1
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
end;
$function$;

ALTER FUNCTION public.nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) TO anon;
GRANT EXECUTE ON FUNCTION public.nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer) TO authenticated;

-- rf_den_info_20251225_1(integer,integer,integer,integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.rf_den_info_20251225_1(p_juchu_head_id integer, p_sagyo_kbn_id integer, p_sagyo_id integer, p_juchu_kizai_head_kbn integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
declare
  kizai_id_list integer[];
  juchu_kizai_head_list jsonb;
  result jsonb;
begin
  with target as (
    -- t_nyushuko_denから対象の伝票を絞り込む
    select
      *
    from
      t_nyushuko_den
    where
      juchu_head_id    = p_juchu_head_id
      and sagyo_kbn_id = p_sagyo_kbn_id
      and sagyo_id     = p_sagyo_id
  )
  select -- 各リスト生成
    array(select distinct kizai_id from target) as kizai_id_list
    ,jsonb_agg(
      obj order by (obj->>'juchu_kizai_head_id')::int
    ) as juchu_kizai_head_list
  into
    kizai_id_list
    ,juchu_kizai_head_list
  from (
    select distinct
      jsonb_build_object(
        'juchu_kizai_head_id', h.juchu_kizai_head_id,
        'juchu_kizai_head_name', h.head_nam,
        'kizai_id_list', (
          select
            array_agg(d.kizai_id order by d.kizai_id)
          from
            t_nyushuko_den d
          where
            d.juchu_head_id           = p_juchu_head_id
            and d.juchu_kizai_head_id = h.juchu_kizai_head_id
            and d.sagyo_kbn_id        = p_sagyo_kbn_id
            and d.sagyo_id            = p_sagyo_id
        )
      ) as obj
    from
      target t
      join t_juchu_kizai_head h
      on t.juchu_head_id         = h.juchu_head_id
      and t.juchu_kizai_head_id  = h.juchu_kizai_head_id
      and h.juchu_kizai_head_kbn = p_juchu_kizai_head_kbn
  ) s;

  -- 結果をjsonbとしてまとめる
  result := jsonb_build_object(
    'kizai_id_list', kizai_id_list
    ,'juchu_kizai_head_list', juchu_kizai_head_list
  );

  return result;
end;
$function$;

ALTER FUNCTION public.rf_den_info_20251225_1(integer,integer,integer,integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.rf_den_info_20251225_1(integer,integer,integer,integer) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.rf_den_info_20251225_1(integer,integer,integer,integer) TO PUBLIC;

-- rf_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[])
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
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

ALTER FUNCTION public.rf_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.rf_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.rf_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]) TO PUBLIC;

-- rf_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer)
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.rf_nyuko_list_cut_keep_20251225_1(juchu_head_id integer, target_datetime timestamp with time zone, basho_id integer, juchu_kizai_head_kbn integer)
 RETURNS TABLE(bld_cod text, tana_cod text, eda_cod text, kizai_id integer, kizai_nam text, plan_qty integer, result_qty integer, juchu_kizai_head_id integer, juchu_kizai_meisai_id integer, ctn_flg integer, dsp_ord_num_meisai integer, oya_juchu_kizai_head_id integer, oya_plan_qty integer, mem2 text)
 LANGUAGE sql
 STABLE
AS $function$

/*
  1. 条件に合致する「子」レコード（oya_juchu_kizai_head_idがNULLではないレコード）を抽出
  2. 抽出された子の「oya_juchu_kizai_head_id」の値（親のjuchu_kizai_head_id）を親レコードの「juchu_kizai_head_id」と照合
  3. 最終的に抽出されたすべての子レコードと親レコードを返す
*/

with
-- 1. 抽出条件に合致する「子」レコードを取得 oya_juchu_kizai_head_idに値があるものは「子」
children as (
  select
    den_lst.bld_cod
    ,den_lst.tana_cod
    ,den_lst.eda_cod
    ,den_lst.kizai_id
    ,den_lst.kizai_nam
    ,den_lst.plan_qty
    ,den_lst.result_qty
    ,den_lst.juchu_kizai_head_id
    ,den_lst.juchu_kizai_meisai_id
    ,den_lst.ctn_flg
    ,den_lst.dsp_ord_num_meisai
    ,den_lst.oya_juchu_kizai_head_id
    ,den_lst.oya_plan_qty
    ,den_lst.mem2
  from
    v_nyushuko_den2_lst_oyako as den_lst
  where
    den_lst.oya_juchu_kizai_head_id  is not null
    and
    den_lst.juchu_head_id = rf_nyuko_list_cut_keep_20251225_1.juchu_head_id
    and
    den_lst.nyushuko_basho_id = rf_nyuko_list_cut_keep_20251225_1.basho_id
    and
    den_lst.sagyo_kbn_id = 30
    and
    den_lst.juchu_kizai_head_kbnv::integer = rf_nyuko_list_cut_keep_20251225_1.juchu_kizai_head_kbn   
    and
    den_lst.nyushuko_dat = rf_nyuko_list_cut_keep_20251225_1.target_datetime
),
-- 2. 子が持つoya_juchu_kizai_head_idと親のjuchu_kizai_head_idが一致する「親」レコードを取得
parents as (
  select
    den_lst.bld_cod
    ,den_lst.tana_cod
    ,den_lst.eda_cod
    ,den_lst.kizai_id
    ,den_lst.kizai_nam
    ,den_lst.plan_qty
    ,den_lst.result_qty
    ,den_lst.juchu_kizai_head_id
    ,den_lst.juchu_kizai_meisai_id
    ,den_lst.ctn_flg
    ,den_lst.dsp_ord_num_meisai
    ,den_lst.oya_juchu_kizai_head_id
    ,den_lst.oya_plan_qty
    ,den_lst.mem2
  from
  v_nyushuko_den2_lst_oyako as den_lst
  left join
  children on den_lst.juchu_kizai_head_id = children.oya_juchu_kizai_head_id
  where
  den_lst.oya_juchu_kizai_head_id  is null 
  and
  den_lst.juchu_head_id = rf_nyuko_list_cut_keep_20251225_1.juchu_head_id
  and
  den_lst.nyushuko_basho_id = rf_nyuko_list_cut_keep_20251225_1.basho_id
  and
  den_lst.sagyo_kbn_id = 30
  and
  den_lst.juchu_kizai_head_kbnv::integer = 1
  and
  den_lst.juchu_kizai_head_id = children.oya_juchu_kizai_head_id
)

-- 3. 親と子のレコードを統合して返す

select *
from(
  select
    c.bld_cod
    ,c.tana_cod
    ,c.eda_cod
    ,c.kizai_id
    ,c.kizai_nam
    ,c.plan_qty
    ,c.result_qty
    ,c.juchu_kizai_head_id
    ,c.juchu_kizai_meisai_id
    ,c.ctn_flg
    ,c.dsp_ord_num_meisai
    ,c.oya_juchu_kizai_head_id
    ,c.oya_plan_qty
    ,c.mem2
  from children as c
  UNION
  select
    p.bld_cod
    ,p.tana_cod
    ,p.eda_cod
    ,p.kizai_id
    ,p.kizai_nam
    ,p.plan_qty
    ,p.result_qty
    ,p.juchu_kizai_head_id
    ,p.juchu_kizai_meisai_id
    ,p.ctn_flg
    ,p.dsp_ord_num_meisai
    ,p.oya_juchu_kizai_head_id
    ,p.oya_plan_qty
    ,p.mem2
  from parents as p
) as combi_records

order by
  oya_juchu_kizai_head_id is null 
  ,ctn_flg
  ,dsp_ord_num_meisai
$function$;

ALTER FUNCTION public.rf_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.rf_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.rf_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer) TO PUBLIC;

-- rf_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[])
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.rf_nyushuko_send_20251225_1(nyushuko_result_list t_nyushuko_result[], nyushuko_ctn_result_list t_nyushuko_ctn_result[], result_oya_den_link_list ty_result_oya_den_link[], ctn_result_oya_den_link_list ty_ctn_result_oya_den_link[])
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
  updated_nyushuko_result_list t_nyushuko_result[];

  -- 最新の作業指示日と受注機材明細IDを反映した入出庫コンテナ実績データ
  updated_nyushuko_ctn_result_list t_nyushuko_ctn_result[];

  -- 以下、実績データの作業指示日と受注機材明細IDを補完するためのロジック制御用変数

  -- 入出庫実績データ、一時格納用変数
  tmp1_result_list t_nyushuko_result[] := '{}';
  tmp2_result_list t_nyushuko_result[] := '{}';

  -- 入出庫コンテナ実績データ、一時格納用変数
  tmp1_ctn_result_list t_nyushuko_ctn_result[] := '{}';
  tmp2_ctn_result_list t_nyushuko_ctn_result[] := '{}';

  -- 実績行データ
  result_rec t_nyushuko_result;
  ctn_result_rec t_nyushuko_ctn_result;

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
  lock table t_nyushuko_den in share mode;

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
        )::t_nyushuko_result
      from
        unnest(nyushuko_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            t_nyushuko_den as d
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
        )::t_nyushuko_ctn_result
      from
        unnest(nyushuko_ctn_result_list) as r
        left join lateral (
          select
            d.sagyo_den_dat
          from
            t_nyushuko_den as d
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
            t_nyushuko_den d
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
  -- 受注機材明細IDがない（入庫キープ/カット、出庫チェック予定外）の入出庫コンテナ実績データに受注機材明細IDを採番してセットする
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
            t_nyushuko_den d
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
  insert into t_nyushuko_result (
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
  insert into t_nyushuko_ctn_result (
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
  lock table t_nyushuko_result in share mode;

  -- 作業区分でUPSERT処理を分岐
  if tgt_sagyo_kbn_id = 30 then
    -- 入庫チェックの場合
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
            join t_nyushuko_den d
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
        t_nyushuko_result as r
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
            join t_nyushuko_den d
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
    insert into t_nyushuko_den as den (
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
        t_nyushuko_result as r
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
    insert into t_nyushuko_den as den (
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
          t_nyushuko_den inner_d
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
  lock table t_nyushuko_ctn_result in share mode;

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
            join t_nyushuko_den d
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
        t_nyushuko_ctn_result as r
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
            join t_nyushuko_den d
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
    insert into t_nyushuko_den as den (
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
        t_nyushuko_ctn_result as r
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
    insert into t_nyushuko_den as den (
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
          t_nyushuko_den inner_d
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
$function$;

ALTER FUNCTION public.rf_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.rf_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]) FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.rf_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]) TO PUBLIC;

-- rf_v_rfid_refresh_20251225_1()
-- バックアップ元: 本番 exekmmbmletvrzpavmzg / 2026-11-09
CREATE OR REPLACE FUNCTION public.rf_v_rfid_refresh_20251225_1()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  refresh materialized view v_rfid;
end;
$function$;

ALTER FUNCTION public.rf_v_rfid_refresh_20251225_1() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.rf_v_rfid_refresh_20251225_1() FROM PUBLIC, anon, authenticated, service_role;
-- 元の権限は既定のまま（PUBLIC に EXECUTE）
GRANT EXECUTE ON FUNCTION public.rf_v_rfid_refresh_20251225_1() TO PUBLIC;

COMMIT;
