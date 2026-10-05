-- 適用状況: ステージング 未適用 / 本番 未適用
-- =====================================================================
-- v_juchu_ctn_meisai  コンテナ明細を K / Y の片方だけ持つ場合に対応する（コンテナ管理を出庫側に移す改修）
--
-- 背景: これまで受注コンテナ明細はメイン明細から KICS・YARD の2行を必ず作っていた。改修後は出庫明細の保存時・
--       HT/ゲートの送信時に、その作業場所の1行だけを作る。
--
-- 変更内容（結合は変えず、出力列の式と GROUP BY / ORDER BY だけを変える。列の名前・順番・型は同じ）
--   1. kics_plan_kizai_qty / yard_plan_kizai_qty / kics_keep_qty / yard_keep_qty：行が無い側は NULL ではなく 0
--   2. mem：K と Y の両方にあって値が違えば「K の mem + 改行 + Y の mem」、同じなら1つ、片方だけならその値（空文字は無いものとして扱う）
--   3. dsp_ord_num：COALESCE(K, Y)
--   土台行（t_juchu_ctn_meisai そのもの）の mem・dsp_ord_num を出力と GROUP BY から外したので、
--   K と Y で mem・dsp_ord_num が違っていても同じコンテナが2行に分かれなくなる（ステージングで78件が該当していた）。
--
-- 参照: 受注機材明細（メイン・返却・キープ）のコンテナ一覧、出庫指示書PDF（nyushuko-pdf.ts。予定数はもともと coalesce 済み）
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_juchu_ctn_meisai WITH (security_invoker = on) AS
 SELECT DISTINCT t_juchu_head.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_id,
    t_juchu_ctn_meisai.juchu_kizai_meisai_id,
    (
        CASE
            WHEN NULLIF(kics_juchu_ctn_meisai.mem::text, ''::text) IS NOT NULL
             AND NULLIF(yard_juchu_ctn_meisai.mem::text, ''::text) IS NOT NULL
             AND kics_juchu_ctn_meisai.mem::text <> yard_juchu_ctn_meisai.mem::text
            THEN (kics_juchu_ctn_meisai.mem::text || chr(10)) || yard_juchu_ctn_meisai.mem::text
            ELSE COALESCE(NULLIF(kics_juchu_ctn_meisai.mem::text, ''::text), NULLIF(yard_juchu_ctn_meisai.mem::text, ''::text))
        END)::character varying(200) AS mem,
    t_juchu_ctn_meisai.kizai_id,
    v_kizai_lst.kizai_nam,
    v_kizai_lst.kizai_grp_cod,
    COALESCE(kics_juchu_ctn_meisai.dsp_ord_num, yard_juchu_ctn_meisai.dsp_ord_num) AS dsp_ord_num,
    COALESCE(kics_juchu_ctn_meisai.plan_kizai_qty, 0) AS kics_plan_kizai_qty,
    COALESCE(yard_juchu_ctn_meisai.plan_kizai_qty, 0) AS yard_plan_kizai_qty,
    COALESCE(kics_juchu_ctn_meisai.keep_qty, 0) AS kics_keep_qty,
    COALESCE(yard_juchu_ctn_meisai.keep_qty, 0) AS yard_keep_qty
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id
     LEFT JOIN t_juchu_ctn_meisai kics_juchu_ctn_meisai ON t_juchu_ctn_meisai.juchu_head_id = kics_juchu_ctn_meisai.juchu_head_id AND t_juchu_ctn_meisai.juchu_kizai_head_id = kics_juchu_ctn_meisai.juchu_kizai_head_id AND t_juchu_ctn_meisai.juchu_kizai_meisai_id = kics_juchu_ctn_meisai.juchu_kizai_meisai_id AND t_juchu_ctn_meisai.kizai_id = kics_juchu_ctn_meisai.kizai_id AND kics_juchu_ctn_meisai.shozoku_id = 1
     LEFT JOIN t_juchu_ctn_meisai yard_juchu_ctn_meisai ON t_juchu_ctn_meisai.juchu_head_id = yard_juchu_ctn_meisai.juchu_head_id AND t_juchu_ctn_meisai.juchu_kizai_head_id = yard_juchu_ctn_meisai.juchu_kizai_head_id AND t_juchu_ctn_meisai.juchu_kizai_meisai_id = yard_juchu_ctn_meisai.juchu_kizai_meisai_id AND t_juchu_ctn_meisai.kizai_id = yard_juchu_ctn_meisai.kizai_id AND yard_juchu_ctn_meisai.shozoku_id = 2
     LEFT JOIN v_kizai_lst ON v_kizai_lst.kizai_id = t_juchu_ctn_meisai.kizai_id
  WHERE t_juchu_head.del_flg = 0 AND t_juchu_ctn_meisai.juchu_kizai_meisai_id IS NOT NULL
  GROUP BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_ctn_meisai.juchu_kizai_meisai_id, kics_juchu_ctn_meisai.mem, yard_juchu_ctn_meisai.mem, t_juchu_ctn_meisai.kizai_id, v_kizai_lst.kizai_nam, v_kizai_lst.kizai_grp_cod, kics_juchu_ctn_meisai.dsp_ord_num, yard_juchu_ctn_meisai.dsp_ord_num, kics_juchu_ctn_meisai.plan_kizai_qty, yard_juchu_ctn_meisai.plan_kizai_qty, kics_juchu_ctn_meisai.keep_qty, yard_juchu_ctn_meisai.keep_qty
  ORDER BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, v_kizai_lst.kizai_grp_cod, (COALESCE(kics_juchu_ctn_meisai.dsp_ord_num, yard_juchu_ctn_meisai.dsp_ord_num));
