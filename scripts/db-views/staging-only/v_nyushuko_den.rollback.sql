-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den のロールバック（本番の現在の定義）
-- 2026-10-21 にステージングから pg_get_viewdef で取得（applied/ と同じ定義。本番と同じかは本番に当てる前に確認すること）。
-- 末尾の列を消すので CREATE OR REPLACE では戻せない。v_nyushuko_den2 → v_nyushuko_den の順に DROP し、作り直して GRANT を付け直す。
-- GRANT はステージングの現在の権限（2026-10-21）に合わせている。本番で戻す前に本番の権限を確認すること。
-- =====================================================================

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL lock_timeout = '5s';

DROP VIEW public.v_nyushuko_den2;
DROP VIEW public.v_nyushuko_den;

CREATE VIEW public.v_nyushuko_den WITH (security_invoker = on) AS
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
    COALESCE(max(v_sstb.sagyo_sts_id), '-1'::integer) AS sstb_sagyo_sts_id,
    COALESCE(max(m_sstb.sts_nam::text), max(m_no_meisai.sts_nam::text)) AS sstb_sagyo_sts_nam,
    COALESCE(max(m_sstb.sts_nam_short::text), max(m_no_meisai.sts_nam_short::text)) AS sstb_sagyo_sts_nam_short,
    COALESCE(max(v_schk.sagyo_sts_id), '-1'::integer) AS schk_sagyo_sts_id,
    COALESCE(max(m_schk.sts_nam::text), max(m_no_meisai.sts_nam::text)) AS schk_sagyo_sts_nam,
    COALESCE(max(m_schk.sts_nam_short::text), max(m_no_meisai.sts_nam_short::text)) AS schk_sagyo_sts_nam_short,
    COALESCE(max(v_nchk.sagyo_sts_id), '-1'::integer) AS nchk_sagyo_sts_id,
    COALESCE(max(m_nchk.sts_nam::text), max(m_no_meisai.sts_nam::text)) AS nchk_sagyo_sts_nam,
    COALESCE(max(m_nchk.sts_nam_short::text), max(m_no_meisai.sts_nam_short::text)) AS nchk_sagyo_sts_nam_short,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) > 0 AND count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 1
            ELSE 0
        END AS shuko_fix_flg,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) > 0 AND count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 1
            ELSE 0
        END AS nyuko_fix_flg,
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
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = 0 THEN 0
            WHEN count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 2
            ELSE 1
        END AS nyuko_fix_sts,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = 0 THEN 0
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 2
            ELSE 1
        END AS shuko_fix_sts
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN v_nyushuko_total_time_sts v_sstb ON v_sstb.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_sstb.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_sstb.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_sstb.sagyo_id = t_nyushuko_den.sagyo_id AND v_sstb.sagyo_kbn_id = 10 AND v_sstb.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_nyushuko_total_time_sts v_schk ON v_schk.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_schk.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_schk.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_schk.sagyo_id = t_nyushuko_den.sagyo_id AND v_schk.sagyo_kbn_id = 20 AND v_schk.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_nyushuko_total_time_sts v_nchk ON v_nchk.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_nchk.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_nchk.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_nchk.sagyo_id = t_nyushuko_den.sagyo_id AND v_nchk.sagyo_kbn_id = 30 AND v_nchk.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN m_sagyo_sts m_sstb ON v_sstb.sagyo_sts_id = m_sstb.sts_id
     LEFT JOIN m_sagyo_sts m_schk ON v_schk.sagyo_sts_id = m_schk.sts_id
     LEFT JOIN m_sagyo_sts m_nchk ON v_nchk.sagyo_sts_id = m_nchk.sts_id
     LEFT JOIN v_nyushuko_fix_sts shuko_fix ON t_nyushuko_den.juchu_head_id = shuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = shuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = shuko_fix.sagyo_id AND shuko_fix.sagyo_kbn_id = 60 AND (t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20) AND shuko_fix.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat
     LEFT JOIN v_nyushuko_fix_sts nyuko_fix ON t_nyushuko_den.juchu_head_id = nyuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = nyuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = nyuko_fix.sagyo_id AND nyuko_fix.sagyo_kbn_id = 70 AND t_nyushuko_den.sagyo_kbn_id = 30 AND nyuko_fix.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat
     LEFT JOIN m_sagyo_sts m_no_meisai ON m_no_meisai.sts_id = '-1'::integer
  GROUP BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, m_shozoku.shozoku_nam_short, t_nyushuko_den.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END)
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.juchu_head_id, t_juchu_head.koen_nam, m_kokyaku.kokyaku_nam;

GRANT ALL ON public.v_nyushuko_den TO anon;
GRANT ALL ON public.v_nyushuko_den TO authenticated;

