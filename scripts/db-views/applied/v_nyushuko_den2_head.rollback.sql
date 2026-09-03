-- 適用状況: 開発環境(preview/public) 2026-08-21 / 本番 2026-09-03
-- =====================================================================
-- v_nyushuko_den2_head 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : 本番 exekmmbmletvrzpavmzg / public スキーマ
--          （取得時点で開発環境の変更前定義と完全に同一だったため、開発環境を
--            戻す場合にもこのファイルを使える）
-- 取得日 : 2026-08-21
-- 取得方法: SELECT pg_get_viewdef('public.v_nyushuko_den2_head', true)
-- reloptions: ["security_invoker=on"]
--
-- 注意: v_nyushuko_den_head を先に戻すと、このビューが存在しない列を参照して
--       エラーになる。戻す順序は v_nyushuko_den2_head → v_nyushuko_den_head。
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
    v_nyushuko_den_head.nchk_plan_qty
   FROM v_nyushuko_den_head
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den_head.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den_head.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den_head.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den_head.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den_head.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_get_juchu_kizai_section ON v_nyushuko_den_head.juchu_head_id = v_get_juchu_kizai_section.juchu_head_id AND v_nyushuko_den_head.nyushuko_dat = v_get_juchu_kizai_section.sagyo_den_dat AND v_nyushuko_den_head.nyushuko_basho_id = v_get_juchu_kizai_section.sagyo_id AND v_nyushuko_den_head.nyushuko_shubetu_id = v_get_juchu_kizai_section.nyushuko_shubetu_id
  ORDER BY v_nyushuko_den_head.nyushuko_dat, v_nyushuko_den_head.nyushuko_basho_id, v_nyushuko_den_head.juchu_head_id
;
