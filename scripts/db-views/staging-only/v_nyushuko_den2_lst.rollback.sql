-- 適用状況: ステージング 2026-10-06 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den2_lst のロールバック（本番の現在の定義）
-- 2026-10-06 にステージングから pg_get_viewdef で取得。applied/v_nyushuko_den2_lst.sql（本番 2026-09-03 適用）と
-- 空白以外は同一であることを確認済み。
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
--
-- 末尾の列（juchu_meisai_del_flg）を消す変更なので CREATE OR REPLACE では戻せない。DROP して作り直し、GRANT も付け直す。
-- GRANT はステージングの現在の権限（2026-10-06 確認）に合わせている。本番でロールバックする前に、本番の権限
-- （information_schema.role_table_grants）を確認して必要なら合わせること。依存するビューは無い。
-- =====================================================================

DROP VIEW public.v_nyushuko_den2_lst;

CREATE VIEW public.v_nyushuko_den2_lst WITH (security_invoker = on) AS
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
    v_nyushuko_den_lst.upd_user
   FROM v_nyushuko_den_lst
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den_lst.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den_lst.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den_lst.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den_lst.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den_lst.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbnv::bigint
  WHERE v_nyushuko_den_lst.juchu_kizai_meisai_id <> 0 AND v_nyushuko_den_lst.kizai_id <> 0 AND NOT (v_nyushuko_den_lst.sagyo_kbn_id = 30 AND v_nyushuko_den_lst.plan_qty = 0 AND v_nyushuko_den_lst.result_qty = 0 AND v_nyushuko_den_lst.result_adj_qty = 0)
  GROUP BY v_nyushuko_den_lst.nyushuko_shubetu_id, v_nyushuko_den_lst.sagyo_kbn_id, v_nyushuko_den_lst.sagyo_kbn_nam, v_nyushuko_den_lst.sagyo_kbn_nam_short, v_nyushuko_den_lst.juchu_head_id, v_nyushuko_den_lst.juchu_kizai_head_id, v_nyushuko_den_lst.juchu_kizai_meisai_id, v_nyushuko_den_lst.nyushuko_dat, v_nyushuko_den_lst.nyushuko_basho_id, v_nyushuko_den_lst.shozoku_nam, v_nyushuko_den_lst.koen_nam, v_nyushuko_den_lst.koenbasho_nam, v_nyushuko_den_lst.kokyaku_nam, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.head_namv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, v_nyushuko_den_lst.kizai_id, v_nyushuko_den_lst.kizai_nam, v_nyushuko_den_lst.bld_cod, v_nyushuko_den_lst.tana_cod, v_nyushuko_den_lst.eda_cod, (COALESCE(v_nyushuko_den_lst.ctn_flg, 0)), v_nyushuko_den_lst.mem, v_nyushuko_den_lst.dsp_ord_num_meisai, v_nyushuko_den_lst.indent_num, v_nyushuko_den_lst.mem2, v_nyushuko_den_lst.add_user, v_nyushuko_den_lst.upd_user
  ORDER BY v_nyushuko_den_lst.nyushuko_dat, v_nyushuko_den_lst.sagyo_kbn_id, v_nyushuko_den_lst.nyushuko_basho_id, v_nyushuko_den_lst.juchu_head_id, v_nyushuko_den_lst.juchu_kizai_head_id, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, (COALESCE(v_nyushuko_den_lst.ctn_flg, 0)), v_nyushuko_den_lst.dsp_ord_num_meisai, v_nyushuko_den_lst.bld_cod, v_nyushuko_den_lst.tana_cod, v_nyushuko_den_lst.eda_cod, v_nyushuko_den_lst.kizai_id;

GRANT DELETE, INSERT, SELECT, UPDATE ON public.v_nyushuko_den2_lst TO anon;
GRANT ALL ON public.v_nyushuko_den2_lst TO authenticated;
