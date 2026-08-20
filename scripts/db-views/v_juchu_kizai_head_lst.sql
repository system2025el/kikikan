-- =====================================================================
-- v_juchu_kizai_head_lst 列追加版
--
-- 変更内容: 既存列の末尾に t_juchu_head.nyuryoku_user（担当者）を1列追加。
--           既存列の値・順序は不変。
-- 取得元  : ステージング jimqcvyaoddsxbcrsnfs / public スキーマ（適用済みの定義）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_juchu_kizai_head_lst
WITH (security_invoker = on) AS
  SELECT t_juchu_head.juchu_head_id,
     t_juchu_head.koen_nam,
     t_juchu_head.koenbasho_nam,
     t_juchu_head.kokyaku_id,
     m_kokyaku.kokyaku_nam,
     t_juchu_kizai_head.juchu_kizai_head_id,
     t_juchu_kizai_head.head_nam,
     '（仮）TODO'::text AS sagyo_sts_nam,
     min(shuko.nyushuko_dat) AS shuko_dat,
     max(nyuko.nyushuko_dat) AS nyuko_dat,
     kics_shuko.nyushuko_dat AS kics_shuko_dat,
     kics_nyuko.nyushuko_dat AS kics_nyuko_dat,
     yard_shuko.nyushuko_dat AS yard_shuko_dat,
     yard_nyuko.nyushuko_dat AS yard_nyuko_dat,
     max(sikomibi.count) AS sikomibi,
     max(rihabi.count) AS rihabi,
     max(genebi.count) AS genebi,
         CASE
             WHEN t_juchu_kizai_head.juchu_kizai_head_kbn = 1 THEN max(honbanbi.count)
             ELSE NULL::bigint
         END AS honbanbi,
         CASE
             WHEN t_juchu_kizai_head.juchu_kizai_head_kbn = 1 THEN v_honbanbi_calc.juchu_honbanbi_calc_qty
             WHEN t_juchu_kizai_head.juchu_kizai_head_kbn = 2 THEN max(t_juchu_kizai_head.juchu_honbanbi_qty)
             ELSE NULL::numeric
         END AS juchu_honbanbi_calc_qty,
     COALESCE(t_juchu_kizai_head.nebiki_amt, 0::numeric) AS nebiki_amt,
     COALESCE(t_juchu_kizai_head.nebiki_rat, 0::numeric) AS nebiki_rat,
         CASE
             WHEN t_juchu_kizai_head.juchu_kizai_head_kbn = 1 THEN sum(COALESCE(t_juchu_kizai_meisai.kizai_tanka_amt, 0::numeric) * COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)::numeric * COALESCE(v_honbanbi_calc.juchu_honbanbi_calc_qty, 0::numeric)) - max(COALESCE(t_juchu_kizai_head.nebiki_amt, 0::numeric))
             WHEN t_juchu_kizai_head.juchu_kizai_head_kbn = 2 THEN sum(COALESCE(t_juchu_kizai_meisai.kizai_tanka_amt, 0::numeric) * COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)::numeric * COALESCE(t_juchu_kizai_head.juchu_honbanbi_qty, 0::numeric)) - max(COALESCE(t_juchu_kizai_head.nebiki_amt, 0::numeric))
             ELSE NULL::numeric
         END AS shokei,
     ''::text AS keikoku,
     t_juchu_kizai_head.mem,
     t_juchu_kizai_head.dsp_ord_num,
     t_juchu_kizai_head.oya_juchu_kizai_head_id,
     t_juchu_kizai_head.ht_kbn,
     t_juchu_kizai_head.juchu_kizai_head_kbn,
     COALESCE(kics_shuko_fix.sagyo_fix_flg, 0) AS kics_shuko_fix_flg,
     COALESCE(yard_shuko_fix.sagyo_fix_flg, 0) AS yard_shuko_fix_flg,
     t_juchu_head.juchu_dat,
     COALESCE(kics_nyuko_fix.sagyo_fix_flg, 0) AS kics_nyuko_fix_flg,
     COALESCE(yard_nyuko_fix.sagyo_fix_flg, 0) AS yard_nyuko_fix_flg,
     t_juchu_head.nyuryoku_user
    FROM t_juchu_head
      LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
      LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id
      LEFT JOIN t_juchu_kizai_nyushuko shuko ON t_juchu_kizai_head.juchu_head_id = shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = shuko.juchu_kizai_head_id AND shuko.nyushuko_shubetu_id = 1
      LEFT JOIN t_juchu_kizai_nyushuko nyuko ON t_juchu_kizai_head.juchu_head_id = nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = nyuko.juchu_kizai_head_id AND nyuko.nyushuko_shubetu_id = 2
      LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
      LEFT JOIN m_juchu_sts ON m_juchu_sts.sts_id = t_juchu_head.juchu_sts
      LEFT JOIN ( SELECT t_juchu_kizai_honbanbi.juchu_head_id,
             t_juchu_kizai_honbanbi.juchu_kizai_head_id,
             count(*) AS count
            FROM t_juchu_kizai_honbanbi
           WHERE t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id = 10
           GROUP BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id) sikomibi ON t_juchu_kizai_head.juchu_head_id = sikomibi.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = sikomibi.juchu_kizai_head_id
      LEFT JOIN ( SELECT t_juchu_kizai_honbanbi.juchu_head_id,
             t_juchu_kizai_honbanbi.juchu_kizai_head_id,
             count(*) AS count
            FROM t_juchu_kizai_honbanbi
           WHERE t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id = 20
           GROUP BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id) rihabi ON t_juchu_kizai_head.juchu_head_id = rihabi.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = rihabi.juchu_kizai_head_id
      LEFT JOIN ( SELECT t_juchu_kizai_honbanbi.juchu_head_id,
             t_juchu_kizai_honbanbi.juchu_kizai_head_id,
             count(*) AS count
            FROM t_juchu_kizai_honbanbi
           WHERE t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id = 30
           GROUP BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id) genebi ON t_juchu_kizai_head.juchu_head_id = genebi.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = genebi.juchu_kizai_head_id
      LEFT JOIN ( SELECT t_juchu_kizai_honbanbi.juchu_head_id,
             t_juchu_kizai_honbanbi.juchu_kizai_head_id,
             count(*) AS count
            FROM t_juchu_kizai_honbanbi
           WHERE t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id = 40
           GROUP BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id) honbanbi ON t_juchu_kizai_head.juchu_head_id = honbanbi.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = honbanbi.juchu_kizai_head_id
      LEFT JOIN v_honbanbi_calc ON t_juchu_kizai_head.juchu_head_id = v_honbanbi_calc.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = v_honbanbi_calc.juchu_kizai_head_id
      LEFT JOIN ( SELECT v_honbanbi_calc_1.juchu_honbanbi_calc_qty,
             v_honbanbi_calc_1.juchu_head_id,
             v_honbanbi_calc_1.juchu_kizai_head_id
            FROM v_honbanbi_calc v_honbanbi_calc_1) oya_v_honbanbi_calc ON t_juchu_kizai_head.juchu_head_id = oya_v_honbanbi_calc.juchu_head_id AND t_juchu_kizai_head.oya_juchu_kizai_head_id = oya_v_honbanbi_calc.juchu_kizai_head_id
      LEFT JOIN t_juchu_kizai_nyushuko kics_shuko ON t_juchu_kizai_head.juchu_head_id = kics_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_shuko.juchu_kizai_head_id AND kics_shuko.nyushuko_basho_id = 1 AND kics_shuko.nyushuko_shubetu_id = 1
      LEFT JOIN t_juchu_kizai_nyushuko kics_nyuko ON t_juchu_kizai_head.juchu_head_id = kics_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_nyuko.juchu_kizai_head_id AND kics_nyuko.nyushuko_basho_id = 1 AND kics_nyuko.nyushuko_shubetu_id = 2
      LEFT JOIN t_juchu_kizai_nyushuko yard_shuko ON t_juchu_kizai_head.juchu_head_id = yard_shuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_shuko.juchu_kizai_head_id AND yard_shuko.nyushuko_basho_id = 2 AND yard_shuko.nyushuko_shubetu_id = 1
      LEFT JOIN t_juchu_kizai_nyushuko yard_nyuko ON t_juchu_kizai_head.juchu_head_id = yard_nyuko.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_nyuko.juchu_kizai_head_id AND yard_nyuko.nyushuko_basho_id = 2 AND yard_nyuko.nyushuko_shubetu_id = 2
      LEFT JOIN t_nyushuko_fix kics_shuko_fix ON t_juchu_kizai_head.juchu_head_id = kics_shuko_fix.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_shuko_fix.juchu_kizai_head_id AND kics_shuko_fix.sagyo_kbn_id = 60 AND kics_shuko_fix.sagyo_id = 1
      LEFT JOIN t_nyushuko_fix yard_shuko_fix ON t_juchu_kizai_head.juchu_head_id = yard_shuko_fix.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_shuko_fix.juchu_kizai_head_id AND yard_shuko_fix.sagyo_kbn_id = 60 AND yard_shuko_fix.sagyo_id = 2
      LEFT JOIN t_nyushuko_fix kics_nyuko_fix ON t_juchu_kizai_head.juchu_head_id = kics_nyuko_fix.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = kics_nyuko_fix.juchu_kizai_head_id AND kics_nyuko_fix.sagyo_kbn_id = 70 AND kics_nyuko_fix.sagyo_id = 1
      LEFT JOIN t_nyushuko_fix yard_nyuko_fix ON t_juchu_kizai_head.juchu_head_id = yard_nyuko_fix.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = yard_nyuko_fix.juchu_kizai_head_id AND yard_nyuko_fix.sagyo_kbn_id = 70 AND yard_nyuko_fix.sagyo_id = 2
   WHERE t_juchu_head.del_flg = 0
   GROUP BY t_juchu_head.juchu_head_id, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, t_juchu_head.kokyaku_id, m_kokyaku.kokyaku_nam, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_kizai_head.head_nam, '（仮）TODO'::text, kics_shuko.nyushuko_dat, kics_nyuko.nyushuko_dat, yard_shuko.nyushuko_dat, yard_nyuko.nyushuko_dat, t_juchu_kizai_head.nebiki_amt, t_juchu_kizai_head.mem, t_juchu_kizai_head.dsp_ord_num, t_juchu_kizai_head.oya_juchu_kizai_head_id, t_juchu_kizai_head.ht_kbn, t_juchu_kizai_head.juchu_kizai_head_kbn, v_honbanbi_calc.juchu_honbanbi_calc_qty, t_juchu_kizai_head.nebiki_rat, kics_shuko_fix.sagyo_fix_flg, yard_shuko_fix.sagyo_fix_flg, t_juchu_head.juchu_dat, kics_nyuko_fix.sagyo_fix_flg, yard_nyuko_fix.sagyo_fix_flg, t_juchu_head.nyuryoku_user
   ORDER BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_kizai_head.head_nam;
