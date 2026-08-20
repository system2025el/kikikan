-- =====================================================================
-- v_nyushuko_den_lst mem2列の出力元修正
--
-- 変更内容: mem2 は現状 t_juchu_kizai_meisai.mem2（機材明細メモ）のみを出しており、
--           コンテナ明細（ctn_flg = 1）の行では常にNULLになっていた。
--           t_juchu_ctn_meisai を「機材明細と同じキー・ctn_flg = 1条件」でLEFT JOIN追加し、
--           mem2 = COALESCE(機材明細.mem2, コンテナ明細.mem) とすることで、
--           機材はt_juchu_kizai_meisai.mem2、コンテナはt_juchu_ctn_meisai.memを出すようにする。
--           1行につき機材明細・コンテナ明細のどちらか一方しかJOINしない（ctn_flgで排他）ため、
--           COALESCEで安全に合成できる。
--           注意: t_juchu_ctn_meisai は同一キー（juchu_head_id, juchu_kizai_head_id,
--           juchu_kizai_meisai_id, kizai_id）に対し shozoku_id（KICS/YARD）別に複数行持つ。
--           これを絞らずJOINするとsum(plan_qty)/sum(result_qty)等が行数分fanoutして
--           二重集計されるため、t_nyushuko_den.sagyo_id = t_juchu_ctn_meisai.shozoku_id を
--           JOIN条件に追加し1行のみに一致させている（t_nyushuko_denの粒度はsagyo_id単位で
--           shozoku_idと同一ドメイン）。他の列・WHERE・ORDER BYは変更なし。
-- 取得元  : ステージング jimqcvyaoddsxbcrsnfs / public スキーマ（適用済みの定義）
--
-- 注意: reloptions はステージング側の設定に合わせて security_invoker = on を明示している。
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
    COALESCE(t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem) AS mem2
   FROM t_nyushuko_den
     LEFT JOIN m_kizai ON m_kizai.kizai_id = t_nyushuko_den.kizai_id
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_kizai_meisai_id = t_juchu_kizai_meisai.juchu_kizai_meisai_id AND m_kizai.kizai_id = t_juchu_kizai_meisai.kizai_id AND COALESCE(m_kizai.ctn_flg, 0) = 0
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id AND t_nyushuko_den.juchu_kizai_meisai_id = t_juchu_ctn_meisai.juchu_kizai_meisai_id AND m_kizai.kizai_id = t_juchu_ctn_meisai.kizai_id AND t_nyushuko_den.sagyo_id = t_juchu_ctn_meisai.shozoku_id AND COALESCE(m_kizai.ctn_flg, 0) = 1
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN m_sagyo_kbn ON m_sagyo_kbn.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_nyushuko_den.juchu_kizai_meisai_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, t_nyushuko_den.kizai_id, m_kizai.kizai_nam, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, m_kizai.ctn_flg, m_kizai.kizai_grp_cod, m_kizai.dsp_ord_num, m_kizai.mem, m_kizai.bumon_id, m_kizai.shukei_bumon_id, m_kizai.dsp_flg, m_kizai.def_dat_qty, t_nyushuko_den.sagyo_kbn_id, m_sagyo_kbn.sagyo_kbn_nam, m_sagyo_kbn.sagyo_kbn_nam_short, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.dsp_ord_num, t_nyushuko_den.indent_num, t_juchu_kizai_head.oya_juchu_kizai_head_id, t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_kbn_id, t_nyushuko_den.sagyo_id, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, (COALESCE(m_kizai.ctn_flg, 0)), t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_nyushuko_den.dsp_ord_num
;
