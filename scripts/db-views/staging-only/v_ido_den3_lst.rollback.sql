-- 適用状況: ステージング 2026-09-01 / 本番 未適用
--
-- v_ido_den3_lst のロールバック。本番の現在の定義（2026-09-01 時点、PG17 の
-- pg_get_viewdef から採取）。ステージングの変更前定義とも修飾子を除いて一致を確認済み。
--
-- ★ 列の削除を伴うので CREATE OR REPLACE VIEW では戻せない。DROP → CREATE が必要。
--   v_ido_den3_lst に依存する他のビューは無い（アプリからの参照のみ）ため DROP 可。
--   依存が増えていないかは実行前に下記で確認すること。
--     SELECT dependent_ns.nspname, dependent_view.relname
--     FROM pg_depend d
--       JOIN pg_rewrite r ON r.oid = d.objid
--       JOIN pg_class dependent_view ON dependent_view.oid = r.ev_class
--       JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
--       JOIN pg_class source_table ON source_table.oid = d.refobjid
--     WHERE source_table.relname = 'v_ido_den3_lst' AND dependent_view.relname <> 'v_ido_den3_lst';

DROP VIEW IF EXISTS public.v_ido_den3_lst;

CREATE VIEW public.v_ido_den3_lst WITH (security_invoker = on) AS
 SELECT ido_den_id,
    ido_flg,
        CASE
            WHEN NOT (EXISTS ( SELECT 1
               FROM v_ido_den_juchu_lst jfl2
              WHERE v_ido_den2_union_lst.sagyo_kbn_id = jfl2.sagyo_kbn_id AND v_ido_den2_union_lst.sagyo_siji_id = jfl2.sagyo_siji_id AND v_ido_den2_union_lst.nyushuko_dat = jfl2.nyushuko_dat AND v_ido_den2_union_lst.nyushuko_basho_id = jfl2.nyushuko_basho_id AND v_ido_den2_union_lst.kizai_id = jfl2.kizai_id)) THEN 0
            ELSE 1
        END AS juchu_flg,
    nyushuko_shubetu_id,
    sagyo_kbn_id,
    sagyo_kbn_nam,
    sagyo_kbn_nam_short,
    sagyo_siji_id,
    sagyo_siji_nam,
    sagyo_siji_nam_short,
    nyushuko_dat,
    nyushuko_basho_id,
    shozoku_nam,
    kizai_id,
    kizai_nam,
    bld_cod,
    tana_cod,
    eda_cod,
    ctn_flg,
    kizai_mem,
    kizai_shozoku_id,
    kizai_shozoku_nam,
    kizai_shozoku_nam_short,
    rfid_yard_qty,
    rfid_kics_qty,
    plan_juchu_qty,
    plan_low_qty,
    sum(plan_qty) AS plan_qty,
    sum(result_qty) AS result_qty,
    sum(result_adj_qty) AS result_adj_qty,
    sum(diff_qty) AS diff_qty
   FROM v_ido_den2_union_lst
  WHERE NOT (sagyo_kbn_id = 50 AND plan_qty = 0::numeric)
  GROUP BY ido_den_id, ido_flg, nyushuko_shubetu_id, sagyo_kbn_id, sagyo_kbn_nam, sagyo_kbn_nam_short, sagyo_siji_id, sagyo_siji_nam, sagyo_siji_nam_short, nyushuko_dat, nyushuko_basho_id, shozoku_nam, kizai_id, kizai_nam, bld_cod, tana_cod, eda_cod, ctn_flg, kizai_mem, kizai_shozoku_id, kizai_shozoku_nam, kizai_shozoku_nam_short, rfid_yard_qty, rfid_kics_qty, plan_juchu_qty, plan_low_qty
  ORDER BY nyushuko_dat, sagyo_kbn_id, (
        CASE
            WHEN NOT (EXISTS ( SELECT 1
               FROM v_ido_den_juchu_lst jfl2
              WHERE v_ido_den2_union_lst.sagyo_kbn_id = jfl2.sagyo_kbn_id AND v_ido_den2_union_lst.sagyo_siji_id = jfl2.sagyo_siji_id AND v_ido_den2_union_lst.nyushuko_dat = jfl2.nyushuko_dat AND v_ido_den2_union_lst.nyushuko_basho_id = jfl2.nyushuko_basho_id AND v_ido_den2_union_lst.kizai_id = jfl2.kizai_id)) THEN 0
            ELSE 1
        END) DESC;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_lst TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_lst TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.v_ido_den3_lst TO anon;
