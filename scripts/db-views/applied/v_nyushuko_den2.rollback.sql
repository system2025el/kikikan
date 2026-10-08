-- v_nyushuko_den2 のロールバック
-- 本番の適用前の定義そのもの（2026-09-30 に pg_get_viewdef で取得。ステージングも同一、md5 一致）。
-- 末尾の列を消す変更なので CREATE OR REPLACE では戻せない。DROP して作り直す（GRANT も付け直す）。
-- v_nyushuko_den2 以外にこの2ビューへ依存するビューは無い（2026-09-30 確認）。

BEGIN;

DROP VIEW public.v_nyushuko_den2;

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
    v_nyushuko_den.nchk_plan_qty
   FROM v_nyushuko_den
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_get_juchu_kizai_section ON v_nyushuko_den.juchu_head_id = v_get_juchu_kizai_section.juchu_head_id AND v_nyushuko_den.nyushuko_dat = v_get_juchu_kizai_section.sagyo_den_dat AND v_nyushuko_den.nyushuko_basho_id = v_get_juchu_kizai_section.sagyo_id AND v_nyushuko_den.nyushuko_shubetu_id = v_get_juchu_kizai_section.nyushuko_shubetu_id AND v_nyushuko_den.juchu_kizai_head_kbn = v_get_juchu_kizai_section.juchu_kizai_head_kbn
     LEFT JOIN t_juchu_head ON v_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_nyushuko kics_shuko ON t_juchu_kizai_head.juchu_head_id = kics_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_shuko.juchu_kizai_head_id AND kics_shuko.nyushuko_basho_id = 1 AND kics_shuko.nyushuko_shubetu_id = 1
     LEFT JOIN t_juchu_kizai_nyushuko kics_nyuko ON t_juchu_kizai_head.juchu_head_id = kics_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_nyuko.juchu_kizai_head_id AND kics_nyuko.nyushuko_basho_id = 1 AND kics_nyuko.nyushuko_shubetu_id = 2
     LEFT JOIN t_juchu_kizai_nyushuko yard_shuko ON t_juchu_kizai_head.juchu_head_id = yard_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_shuko.juchu_kizai_head_id AND yard_shuko.nyushuko_basho_id = 2 AND yard_shuko.nyushuko_shubetu_id = 1
     LEFT JOIN t_juchu_kizai_nyushuko yard_nyuko ON t_juchu_kizai_head.juchu_head_id = yard_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_nyuko.juchu_kizai_head_id AND yard_nyuko.nyushuko_basho_id = 2 AND yard_nyuko.nyushuko_shubetu_id = 2
  GROUP BY v_nyushuko_den.nyushuko_dat, v_nyushuko_den.nyushuko_basho_id, v_nyushuko_den.shozoku_nam, v_nyushuko_den.shozoku_nam_short, v_nyushuko_den.juchu_head_id, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.head_namv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, v_nyushuko_den.koen_nam, v_nyushuko_den.koenbasho_nam, v_nyushuko_den.kokyaku_nam, v_nyushuko_den.nyushuko_shubetu_id, v_nyushuko_den.sstb_sagyo_sts_id, v_nyushuko_den.sstb_sagyo_sts_nam, v_nyushuko_den.sstb_sagyo_sts_nam_short, v_nyushuko_den.schk_sagyo_sts_id, v_nyushuko_den.schk_sagyo_sts_nam, v_nyushuko_den.schk_sagyo_sts_nam_short, v_nyushuko_den.nchk_sagyo_sts_id, v_nyushuko_den.nchk_sagyo_sts_nam, v_nyushuko_den.nchk_sagyo_sts_nam_short, v_nyushuko_den.shuko_fix_flg, v_nyushuko_den.nyuko_fix_flg, t_juchu_head.juchu_dat, v_nyushuko_den.sstb_plan_qty, v_nyushuko_den.schk_plan_qty, v_nyushuko_den.nchk_plan_qty
  ORDER BY v_nyushuko_den.nyushuko_dat, v_nyushuko_den.nyushuko_basho_id, v_nyushuko_den.juchu_head_id;

-- 権限は適用前と同じにする（本番: anon=r / authenticated=arwdDxtm、ステージング: anon・authenticated とも arwdDxt）。
-- 戻した後に relacl を確認し、環境の既存ビューと違えば揃えること。
GRANT SELECT ON public.v_nyushuko_den2 TO anon;
GRANT ALL ON public.v_nyushuko_den2 TO authenticated;

COMMIT;