CREATE VIEW public.v_nyushuko_den2 WITH (security_invoker = on) AS
 SELECT DISTINCT v_nyushuko_den.nyushuko_dat,
    v_nyushuko_den.nyushuko_basho_id,
    v_nyushuko_den.shozoku_nam,
    v_nyushuko_den.shozoku_nam_short,
    v_nyushuko_den.juchu_head_id,
    v_get_juchu_kizai_head.juchu_kizai_head_idv,
    v_get_juchu_kizai_head.head_namv,
    v_get_juchu_kizai_head.juchu_kizai_head_kbnv,
    v_nyushuko_den.koen_nam,
    v_nyushuko_den.koenbasho_nam,
    max(v_get_juchu_kizai_section.section_namv) AS section_namv,
    v_nyushuko_den.kokyaku_nam,
    v_nyushuko_den.nyushuko_shubetu_id,
    v_nyushuko_den.sstb_sagyo_sts_id,
    v_nyushuko_den.sstb_sagyo_sts_nam,
    v_nyushuko_den.sstb_sagyo_sts_nam_short,
    v_nyushuko_den.schk_sagyo_sts_id,
    v_nyushuko_den.schk_sagyo_sts_nam,
    v_nyushuko_den.schk_sagyo_sts_nam_short,
    v_nyushuko_den.nchk_sagyo_sts_id,
    v_nyushuko_den.nchk_sagyo_sts_nam,
    v_nyushuko_den.nchk_sagyo_sts_nam_short,
    v_nyushuko_den.shuko_fix_flg,
    v_nyushuko_den.nyuko_fix_flg,
    min(kics_nyuko.nyushuko_dat) AS kics_nyuko_dat,
    min(yard_nyuko.nyushuko_dat) AS yard_nyuko_dat,
    max(kics_shuko.nyushuko_dat) AS kics_shuko_dat,
    max(yard_shuko.nyushuko_dat) AS yard_shuko_dat,
    min(t_juchu_head.nyuryoku_user::text) AS nyuryoku_user,
    t_juchu_head.juchu_dat,
    v_nyushuko_den.sstb_plan_qty,
    v_nyushuko_den.schk_plan_qty,
    v_nyushuko_den.nchk_plan_qty,
    v_nyushuko_den.nyuko_fix_sts,
    v_nyushuko_den.shuko_fix_sts
   FROM v_nyushuko_den
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_get_juchu_kizai_section ON v_nyushuko_den.juchu_head_id = v_get_juchu_kizai_section.juchu_head_id AND v_nyushuko_den.nyushuko_dat = v_get_juchu_kizai_section.sagyo_den_dat AND v_nyushuko_den.nyushuko_basho_id = v_get_juchu_kizai_section.sagyo_id AND v_nyushuko_den.nyushuko_shubetu_id = v_get_juchu_kizai_section.nyushuko_shubetu_id AND v_nyushuko_den.juchu_kizai_head_kbn = v_get_juchu_kizai_section.juchu_kizai_head_kbn
     LEFT JOIN t_juchu_head ON v_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_nyushuko kics_shuko ON t_juchu_kizai_head.juchu_head_id = kics_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_shuko.juchu_kizai_head_id AND kics_shuko.nyushuko_basho_id = 1 AND kics_shuko.nyushuko_shubetu_id = 1
     LEFT JOIN t_juchu_kizai_nyushuko kics_nyuko ON t_juchu_kizai_head.juchu_head_id = kics_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_nyuko.juchu_kizai_head_id AND kics_nyuko.nyushuko_basho_id = 1 AND kics_nyuko.nyushuko_shubetu_id = 2
     LEFT JOIN t_juchu_kizai_nyushuko yard_shuko ON t_juchu_kizai_head.juchu_head_id = yard_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_shuko.juchu_kizai_head_id AND yard_shuko.nyushuko_basho_id = 2 AND yard_shuko.nyushuko_shubetu_id = 1
     LEFT JOIN t_juchu_kizai_nyushuko yard_nyuko ON t_juchu_kizai_head.juchu_head_id = yard_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_nyuko.juchu_kizai_head_id AND yard_nyuko.nyushuko_basho_id = 2 AND yard_nyuko.nyushuko_shubetu_id = 2
  GROUP BY v_nyushuko_den.nyushuko_dat, v_nyushuko_den.nyushuko_basho_id, v_nyushuko_den.shozoku_nam, v_nyushuko_den.shozoku_nam_short, v_nyushuko_den.juchu_head_id, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.head_namv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, v_nyushuko_den.koen_nam, v_nyushuko_den.koenbasho_nam, v_nyushuko_den.kokyaku_nam, v_nyushuko_den.nyushuko_shubetu_id, v_nyushuko_den.sstb_sagyo_sts_id, v_nyushuko_den.sstb_sagyo_sts_nam, v_nyushuko_den.sstb_sagyo_sts_nam_short, v_nyushuko_den.schk_sagyo_sts_id, v_nyushuko_den.schk_sagyo_sts_nam, v_nyushuko_den.schk_sagyo_sts_nam_short, v_nyushuko_den.nchk_sagyo_sts_id, v_nyushuko_den.nchk_sagyo_sts_nam, v_nyushuko_den.nchk_sagyo_sts_nam_short, v_nyushuko_den.shuko_fix_flg, v_nyushuko_den.nyuko_fix_flg, t_juchu_head.juchu_dat, v_nyushuko_den.sstb_plan_qty, v_nyushuko_den.schk_plan_qty, v_nyushuko_den.nchk_plan_qty, v_nyushuko_den.nyuko_fix_sts, v_nyushuko_den.shuko_fix_sts
  ORDER BY v_nyushuko_den.nyushuko_dat, v_nyushuko_den.nyushuko_basho_id, v_nyushuko_den.juchu_head_id;

GRANT ALL ON public.v_nyushuko_den2 TO anon;
GRANT ALL ON public.v_nyushuko_den2 TO authenticated;

COMMIT;
