-- 適用状況: 開発環境(preview/public) 2026-08-21 / 本番 2026-09-03
-- =====================================================================
-- v_nyushuko_den_lst  ※本番未適用の変更を2件累積して持つ
--
-- 本番に適用すると下記2件がまとめて反映される。戻す場合は
-- v_nyushuko_den_lst.rollback.sql（本番の現在の定義）を実行する。
--
-- 変更1: mem2 列の出力元修正
--   mem2 は t_juchu_kizai_meisai.mem2（機材明細メモ）のみを出しており、
--   コンテナ明細（ctn_flg = 1）の行では常にNULLになっていた。
--   t_juchu_ctn_meisai を「機材明細と同じキー・ctn_flg = 1条件」でLEFT JOIN追加し、
--   mem2 = COALESCE(機材明細.mem2, コンテナ明細.mem) とした。
--   注意: t_juchu_ctn_meisai は同一キーに対し shozoku_id（KICS/YARD）別に複数行持つ。
--   絞らずJOINすると sum(plan_qty)/sum(result_qty) 等が行数分fanoutして二重集計に
--   なるため、t_nyushuko_den.sagyo_id = t_juchu_ctn_meisai.shozoku_id を
--   JOIN条件に追加して1行のみに一致させている。
--
-- 変更2（2026-08-21 追加）: 末尾に add_user / upd_user の2列を追加
--   t_nyushuko_den.add_user / upd_user をそのまま出す（character varying(50)）。
--   GROUP BY にも同2列を追加しているが、既存のGROUP BYキーは t_nyushuko_den の
--   主キー7列（juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id,
--   sagyo_kbn_id, sagyo_den_dat, sagyo_id, kizai_id）を含んでおり1グループ=1行
--   （実測 max_rows_per_group = 1）なので、2列を足しても行は分裂しない。
--   検証: 開発環境で既存34列・全124,923行が新旧で差分0、行数も不変。
--   なお upd_user は25,935行がNULL（GROUP BYではNULL同士が1グループになる）。
--
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
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
    COALESCE(t_juchu_kizai_meisai.mem2, t_juchu_ctn_meisai.mem) AS mem2,
    t_nyushuko_den.add_user
    ,t_nyushuko_den.upd_user
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
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_kbn_id, t_nyushuko_den.sagyo_id, m_kizai.bld_cod, m_kizai.tana_cod, m_kizai.eda_cod, (COALESCE(m_kizai.ctn_flg, 0)), t_nyushuko_den.juchu_head_id, t_nyushuko_den.juchu_kizai_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_nyushuko_den.dsp_ord_num
;
