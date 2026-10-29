-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den_head  事前準備（作業区分 80/90）に対応。末尾に jizen_juchu_kizai_head_id を追加（18→19列）
--
-- 変更内容（v_nyushuko_den と同じ考え方）:
--   ・入出庫種別の CASE に 80/90 → 3 を追加。末尾の列 jizen_juchu_kizai_head_id を追加し GROUP BY にも加える。
--   ・sstb_plan_qty に 80、schk_plan_qty に 90 の予定数を入れる。
--   ・shuko_fix_flg: 事前の行は本番（同じ機材ヘッダー・場所・本番の出庫日時）が出発済みなら 1。
--     ゲートは出庫の読取画面を開くときにこのビュー（v_nyushuko_den2_head 経由）のヘッダー情報が取れないと例外で落ちるので、
--     事前の行も必ず1行出す。
--
-- 依存しているビュー: v_nyushuko_den2_head のみ
-- 適用順: このファイル → v_nyushuko_den2_head.sql
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で既存18列・行数（3,665）とも差分0
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den_head WITH (security_invoker = on) AS
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
        CASE
            WHEN max(jizen_fix.sagyo_fix_flg) = 1 THEN 1
            WHEN min(shuko_fix.sagyo_sts_id) <> 62 OR min(shuko_fix.sagyo_sts_id) IS NULL THEN 0
            ELSE 1
        END AS shuko_fix_flg,
        CASE
            WHEN min(nyuko_fix.sagyo_sts_id) <> 72 OR min(nyuko_fix.sagyo_sts_id) IS NULL THEN 0
            ELSE 1
        END AS nyuko_fix_flg,
    t_juchu_kizai_head.mem,
    t_juchu_head.juchu_dat,
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
    t_juchu_head.nyuryoku_user,
    CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END AS jizen_juchu_kizai_head_id
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN v_nyushuko_fix_sts shuko_fix ON t_nyushuko_den.juchu_head_id = shuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = shuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = shuko_fix.sagyo_id AND shuko_fix.sagyo_kbn_id = 60 AND (t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20)
     LEFT JOIN t_juchu_kizai_nyushuko honban_shuko ON honban_shuko.juchu_head_id = t_nyushuko_den.juchu_head_id AND honban_shuko.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND honban_shuko.nyushuko_shubetu_id = 1 AND honban_shuko.nyushuko_basho_id = t_nyushuko_den.sagyo_id AND (t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90)
     LEFT JOIN t_nyushuko_fix jizen_fix ON jizen_fix.juchu_head_id = t_nyushuko_den.juchu_head_id AND jizen_fix.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND jizen_fix.sagyo_kbn_id = 60 AND jizen_fix.sagyo_den_dat = honban_shuko.nyushuko_dat AND jizen_fix.sagyo_id = t_nyushuko_den.sagyo_id AND jizen_fix.sagyo_fix_flg = 1
     LEFT JOIN v_nyushuko_fix_sts nyuko_fix ON t_nyushuko_den.juchu_head_id = nyuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = nyuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = nyuko_fix.sagyo_id AND nyuko_fix.sagyo_kbn_id = 70 AND t_nyushuko_den.sagyo_kbn_id = 30
     LEFT JOIN m_sagyo_sts m_no_meisai ON m_no_meisai.sts_id = '-1'::integer
  GROUP BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, m_shozoku.shozoku_nam_short, t_nyushuko_den.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END), t_juchu_kizai_head.mem, t_juchu_head.juchu_dat, t_juchu_head.nyuryoku_user, (CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END)
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.juchu_head_id, t_juchu_head.koen_nam, m_kokyaku.kokyaku_nam;
