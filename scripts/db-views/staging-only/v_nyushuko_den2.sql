-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den2  事前の行（入出庫種別 3）を機材ヘッダーごとに結合する（列構成は不変）
--
-- v_get_juchu_kizai_head との結合に「種別 3 なら juchu_kizai_head_idv = v_nyushuko_den.jizen_juchu_kizai_head_id」を加える。
-- v_get_juchu_kizai_head は事前の行を機材ヘッダーごとに分けて返すので、この条件で同じヘッダーの行だけを選ぶ（種別 1・2 は今と同じ）。
-- 事前の行の juchu_kizai_head_idv は、その機材ヘッダーidの1つだけになる。出庫一覧（Web・HT・ゲート）は種別 1 と 3 で取得する。
--
-- 前提: v_nyushuko_den.sql と v_get_juchu_kizai_head.sql を先に当てる。
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で全列・行数（3,559）とも差分0。
--   テストの受注（91432）に事前準備を3明細入れた状態で、同じ準備日時の2ヘッダーが別々の行になり、本番の行（合体）の値は変わらないことを確認。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den2 WITH (security_invoker = on) AS
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
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbn AND (v_nyushuko_den.nyushuko_shubetu_id IS DISTINCT FROM 3 OR v_get_juchu_kizai_head.juchu_kizai_head_idv = v_nyushuko_den.jizen_juchu_kizai_head_id::text)
     LEFT JOIN v_get_juchu_kizai_section ON v_nyushuko_den.juchu_head_id = v_get_juchu_kizai_section.juchu_head_id AND v_nyushuko_den.nyushuko_dat = v_get_juchu_kizai_section.sagyo_den_dat AND v_nyushuko_den.nyushuko_basho_id = v_get_juchu_kizai_section.sagyo_id AND v_nyushuko_den.nyushuko_shubetu_id = v_get_juchu_kizai_section.nyushuko_shubetu_id AND v_nyushuko_den.juchu_kizai_head_kbn = v_get_juchu_kizai_section.juchu_kizai_head_kbn
     LEFT JOIN t_juchu_head ON v_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_nyushuko kics_shuko ON t_juchu_kizai_head.juchu_head_id = kics_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_shuko.juchu_kizai_head_id AND kics_shuko.nyushuko_basho_id = 1 AND kics_shuko.nyushuko_shubetu_id = 1
     LEFT JOIN t_juchu_kizai_nyushuko kics_nyuko ON t_juchu_kizai_head.juchu_head_id = kics_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_nyuko.juchu_kizai_head_id AND kics_nyuko.nyushuko_basho_id = 1 AND kics_nyuko.nyushuko_shubetu_id = 2
     LEFT JOIN t_juchu_kizai_nyushuko yard_shuko ON t_juchu_kizai_head.juchu_head_id = yard_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_shuko.juchu_kizai_head_id AND yard_shuko.nyushuko_basho_id = 2 AND yard_shuko.nyushuko_shubetu_id = 1
     LEFT JOIN t_juchu_kizai_nyushuko yard_nyuko ON t_juchu_kizai_head.juchu_head_id = yard_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_nyuko.juchu_kizai_head_id AND yard_nyuko.nyushuko_basho_id = 2 AND yard_nyuko.nyushuko_shubetu_id = 2
  GROUP BY v_nyushuko_den.nyushuko_dat, v_nyushuko_den.nyushuko_basho_id, v_nyushuko_den.shozoku_nam, v_nyushuko_den.shozoku_nam_short, v_nyushuko_den.juchu_head_id, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.head_namv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, v_nyushuko_den.koen_nam, v_nyushuko_den.koenbasho_nam, v_nyushuko_den.kokyaku_nam, v_nyushuko_den.nyushuko_shubetu_id, v_nyushuko_den.sstb_sagyo_sts_id, v_nyushuko_den.sstb_sagyo_sts_nam, v_nyushuko_den.sstb_sagyo_sts_nam_short, v_nyushuko_den.schk_sagyo_sts_id, v_nyushuko_den.schk_sagyo_sts_nam, v_nyushuko_den.schk_sagyo_sts_nam_short, v_nyushuko_den.nchk_sagyo_sts_id, v_nyushuko_den.nchk_sagyo_sts_nam, v_nyushuko_den.nchk_sagyo_sts_nam_short, v_nyushuko_den.shuko_fix_flg, v_nyushuko_den.nyuko_fix_flg, t_juchu_head.juchu_dat, v_nyushuko_den.sstb_plan_qty, v_nyushuko_den.schk_plan_qty, v_nyushuko_den.nchk_plan_qty, v_nyushuko_den.nyuko_fix_sts, v_nyushuko_den.shuko_fix_sts
  ORDER BY v_nyushuko_den.nyushuko_dat, v_nyushuko_den.nyushuko_basho_id, v_nyushuko_den.juchu_head_id;
