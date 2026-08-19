-- =====================================================================
-- v_zaiko_qty 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : 本番 Supabase プロジェクト exekmmbmletvrzpavmzg / public スキーマ
-- 取得日 : 2026-08-19（適用直前）
-- 取得方法: SELECT pg_get_viewdef('public.v_zaiko_qty', true)
-- reloptions: ["security_invoker=on"]
--
-- 用途: v_zaiko_qty.sql を適用したあとに問題が出た場合、
--       このファイルをそのまま実行すれば変更前の定義に戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_zaiko_qty
WITH (security_invoker = on) AS
 SELECT use.plan_dat,
    use.kizai_id,
    kizai.kizai_qty,
    use.juchu_qty,
    use.yobi_qty,
    use.plan_qty,
    kizai.kizai_qty - use.plan_qty AS zaiko_qty
   FROM v_juchu_kizai_dat_qty use
     LEFT JOIN v_kizai_qty kizai ON use.kizai_id = kizai.kizai_id;
