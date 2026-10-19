-- 適用状況: ステージング 2026-10-09 / 本番 未適用
-- =====================================================================
-- v_juchu_ctn_meisai のロールバック（本番の現在の定義。2026-10-05 に pg_get_viewdef で取得。ステージングも同一）
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_juchu_ctn_meisai WITH (security_invoker = on) AS
 SELECT DISTINCT t_juchu_head.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_id,
    t_juchu_ctn_meisai.juchu_kizai_meisai_id,
    t_juchu_ctn_meisai.mem,
    t_juchu_ctn_meisai.kizai_id,
    v_kizai_lst.kizai_nam,
    v_kizai_lst.kizai_grp_cod,
    t_juchu_ctn_meisai.dsp_ord_num,
    kics_juchu_ctn_meisai.plan_kizai_qty AS kics_plan_kizai_qty,
    yard_juchu_ctn_meisai.plan_kizai_qty AS yard_plan_kizai_qty,
    kics_juchu_ctn_meisai.keep_qty AS kics_keep_qty,
    yard_juchu_ctn_meisai.keep_qty AS yard_keep_qty
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id
     LEFT JOIN t_juchu_ctn_meisai kics_juchu_ctn_meisai ON t_juchu_ctn_meisai.juchu_head_id = kics_juchu_ctn_meisai.juchu_head_id AND t_juchu_ctn_meisai.juchu_kizai_head_id = kics_juchu_ctn_meisai.juchu_kizai_head_id AND t_juchu_ctn_meisai.juchu_kizai_meisai_id = kics_juchu_ctn_meisai.juchu_kizai_meisai_id AND t_juchu_ctn_meisai.kizai_id = kics_juchu_ctn_meisai.kizai_id AND kics_juchu_ctn_meisai.shozoku_id = 1
     LEFT JOIN t_juchu_ctn_meisai yard_juchu_ctn_meisai ON t_juchu_ctn_meisai.juchu_head_id = yard_juchu_ctn_meisai.juchu_head_id AND t_juchu_ctn_meisai.juchu_kizai_head_id = yard_juchu_ctn_meisai.juchu_kizai_head_id AND t_juchu_ctn_meisai.juchu_kizai_meisai_id = yard_juchu_ctn_meisai.juchu_kizai_meisai_id AND t_juchu_ctn_meisai.kizai_id = yard_juchu_ctn_meisai.kizai_id AND yard_juchu_ctn_meisai.shozoku_id = 2
     LEFT JOIN v_kizai_lst ON v_kizai_lst.kizai_id = t_juchu_ctn_meisai.kizai_id
  WHERE t_juchu_head.del_flg = 0 AND t_juchu_ctn_meisai.juchu_kizai_meisai_id IS NOT NULL
  GROUP BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_ctn_meisai.juchu_kizai_meisai_id, t_juchu_ctn_meisai.mem, yard_juchu_ctn_meisai.mem, t_juchu_ctn_meisai.kizai_id, v_kizai_lst.kizai_nam, v_kizai_lst.kizai_grp_cod, t_juchu_ctn_meisai.dsp_ord_num, kics_juchu_ctn_meisai.plan_kizai_qty, yard_juchu_ctn_meisai.plan_kizai_qty, kics_juchu_ctn_meisai.keep_qty, yard_juchu_ctn_meisai.keep_qty
  ORDER BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, v_kizai_lst.kizai_grp_cod, t_juchu_ctn_meisai.dsp_ord_num;
