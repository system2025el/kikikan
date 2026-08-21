-- 適用状況: 開発環境(preview/public) 2026-08-21 / 本番 未適用
-- =====================================================================
-- v_nyushuko_den_head  末尾に nyuryoku_user（入力者）を追加
--
-- 変更内容: t_juchu_head.nyuryoku_user を末尾に1列追加し、GROUP BY にも同列を追加。
--           t_juchu_head は元々このビューで JOIN 済み（del_flg = 0 の INNER JOIN）
--           なので、JOIN の追加は不要。
--
-- 行が増えない根拠: t_juchu_head の主キーは juchu_head_id 単独であり、
--           既存の GROUP BY には t_nyushuko_den.juchu_head_id が含まれている。
--           よって nyuryoku_user は既存キーに関数従属し、GROUP BY に足しても
--           グループは分裂しない。
--           検証: 開発環境で既存17列・全3,611行が新旧で差分0、行数も不変。
--
-- 型: character varying(100)（NULL可）
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den_head
WITH (security_invoker = on) AS
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
        CASE
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
    t_juchu_head.nyuryoku_user
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kokyaku ON m_kokyaku.kokyaku_id = t_juchu_head.kokyaku_id
     LEFT JOIN m_shozoku ON m_shozoku.shozoku_id = t_nyushuko_den.sagyo_id
     LEFT JOIN v_nyushuko_fix_sts shuko_fix ON t_nyushuko_den.juchu_head_id = shuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = shuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = shuko_fix.sagyo_id AND shuko_fix.sagyo_kbn_id = 60 AND (t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20)
     LEFT JOIN v_nyushuko_fix_sts nyuko_fix ON t_nyushuko_den.juchu_head_id = nyuko_fix.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = nyuko_fix.juchu_kizai_head_id AND t_nyushuko_den.sagyo_id = nyuko_fix.sagyo_id AND nyuko_fix.sagyo_kbn_id = 70 AND t_nyushuko_den.sagyo_kbn_id = 30
     LEFT JOIN m_sagyo_sts m_no_meisai ON m_no_meisai.sts_id = '-1'::integer
  GROUP BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, m_shozoku.shozoku_nam_short, t_nyushuko_den.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_kbn, t_juchu_head.koen_nam, t_juchu_head.koenbasho_nam, m_kokyaku.kokyaku_nam, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END), t_juchu_kizai_head.mem, t_juchu_head.juchu_dat, t_juchu_head.nyuryoku_user
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, m_shozoku.shozoku_nam, t_nyushuko_den.juchu_head_id, t_juchu_head.koen_nam, m_kokyaku.kokyaku_nam
;
