-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_total_time_sts  事前準備（作業区分 80 事前ピッキング・90 事前最終確認）に対応。末尾に jizen_juchu_kizai_head_id を追加（10→11列）
--
-- 変更内容:
--   ・末尾の列 jizen_juchu_kizai_head_id: 80/90 の伝票はその受注機材ヘッダーid、それ以外は 0。GROUP BY にも加える。
--     事前の伝票は機材ヘッダーごとに別の行にする（同じ準備日時・場所でも合体させない）ため。10/20/30 は 0 なので行は変わらない。
--   ・作業状態（sagyo_sts_id）は 80→10、90→20 に読み替えてから +1/+2 する。事前の行も 11/12/21/22 になり、
--     m_sagyo_sts の名前（ピッキング中など）をそのまま使える（81/82/91/92 はマスタに無い）。sagyo_kbn_id 列は元の値（80/90）のまま。
--   ・予定・読取・補正がすべて 0 の行を数えない条件に 80/90 を加える（10/20 と同じ扱い）。
--
-- 使う所: v_nyushuko_den（v_sstb は 10/80、v_schk は 20/90 の行を jizen_juchu_kizai_head_id も合わせて結合する）
-- 依存しているビュー: v_nyushuko_den のみ。関数からの参照なし（2026-10-21 ステージングで確認）
-- 適用順: このファイル → v_nyushuko_den.sql（列を末尾に足すだけなので CREATE OR REPLACE で当てられる）
-- reloptions: security_invoker = on（CREATE OR REPLACE で WITH を省くと外れるので必ず付ける）
-- 2026-10-21 ステージングで検証（一時ビューに新定義を作り読み取りのみで比較）: 事前の伝票が無い状態で既存10列・行数（6,449）とも差分0
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_total_time_sts WITH (security_invoker = on) AS
 SELECT s.juchu_head_id,
    s.sagyo_kbn_id,
    s.sagyo_den_dat,
    s.sagyo_id,
    count(s.sagyo_sts_id) AS count_all,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 2) AS count_sts2,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 1) AS count_sts1,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 0) AS count_sts0,
        CASE
            WHEN count(s.sagyo_sts_id) = 0 THEN '-1'::integer
            WHEN count(s.sagyo_sts_id) = count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 2) THEN (s.sagyo_kbn_id - CASE WHEN s.sagyo_kbn_id = 80 OR s.sagyo_kbn_id = 90 THEN 70 ELSE 0 END) + 2
            WHEN count(s.sagyo_sts_id) = count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 0) THEN 0
            ELSE (s.sagyo_kbn_id - CASE WHEN s.sagyo_kbn_id = 80 OR s.sagyo_kbn_id = 90 THEN 70 ELSE 0 END) + 1
        END AS sagyo_sts_id,
    s.juchu_kizai_head_kbn,
    s.jizen_juchu_kizai_head_id
   FROM ( SELECT t.juchu_head_id,
            t.sagyo_kbn_id,
            t.sagyo_den_dat,
            t.sagyo_id,
            t_juchu_kizai_head.juchu_kizai_head_kbn,
            CASE WHEN t.sagyo_kbn_id = 80 OR t.sagyo_kbn_id = 90 THEN t.juchu_kizai_head_id ELSE 0 END AS jizen_juchu_kizai_head_id,
                CASE
                    WHEN t.sagyo_kbn_id = 30 AND t.plan_qty = 0 AND t.result_qty = 0 AND t.result_adj_qty = 0 THEN NULL::integer
                    WHEN (t.sagyo_kbn_id = 10 OR t.sagyo_kbn_id = 20 OR t.sagyo_kbn_id = 80 OR t.sagyo_kbn_id = 90) AND t.plan_qty = 0 AND t.result_qty = 0 AND t.result_adj_qty = 0 THEN NULL::integer
                    WHEN (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0)) = 0 THEN 0
                    WHEN (COALESCE(t.plan_qty, 0) - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) > 0 THEN (t.sagyo_kbn_id - CASE WHEN t.sagyo_kbn_id = 80 OR t.sagyo_kbn_id = 90 THEN 70 ELSE 0 END) + 1
                    WHEN (COALESCE(t.plan_qty, 0) - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) < 0 AND COALESCE(m_kizai.ctn_flg, 0) = 0 THEN (t.sagyo_kbn_id - CASE WHEN t.sagyo_kbn_id = 80 OR t.sagyo_kbn_id = 90 THEN 70 ELSE 0 END) + 1
                    WHEN (COALESCE(t.plan_qty, 0) - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) < 0 AND COALESCE(m_kizai.ctn_flg, 0) = 1 THEN (t.sagyo_kbn_id - CASE WHEN t.sagyo_kbn_id = 80 OR t.sagyo_kbn_id = 90 THEN 70 ELSE 0 END) + 2
                    WHEN (COALESCE(t.plan_qty, 0) - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) = 0 THEN (t.sagyo_kbn_id - CASE WHEN t.sagyo_kbn_id = 80 OR t.sagyo_kbn_id = 90 THEN 70 ELSE 0 END) + 2
                    ELSE 0
                END AS sagyo_sts_id
           FROM t_nyushuko_den t
             LEFT JOIN m_kizai ON m_kizai.kizai_id = t.kizai_id
             LEFT JOIN t_juchu_kizai_head ON t.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
          WHERE t.juchu_kizai_meisai_id <> 0 AND t.kizai_id <> 0) s
  GROUP BY s.juchu_head_id, s.sagyo_den_dat, s.sagyo_kbn_id, s.sagyo_id, s.juchu_kizai_head_kbn, s.jizen_juchu_kizai_head_id
  ORDER BY s.sagyo_den_dat, s.sagyo_kbn_id, s.sagyo_id, s.juchu_head_id;
