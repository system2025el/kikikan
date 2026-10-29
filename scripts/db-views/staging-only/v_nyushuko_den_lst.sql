-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den_lst  入出庫種別（nyushuko_shubetu_id）の CASE に 80/90 → 3（事前）を追加（列構成は不変）
--
-- 事前の伝票の明細行が種別 3 になる。行はもともと機材ヘッダー単位なので、ほかの変更は無い。
-- 依存しているビュー: v_nyushuko_den2_lst, v_nyushuko_den2_lst_oyako, v_nyushuko_den2_result（列構成を変えないので作り直し不要）
--   v_nyushuko_den2_lst_oyako は v_get_juchu_kizai_head を機材ヘッダーで絞らずに結合するので、事前の行は二重になり得るが、
--   使っている所（Web・関数 nyuko_list_cut_keep_*）は入庫（30）だけを見るので影響しない。
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で全列・行数（125,173）とも差分0
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den_lst WITH (security_invoker = on) AS
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
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
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
    COALESCE(t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem) AS mem2,
    t_nyushuko_den.add_user,
    t_nyushuko_den.upd_user
   FROM t_nyushuko_den
     LEFT JOIN m_kizai ON m_kizai.kizai_id = t_nyushuko_den.kizai_id
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_kizai_meisai_id = t_juchu_kizai_meisai.juchu_kizai_meisai_id AND m_kizai.kizai_id = t_juchu_kizai_meisai.kizai_id AND COALESCE(m_kizai.ctn_flg, 0) = 0
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_kizai_meisai_id = t_juchu_ctn_meisai.juchu_kizai_meisai_id AND m_kizai.kizai_id = t_juchu_ctn_meisai.kizai_id AND t_nyushuko_den.sagyo_id = t_juchu_ctn_meisai.shozoku_id AND COALESCE(m_kizai.ctn_flg, 0) = 1
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN m_sagyo_kbn ON m_sagyo_kbn.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_nyushuko_den.juchu_kizai_meisai_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, t_nyushuko_den.kizai_id, m_kizai.kizai_nam, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, m_kizai.ctn_flg, m_kizai.kizai_grp_cod, m_kizai.dsp_ord_num, m_kizai.mem, m_kizai.bumon_id, m_kizai.shukei_bumon_id, m_kizai.dsp_flg, m_kizai.def_dat_qty, t_nyushuko_den.sagyo_kbn_id, m_sagyo_kbn.sagyo_kbn_nam, m_sagyo_kbn.sagyo_kbn_nam_short, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.dsp_ord_num, t_nyushuko_den.indent_num, t_juchu_kizai_head.oya_juchu_kizai_head_id, t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem, t_nyushuko_den.add_user, t_nyushuko_den.upd_user
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_kbn_id, t_nyushuko_den.sagyo_id, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, (COALESCE(m_kizai.ctn_flg, 0)), t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_nyushuko_den.dsp_ord_num;
