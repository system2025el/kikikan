-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den2_head  事前の行（入出庫種別 3）を機材ヘッダーごとに結合する（列構成は不変）
--
-- v_get_juchu_kizai_head との結合に「種別 3 なら juchu_kizai_head_idv = v_nyushuko_den_head.jizen_juchu_kizai_head_id」を加える
-- （v_nyushuko_den2 と同じ）。v_get_juchu_kizai_section との結合は変えていない。
--
-- 前提: v_nyushuko_den_head.sql と v_get_juchu_kizai_head.sql を先に当てる。
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で全列・行数（3,711）とも差分0
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
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den_head.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den_head.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den_head.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den_head.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den_head.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbn AND (v_nyushuko_den_head.nyushuko_shubetu_id IS DISTINCT FROM 3 OR v_get_juchu_kizai_head.juchu_kizai_head_idv = v_nyushuko_den_head.jizen_juchu_kizai_head_id::text)
     LEFT JOIN v_get_juchu_kizai_section ON v_nyushuko_den_head.juchu_head_id = v_get_juchu_kizai_section.juchu_head_id AND v_nyushuko_den_head.nyushuko_dat = v_get_juchu_kizai_section.sagyo_den_dat AND v_nyushuko_den_head.nyushuko_basho_id = v_get_juchu_kizai_section.sagyo_id AND v_nyushuko_den_head.nyushuko_shubetu_id = v_get_juchu_kizai_section.nyushuko_shubetu_id
  ORDER BY v_nyushuko_den_head.nyushuko_dat, v_nyushuko_den_head.nyushuko_basho_id, v_nyushuko_den_head.juchu_head_id;
