-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den  事前準備（作業区分 80/90）に対応。末尾に jizen_juchu_kizai_head_id を追加（26→27列）
--
-- 変更内容:
--   ・入出庫種別（nyushuko_shubetu_id）の CASE に 80/90 → 3（事前）を追加。
--   ・末尾の列 jizen_juchu_kizai_head_id（80/90 は受注機材ヘッダーid、それ以外は 0）を追加し GROUP BY にも加える。
--     事前の行は機材ヘッダーごとに1行。v_nyushuko_den2 はこの列で v_get_juchu_kizai_head の該当ヘッダーの行を選ぶ。
--   ・事前の行のピッキング列（sstb_*）に 80、最終確認列（schk_*）に 90 の状態と予定数を入れる（状態は 11/12/21/22 に読み替え済み）。
--   ・出発（shuko_fix_flg / shuko_fix_sts）: 事前には出発が無いので、事前の行には「本番（同じ機材ヘッダー・場所）が出発済みか」を返す。
--     本番の出庫日時は t_juchu_kizai_nyushuko（出庫・その場所）から取り、t_nyushuko_fix の主キーで引く（jizen_fix）。
--     出発済みなら shuko_fix_flg = 1 / shuko_fix_sts = 2（HT・ゲートの送信不可、一覧のグレー表示がそのまま効く）。
--     本番の行の出発の判定（shuko_fix の結合）は変えていない。分母（対象のヘッダー数）の条件に 80/90 を足したが、
--     事前の行は入出庫種別が 3 で別のグループになるので本番の行の値は変わらない。
--
-- ★本番の出発の結合を COALESCE(本番の出庫日時, 伝票の日時) の1本にまとめると、マージ結合が使えず t_nyushuko_fix を総当たりして
--   出庫一覧が 1.3 倍遅くなった（2026-10-21 試行）。事前用の結合を別に足しているのはそのため。
--
-- 依存しているビュー: v_nyushuko_den2 のみ。関数からの参照なし（2026-10-21 ステージングで確認）
-- 前提: v_nyushuko_total_time_sts.sql を先に当てる（jizen_juchu_kizai_head_id を結合に使う）。この後 v_nyushuko_den2.sql。
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で既存26列・行数（3,559）とも差分0。
--   出庫一覧相当（v_nyushuko_den2、1週間）: 約 0.66秒 → 0.70秒、今日: 約 1.15秒 → 1.25秒。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den WITH (security_invoker = on) AS
 SELECT t_nyushuko_den.sagyo_den_dat AS nyushuko_dat,
    t_nyushuko_den.sagyo_id AS nyushuko_basho_id,
    m_shozoku.shozoku_nam,
    m_shozoku.shozoku_nam_short,
    t_nyushuko_den.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_kbn,
    t_juchu_head.koen_nam,
    t_juchu_head.koenbasho_nam,
    m_kokyaku.kokyaku_nam,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
    COALESCE(max(v_sstb.sagyo_sts_id), '-1'::integer) AS sstb_sagyo_sts_id,
    COALESCE(max(m_sstb.sts_nam::text), max(m_no_meisai.sts_nam::text)) AS sstb_sagyo_sts_nam,
    COALESCE(max(m_sstb.sts_nam_short::text), max(m_no_meisai.sts_nam_short::text)) AS sstb_sagyo_sts_nam_short,
    COALESCE(max(v_schk.sagyo_sts_id), '-1'::integer) AS schk_sagyo_sts_id,
    COALESCE(max(m_schk.sts_nam::text), max(m_no_meisai.sts_nam::text)) AS schk_sagyo_sts_nam,
    COALESCE(max(m_schk.sts_nam_short::text), max(m_no_meisai.sts_nam_short::text)) AS schk_sagyo_sts_nam_short,
    COALESCE(max(v_nchk.sagyo_sts_id), '-1'::integer) AS nchk_sagyo_sts_id,
    COALESCE(max(m_nchk.sts_nam::text), max(m_no_meisai.sts_nam::text)) AS nchk_sagyo_sts_nam,
    COALESCE(max(m_nchk.sts_nam_short::text), max(m_no_meisai.sts_nam_short::text)) AS nchk_sagyo_sts_nam_short,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 OR jizen_fix.sagyo_fix_flg = 1 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) > 0 AND count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 OR jizen_fix.sagyo_fix_flg = 1 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 OR t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 1
            ELSE 0
        END AS shuko_fix_flg,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) > 0 AND count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 1
            ELSE 0
        END AS nyuko_fix_flg,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 80 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS sstb_plan_qty,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 20 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS schk_plan_qty,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS nchk_plan_qty,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = 0 THEN 0
            WHEN count(DISTINCT
            CASE
                WHEN nyuko_fix.sagyo_sts_id = 72 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 2
            ELSE 1
        END AS nyuko_fix_sts,
        CASE
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 OR jizen_fix.sagyo_fix_flg = 1 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = 0 THEN 0
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 OR jizen_fix.sagyo_fix_flg = 1 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 OR t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 2
            ELSE 1
        END AS shuko_fix_sts,
    CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END AS jizen_juchu_kizai_head_id
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN v_nyushuko_total_time_sts v_sstb ON v_sstb.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_sstb.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_sstb.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_sstb.sagyo_id = t_nyushuko_den.sagyo_id AND (v_sstb.sagyo_kbn_id = 10 OR v_sstb.sagyo_kbn_id = 80) AND v_sstb.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn AND v_sstb.jizen_juchu_kizai_head_id = (CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END)
     LEFT JOIN v_nyushuko_total_time_sts v_schk ON v_schk.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_schk.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_schk.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_schk.sagyo_id = t_nyushuko_den.sagyo_id AND (v_schk.sagyo_kbn_id = 20 OR v_schk.sagyo_kbn_id = 90) AND v_schk.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn AND v_schk.jizen_juchu_kizai_head_id = (CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END)
     LEFT JOIN v_nyushuko_total_time_sts v_nchk ON v_nchk.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_nchk.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_nchk.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_nchk.sagyo_id = t_nyushuko_den.sagyo_id AND v_nchk.sagyo_kbn_id = 30 AND v_nchk.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN m_sagyo_sts m_sstb ON v_sstb.sagyo_sts_id = m_sstb.sts_id
     LEFT JOIN m_sagyo_sts m_schk ON v_schk.sagyo_sts_id = m_schk.sts_id
     LEFT JOIN m_sagyo_sts m_nchk ON v_nchk.sagyo_sts_id = m_nchk.sts_id
     LEFT JOIN v_nyushuko_fix_sts shuko_fix ON t_nyushuko_den.juchu_head_id = shuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = shuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = shuko_fix.sagyo_id AND shuko_fix.sagyo_kbn_id = 60 AND (t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20) AND shuko_fix.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat
     LEFT JOIN t_juchu_kizai_nyushuko honban_shuko ON honban_shuko.juchu_head_id = t_nyushuko_den.juchu_head_id AND honban_shuko.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND honban_shuko.nyushuko_shubetu_id = 1 AND honban_shuko.nyushuko_basho_id = t_nyushuko_den.sagyo_id AND (t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90)
     LEFT JOIN t_nyushuko_fix jizen_fix ON jizen_fix.juchu_head_id = t_nyushuko_den.juchu_head_id AND jizen_fix.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND jizen_fix.sagyo_kbn_id = 60 AND jizen_fix.sagyo_den_dat = honban_shuko.nyushuko_dat AND jizen_fix.sagyo_id = t_nyushuko_den.sagyo_id AND jizen_fix.sagyo_fix_flg = 1
     LEFT JOIN v_nyushuko_fix_sts nyuko_fix ON t_nyushuko_den.juchu_head_id = nyuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = nyuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = nyuko_fix.sagyo_id AND nyuko_fix.sagyo_kbn_id = 70 AND t_nyushuko_den.sagyo_kbn_id = 30 AND nyuko_fix.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat
     LEFT JOIN m_sagyo_sts m_no_meisai ON m_no_meisai.sts_id = '-1'::integer
  GROUP BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, m_shozoku.shozoku_nam_short, t_nyushuko_den.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END), (CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END)
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.juchu_head_id, t_juchu_head.koen_nam, m_kokyaku.kokyaku_nam;
