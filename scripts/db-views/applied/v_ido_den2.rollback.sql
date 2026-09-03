-- 適用状況: 開発環境(preview/public) 日付不明（2026-08-19以前） / 本番 2026-08-19
-- =====================================================================
-- v_ido_den2 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : 本番 Supabase プロジェクト exekmmbmletvrzpavmzg / public スキーマ
-- 取得日 : 2026-08-19（適用直前）
-- 取得方法: SELECT pg_get_viewdef('public.v_ido_den2', true)
-- reloptions: ["security_invoker=on"]
--
-- 用途: v_ido_den2.sql を適用したあとに問題が出た場合、
--       このファイルをそのまま実行すれば変更前の定義に戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_ido_den2
WITH (security_invoker = on) AS
 SELECT DISTINCT v_ido_den.nyushuko_dat,
    v_ido_den.nyushuko_basho_id,
    v_ido_den.shozoku_nam,
    v_ido_den.sagyo_siji_id,
        CASE
            WHEN v_ido_den.sagyo_siji_id = 1 THEN 'KICS→YARD'::text
            WHEN v_ido_den.sagyo_siji_id = 2 THEN 'YARD→KICS'::text
            ELSE ''::text
        END AS sagyo_siji_nam,
        CASE
            WHEN v_ido_den.sagyo_siji_id = 1 THEN 'K→Y'::text
            WHEN v_ido_den.sagyo_siji_id = 2 THEN 'Y→K'::text
            ELSE ''::text
        END AS sagyo_siji_nam_short,
    max(v_schk.sagyo_sts_id) AS schk_sagyo_sts_id,
    max(m_schk.sts_nam::text) AS schk_sagyo_sts_nam,
    max(m_schk.sts_nam_short::text) AS schk_sagyo_sts_nam_short,
    max(v_nchk.sagyo_sts_id) AS nchk_sagyo_sts_id,
    max(m_nchk.sts_nam::text) AS nchk_sagyo_sts_nam,
    max(m_nchk.sts_nam_short::text) AS nchk_sagyo_sts_nam_short,
    min(v_ido_den.shuko_fix_flg) AS shuko_fix_flg,
    min(v_ido_den.nyuko_fix_flg) AS nyuko_fix_flg
   FROM v_ido_den
     LEFT JOIN v_ido_date_sts v_schk ON v_schk.sagyo_kbn_id = 40 AND v_schk.sagyo_den_dat = v_ido_den.nyushuko_dat AND v_schk.sagyo_id = v_ido_den.nyushuko_basho_id AND v_schk.sagyo_kbn_id = 40
     LEFT JOIN v_ido_date_sts v_nchk ON v_nchk.sagyo_kbn_id = 50 AND v_nchk.sagyo_den_dat = v_ido_den.nyushuko_dat AND v_nchk.sagyo_id = v_ido_den.nyushuko_basho_id AND v_nchk.sagyo_kbn_id = 50
     LEFT JOIN m_sagyo_sts m_schk ON v_schk.sagyo_sts_id = m_schk.sts_id
     LEFT JOIN m_sagyo_sts m_nchk ON v_nchk.sagyo_sts_id = m_nchk.sts_id
  WHERE 1 = 1 AND NOT (v_schk.sagyo_sts_id IS NULL AND v_nchk.sagyo_sts_id IS NULL)
  GROUP BY v_ido_den.nyushuko_dat, v_ido_den.nyushuko_basho_id, v_ido_den.shozoku_nam, v_ido_den.sagyo_siji_id, v_ido_den.schk_sagyo_sts_id, v_ido_den.schk_sagyo_sts_nam, v_ido_den.schk_sagyo_sts_nam_short, v_ido_den.nchk_sagyo_sts_id, v_ido_den.nchk_sagyo_sts_nam, v_ido_den.nchk_sagyo_sts_nam_short
  ORDER BY v_ido_den.nyushuko_dat, v_ido_den.nyushuko_basho_id;
