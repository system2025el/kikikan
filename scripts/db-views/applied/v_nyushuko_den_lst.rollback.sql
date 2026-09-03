-- 適用状況: 開発環境(preview/public) 2026-08-21 / 本番 2026-09-03
-- =====================================================================
-- v_nyushuko_den_lst 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : ステージング Supabase プロジェクト jimqcvyaoddsxbcrsnfs / public スキーマ
-- 取得日 : 2026-08-20（適用直前）
-- 取得方法: SELECT pg_get_viewdef('public.v_nyushuko_den_lst', true)
-- reloptions: ["security_invoker=on"]
--
-- 用途: v_nyushuko_den_lst.sql を適用したあとに問題が出た場合、
--       このファイルをそのまま実行すれば変更前の定義に戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den_lst
WITH (security_invoker = on) AS
 SELECT t_nyushuko_den.juchu_head_id,
    t_nyushuko_den.juchu_kizai_head_id,
    t_nyushuko_den.juchu_kizai_meisai_id,
    t_juchu_kizai_head.juchu_kizai_head_kbn,
    t_juchu_head.koen_nam,
    t_juchu_head.koenbasho_nam,
    m_kokyaku.kokyaku_nam,
    t_nyushuko_den.kizai_id,
    COALESCE(repeat((( SELECT m_dic.dic_val
           FROM m_dic
          WHERE m_dic.dic_id = 1))::text, COALESCE(t_nyushuko_den.indent_num, 0)), ''::text) || m_kizai.kizai_nam::text AS kizai_nam,
    m_kizai.bld_cod,
    m_kizai.tana_cod,
    m_kizai.eda_cod,
    COALESCE(m_kizai.ctn_flg, 0) AS ctn_flg,
    m_kizai.kizai_grp_cod,
    m_kizai.dsp_ord_num,
    m_kizai.mem,
    m_kizai.bumon_id,
    m_kizai.shukei_bumon_id,
    m_kizai.dsp_flg,
    m_kizai.def_dat_qty,
    t_nyushuko_den.sagyo_id AS nyushuko_basho_id,
    m_shozoku.shozoku_nam,
    t_nyushuko_den.sagyo_den_dat AS nyushuko_dat,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
    t_nyushuko_den.sagyo_kbn_id,
    m_sagyo_kbn.sagyo_kbn_nam,
    m_sagyo_kbn.sagyo_kbn_nam_short,
    sum(COALESCE(t_nyushuko_den.plan_qty, 0)) AS plan_qty,
    sum(COALESCE(t_nyushuko_den.result_qty, 0)) AS result_qty,
    sum(COALESCE(t_nyushuko_den.result_adj_qty, 0)) AS result_adj_qty,
    t_nyushuko_den.dsp_ord_num AS dsp_ord_num_meisai,
    t_nyushuko_den.indent_num,
    t_juchu_kizai_head.oya_juchu_kizai_head_id,
    t_juchu_kizai_meisai.mem2
   FROM t_nyushuko_den
     LEFT JOIN m_kizai ON m_kizai.kizai_id = t_nyushuko_den.kizai_id
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_kizai_meisai_id = t_juchu_kizai_meisai.juchu_kizai_meisai_id AND m_kizai.kizai_id = t_juchu_kizai_meisai.kizai_id AND COALESCE(m_kizai.ctn_flg, 0) = 0
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN m_sagyo_kbn ON m_sagyo_kbn.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_nyushuko_den.juchu_kizai_meisai_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, t_nyushuko_den.kizai_id, m_kizai.kizai_nam, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, m_kizai.ctn_flg, m_kizai.kizai_grp_cod, m_kizai.dsp_ord_num, m_kizai.mem, m_kizai.bumon_id, m_kizai.shukei_bumon_id, m_kizai.dsp_flg, m_kizai.def_dat_qty, t_nyushuko_den.sagyo_kbn_id, m_sagyo_kbn.sagyo_kbn_nam, m_sagyo_kbn.sagyo_kbn_nam_short, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.dsp_ord_num, t_nyushuko_den.indent_num, t_juchu_kizai_head.oya_juchu_kizai_head_id, t_juchu_kizai_meisai.mem2
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_kbn_id, t_nyushuko_den.sagyo_id, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, (COALESCE(m_kizai.ctn_flg, 0)), t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_nyushuko_den.dsp_ord_num;
