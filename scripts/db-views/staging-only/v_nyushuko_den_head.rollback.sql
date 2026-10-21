-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den_head のロールバック（本番の現在の定義）
-- 2026-10-21 にステージングから pg_get_viewdef で取得（applied/ と同じ定義。本番と同じかは本番に当てる前に確認すること）。
-- 末尾の列を消すので CREATE OR REPLACE では戻せない。v_nyushuko_den2_head → v_nyushuko_den_head の順に DROP し、作り直して GRANT を付け直す。
-- GRANT はステージングの現在の権限（2026-10-21）に合わせている。本番で戻す前に本番の権限を確認すること。
-- =====================================================================

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL lock_timeout = '5s';

DROP VIEW public.v_nyushuko_den2_head;
DROP VIEW public.v_nyushuko_den_head;

CREATE VIEW public.v_nyushuko_den_head WITH (security_invoker = on) AS
 SELECT t_nyushuko_den.sagyo_den_dat AS nyushuko_dat,
    t_nyushuko_den.sagyo_id AS nyushuko_basho_id,
    m_shozoku.shozoku_nam,
    m_shozoku.shozoku_nam_short,
    t_nyushuko_den.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_kbn,
    t_juchu_head.koen_nam,
    t_juchu_head.koenbasho_nam,
    m_kokyaku.kokyaku_nam,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
        CASE
            WHEN min(shuko_fix.sagyo_sts_id) <> 62 OR min(shuko_fix.sagyo_sts_id) IS NULL THEN 0
            ELSE 1
        END AS shuko_fix_flg,
        CASE
            WHEN min(nyuko_fix.sagyo_sts_id) <> 72 OR min(nyuko_fix.sagyo_sts_id) IS NULL THEN 0
            ELSE 1
        END AS nyuko_fix_flg,
    t_juchu_kizai_head.mem,
    t_juchu_head.juchu_dat,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS sstb_plan_qty,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 20 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS schk_plan_qty,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS nchk_plan_qty,
    t_juchu_head.nyuryoku_user
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN v_nyushuko_fix_sts shuko_fix ON t_nyushuko_den.juchu_head_id = shuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = shuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = shuko_fix.sagyo_id AND shuko_fix.sagyo_kbn_id = 60 AND (t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20)
     LEFT JOIN v_nyushuko_fix_sts nyuko_fix ON t_nyushuko_den.juchu_head_id = nyuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = nyuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = nyuko_fix.sagyo_id AND nyuko_fix.sagyo_kbn_id = 70 AND t_nyushuko_den.sagyo_kbn_id = 30
     LEFT JOIN m_sagyo_sts m_no_meisai ON m_no_meisai.sts_id = '-1'::integer
  GROUP BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, m_shozoku.shozoku_nam_short, t_nyushuko_den.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END), t_juchu_kizai_head.mem, t_juchu_head.juchu_dat, t_juchu_head.nyuryoku_user
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.juchu_head_id, t_juchu_head.koen_nam, m_kokyaku.kokyaku_nam;

GRANT ALL ON public.v_nyushuko_den_head TO anon;
GRANT ALL ON public.v_nyushuko_den_head TO authenticated;

CREATE VIEW public.v_nyushuko_den2_head WITH (security_invoker = on) AS
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

GRANT ALL ON public.v_nyushuko_den2_head TO anon;
GRANT ALL ON public.v_nyushuko_den2_head TO authenticated;

COMMIT;
