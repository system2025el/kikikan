-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den2_head のロールバック（本番の現在の定義）
-- 2026-10-21 にステージングから pg_get_viewdef で取得（applied/ と同じ定義。本番と同じかは本番に当てる前に確認すること）。
-- 列構成は変わらないので CREATE OR REPLACE で戻せる（v_nyushuko_den_head の列が増えたままでも動く）。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den2_head WITH (security_invoker = on) AS
 SELECT DISTINCT v_nyushuko_den_head.nyushuko_dat,
    v_nyushuko_den_head.nyushuko_basho_id,
    v_nyushuko_den_head.shozoku_nam,
    v_nyushuko_den_head.shozoku_nam_short,
    v_nyushuko_den_head.juchu_head_id,
    v_get_juchu_kizai_head.juchu_kizai_head_idv,
    v_get_juchu_kizai_head.head_namv,
    v_get_juchu_kizai_head.juchu_kizai_head_kbnv,
    v_nyushuko_den_head.koen_nam,
    v_nyushuko_den_head.koenbasho_nam,
    v_get_juchu_kizai_section.section_namv,
    v_nyushuko_den_head.kokyaku_nam,
    v_nyushuko_den_head.nyushuko_shubetu_id,
    v_nyushuko_den_head.shuko_fix_flg,
    v_nyushuko_den_head.nyuko_fix_flg,
    v_get_juchu_kizai_head.memv,
    v_nyushuko_den_head.juchu_dat,
    v_nyushuko_den_head.sstb_plan_qty,
    v_nyushuko_den_head.schk_plan_qty,
    v_nyushuko_den_head.nchk_plan_qty,
    v_nyushuko_den_head.nyuryoku_user
   FROM v_nyushuko_den_head
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den_head.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den_head.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den_head.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den_head.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den_head.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_get_juchu_kizai_section ON v_nyushuko_den_head.juchu_head_id = v_get_juchu_kizai_section.juchu_head_id AND v_nyushuko_den_head.nyushuko_dat = v_get_juchu_kizai_section.sagyo_den_dat AND v_nyushuko_den_head.nyushuko_basho_id = v_get_juchu_kizai_section.sagyo_id AND v_nyushuko_den_head.nyushuko_shubetu_id = v_get_juchu_kizai_section.nyushuko_shubetu_id
  ORDER BY v_nyushuko_den_head.nyushuko_dat, v_nyushuko_den_head.nyushuko_basho_id, v_nyushuko_den_head.juchu_head_id;
