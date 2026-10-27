-- 適用状況: ロールバック用（本番の今の定義。del-meisai 分を 2026-10-26 に本番適用した版 = applied/v_nyushuko_den2_lst.sql と同じ）
-- =====================================================================
-- v_nyushuko_den2_lst のロールバック。staging-only/v_nyushuko_den2_lst.sql（事前準備の変更）を当てた後に戻すときに使う。
-- reloptions: security_invoker = on
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den2_lst WITH (security_invoker = on) AS
 SELECT DISTINCT v_nyushuko_den_lst.nyushuko_shubetu_id,
    v_nyushuko_den_lst.sagyo_kbn_id,
    v_nyushuko_den_lst.sagyo_kbn_nam,
    v_nyushuko_den_lst.sagyo_kbn_nam_short,
    v_nyushuko_den_lst.juchu_head_id,
    v_nyushuko_den_lst.juchu_kizai_head_id,
    v_nyushuko_den_lst.juchu_kizai_meisai_id,
    v_nyushuko_den_lst.nyushuko_dat,
    v_nyushuko_den_lst.nyushuko_basho_id,
    v_nyushuko_den_lst.shozoku_nam,
    v_nyushuko_den_lst.koen_nam,
    v_nyushuko_den_lst.koenbasho_nam,
    v_nyushuko_den_lst.kokyaku_nam,
    v_get_juchu_kizai_head.juchu_kizai_head_idv,
    v_get_juchu_kizai_head.head_namv,
    v_get_juchu_kizai_head.juchu_kizai_head_kbnv,
    v_nyushuko_den_lst.kizai_id,
    v_nyushuko_den_lst.kizai_nam,
    v_nyushuko_den_lst.bld_cod,
    v_nyushuko_den_lst.tana_cod,
    v_nyushuko_den_lst.eda_cod,
    COALESCE(v_nyushuko_den_lst.ctn_flg, 0) AS ctn_flg,
    v_nyushuko_den_lst.mem AS kizai_mem,
    sum(COALESCE(v_nyushuko_den_lst.plan_qty, 0::bigint)) AS plan_qty,
    sum(COALESCE(v_nyushuko_den_lst.result_qty, 0::bigint)) AS result_qty,
    sum(COALESCE(v_nyushuko_den_lst.result_adj_qty, 0::bigint)) AS result_adj_qty,
    v_nyushuko_den_lst.dsp_ord_num_meisai,
    v_nyushuko_den_lst.indent_num,
    v_nyushuko_den_lst.mem2,
    v_nyushuko_den_lst.add_user,
    v_nyushuko_den_lst.upd_user,
        CASE
            WHEN sum(COALESCE(v_nyushuko_den_lst.plan_qty, 0::bigint)) <> 0 THEN 0
            WHEN COALESCE(v_nyushuko_den_lst.ctn_flg, 0) = 1 THEN (NOT (EXISTS ( SELECT 1
               FROM t_juchu_ctn_meisai c
              WHERE c.juchu_head_id = v_nyushuko_den_lst.juchu_head_id AND c.juchu_kizai_head_id = v_nyushuko_den_lst.juchu_kizai_head_id AND c.juchu_kizai_meisai_id = v_nyushuko_den_lst.juchu_kizai_meisai_id AND c.kizai_id = v_nyushuko_den_lst.kizai_id AND c.shozoku_id = v_nyushuko_den_lst.nyushuko_basho_id)))::integer
            ELSE (NOT (EXISTS ( SELECT 1
               FROM t_juchu_kizai_meisai m
              WHERE m.juchu_head_id = v_nyushuko_den_lst.juchu_head_id AND m.juchu_kizai_head_id = v_nyushuko_den_lst.juchu_kizai_head_id AND m.juchu_kizai_meisai_id = v_nyushuko_den_lst.juchu_kizai_meisai_id AND m.kizai_id = v_nyushuko_den_lst.kizai_id AND (v_nyushuko_den_lst.sagyo_kbn_id <> ALL (ARRAY[10, 20]) OR m.shozoku_id = v_nyushuko_den_lst.nyushuko_basho_id))))::integer
        END AS juchu_meisai_del_flg
   FROM v_nyushuko_den_lst
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den_lst.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den_lst.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den_lst.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den_lst.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den_lst.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbnv::bigint
  WHERE v_nyushuko_den_lst.juchu_kizai_meisai_id <> 0 AND v_nyushuko_den_lst.kizai_id <> 0 AND NOT (v_nyushuko_den_lst.sagyo_kbn_id = 30 AND v_nyushuko_den_lst.plan_qty = 0 AND v_nyushuko_den_lst.result_qty = 0 AND v_nyushuko_den_lst.result_adj_qty = 0)
  GROUP BY v_nyushuko_den_lst.nyushuko_shubetu_id, v_nyushuko_den_lst.sagyo_kbn_id, v_nyushuko_den_lst.sagyo_kbn_nam, v_nyushuko_den_lst.sagyo_kbn_nam_short, v_nyushuko_den_lst.juchu_head_id, v_nyushuko_den_lst.juchu_kizai_head_id, v_nyushuko_den_lst.juchu_kizai_meisai_id, v_nyushuko_den_lst.nyushuko_dat, v_nyushuko_den_lst.nyushuko_basho_id, v_nyushuko_den_lst.shozoku_nam, v_nyushuko_den_lst.koen_nam, v_nyushuko_den_lst.koenbasho_nam, v_nyushuko_den_lst.kokyaku_nam, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.head_namv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, v_nyushuko_den_lst.kizai_id, v_nyushuko_den_lst.kizai_nam, v_nyushuko_den_lst.bld_cod, v_nyushuko_den_lst.tana_cod, v_nyushuko_den_lst.eda_cod, (COALESCE(v_nyushuko_den_lst.ctn_flg, 0)), v_nyushuko_den_lst.mem, v_nyushuko_den_lst.dsp_ord_num_meisai, v_nyushuko_den_lst.indent_num, v_nyushuko_den_lst.mem2, v_nyushuko_den_lst.add_user, v_nyushuko_den_lst.upd_user
  ORDER BY v_nyushuko_den_lst.nyushuko_dat, v_nyushuko_den_lst.sagyo_kbn_id, v_nyushuko_den_lst.nyushuko_basho_id, v_nyushuko_den_lst.juchu_head_id, v_nyushuko_den_lst.juchu_kizai_head_id, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, (COALESCE(v_nyushuko_den_lst.ctn_flg, 0)), v_nyushuko_den_lst.dsp_ord_num_meisai, v_nyushuko_den_lst.bld_cod, v_nyushuko_den_lst.tana_cod, v_nyushuko_den_lst.eda_cod, v_nyushuko_den_lst.kizai_id;
