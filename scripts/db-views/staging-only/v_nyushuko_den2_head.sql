-- 適用状況: 開発環境(preview/public) 2026-08-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den2_head  末尾に nyuryoku_user（入力者）を追加
--
-- 変更内容: v_nyushuko_den_head の nyuryoku_user をそのまま通す1列追加のみ。
--           このビューは GROUP BY ではなく SELECT DISTINCT なので、
--           GROUP BY の変更は不要。
--
-- 行が増えない根拠: nyuryoku_user は juchu_head_id に関数従属し、
--           juchu_head_id は既に DISTINCT の対象列に含まれている。
--           よって DISTINCT の結果行数は変わらない。
--           検証: 開発環境で既存20列・全3,649行が新旧で差分0、行数も不変。
--
-- 前提: v_nyushuko_den_head の列追加が先に必要。必ず
--       v_nyushuko_den_head.sql → v_nyushuko_den2_head.sql の順で適用すること。
--
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den2_head
WITH (security_invoker = on) AS
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
  ORDER BY v_nyushuko_den_head.nyushuko_dat, v_nyushuko_den_head.nyushuko_basho_id, v_nyushuko_den_head.juchu_head_id
;
