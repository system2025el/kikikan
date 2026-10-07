-- 適用状況: ステージング 2026-09-30（2026-10-01 fix_flg の定義変更を再適用） / 本番 2026-10-07
-- =====================================================================
-- v_nyushuko_den  末尾に nyuko_fix_sts / shuko_fix_sts（到着・出発の 0=なし / 1=一部 / 2=全部）を追加し、
--                 nyuko_fix_flg / shuko_fix_flg を「全部確定済みのときだけ 1」に変える
--
-- 変更内容: 一覧の1行（入出庫日時・場所・受注・区分・入出庫種別）に合体している受注機材ヘッダーのうち、
--           確定済み（入庫 sagyo_sts_id 72 / 出庫 62）のヘッダー数と、対象の作業区分の行を持つヘッダー数を数える。
--           確定済みが0 → 0、全部 → 2、それ以外 → 1。
--           入庫の行（入出庫種別 2）では shuko_fix_sts は常に 0、出庫の行（1）では nyuko_fix_sts は常に 0。
-- 行が増えない根拠: 集計列を末尾に足すだけで GROUP BY は変えない。
--
-- nyuko_fix_flg / shuko_fix_flg: これまでは min(sagyo_sts_id) が NULL を無視するため「どれか1つでも確定済みなら 1」だった。
--   HT・ゲートはこの列が 1 だと送信できない（HT は送信ボタン無効、ゲートは画面を開いた時点の値で送信不可）。
--   Web は一部確定済みでも到着・出発できるので、HT・ゲートからも送信できるよう「*_fix_sts = 2 のときだけ 1」にそろえる。
--   列名・型・順番は変えない（CREATE OR REPLACE のまま適用できる）。
--   使っている所: HT 入出庫検索（v_nyushuko_den2 経由。送信可否・済の色・到着済/出発済の絞り込み）、
--                 ゲート入出庫検索（色・出発済の絞り込み）と読取画面（送信可否）。
--                 Web の selectShukoStateConfirm は「一部でも出発済み」を見たいので shuko_fix_sts > 0 に変えた。
-- 前提: v_nyushuko_den.sql → v_nyushuko_den2.sql の順で適用する（ロールバックは逆順）。
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
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
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) > 0 AND count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN t_nyushuko_den.juchu_kizai_head_id
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
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 THEN t_nyushuko_den.plan_qty::bigint
            ELSE NULL::bigint
        END, 0::bigint))::bigint AS sstb_plan_qty,
    sum(COALESCE(
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 20 THEN t_nyushuko_den.plan_qty::bigint
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
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = 0 THEN 0
            WHEN count(DISTINCT
            CASE
                WHEN shuko_fix.sagyo_sts_id = 62 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) = count(DISTINCT
            CASE
                WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN t_nyushuko_den.juchu_kizai_head_id
                ELSE NULL::integer
            END) THEN 2
            ELSE 1
        END AS shuko_fix_sts
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN v_nyushuko_total_time_sts v_sstb ON v_sstb.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_sstb.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_sstb.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_sstb.sagyo_id = t_nyushuko_den.sagyo_id AND v_sstb.sagyo_kbn_id = 10 AND v_sstb.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_nyushuko_total_time_sts v_schk ON v_schk.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_schk.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_schk.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_schk.sagyo_id = t_nyushuko_den.sagyo_id AND v_schk.sagyo_kbn_id = 20 AND v_schk.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN v_nyushuko_total_time_sts v_nchk ON v_nchk.juchu_head_id = t_nyushuko_den.juchu_head_id AND v_nchk.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND v_nchk.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND v_nchk.sagyo_id = t_nyushuko_den.sagyo_id AND v_nchk.sagyo_kbn_id = 30 AND v_nchk.juchu_kizai_head_kbn = t_juchu_kizai_head.juchu_kizai_head_kbn
     LEFT JOIN m_sagyo_sts m_sstb ON v_sstb.sagyo_sts_id = m_sstb.sts_id
     LEFT JOIN m_sagyo_sts m_schk ON v_schk.sagyo_sts_id = m_schk.sts_id
     LEFT JOIN m_sagyo_sts m_nchk ON v_nchk.sagyo_sts_id = m_nchk.sts_id
     LEFT JOIN v_nyushuko_fix_sts shuko_fix ON t_nyushuko_den.juchu_head_id = shuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = shuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = shuko_fix.sagyo_id AND shuko_fix.sagyo_kbn_id = 60 AND (t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20) AND shuko_fix.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat
     LEFT JOIN v_nyushuko_fix_sts nyuko_fix ON t_nyushuko_den.juchu_head_id = nyuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = nyuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = nyuko_fix.sagyo_id AND nyuko_fix.sagyo_kbn_id = 70 AND t_nyushuko_den.sagyo_kbn_id = 30 AND nyuko_fix.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat
     LEFT JOIN m_sagyo_sts m_no_meisai ON m_no_meisai.sts_id = '-1'::integer
  GROUP BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, m_shozoku.shozoku_nam_short, t_nyushuko_den.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END)
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.juchu_head_id, t_juchu_head.koen_nam, m_kokyaku.kokyaku_nam;
