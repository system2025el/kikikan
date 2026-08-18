-- v_nyushuko_total_time_sts 高速化版
--
-- 変更内容: v_nyushuko_sts を4回自己JOINしていた構造を、
--           t_nyushuko_den の1回スキャン + count(*) FILTER に統合した。
--
-- 等価性の根拠:
--   * 4つの派生サブクエリ(count_all/count_sts2/count_sts1/count_sts0)はすべて同じ
--     v_nyushuko_sts を参照し、同一の7列キーで結合していた。
--   * その7列キーは v_nyushuko_sts で一意（実測: 重複0件）であり、かつ
--     t_nyushuko_den の主キーと一致するため、結合は 1:0..1 である。
--   * したがって「各 t_nyushuko_den 行について v_nyushuko_sts に対応行が在るか／
--     その sagyo_sts_id が何か」を1回求めれば、4回の count は FILTER で再現できる。
--   * 下段サブクエリの CASE は v_nyushuko_sts の sagyo_sts_id 算出ロジックと、
--     先頭2つの WHEN は v_nyushuko_sts の WHERE(除外条件)を写したもの。
--     除外された行は sagyo_sts_id = NULL となり count 対象外＝LEFT JOIN不成立と同義。
--
-- 注意: 元の WHERE は三値論理で「数量がNULLの行」も除外していたが、この CASE 版は
--       NULLの場合に除外しない。t_nyushuko_den に plan_qty/result_qty/result_adj_qty が
--       NULL の行は実測0件のため現状影響なし（NOT NULL制約は無いので将来は留意）。

CREATE OR REPLACE VIEW public.v_nyushuko_total_time_sts
WITH (security_invoker = on) AS
SELECT
    s.juchu_head_id,
    s.sagyo_kbn_id,
    s.sagyo_den_dat,
    s.sagyo_id,
    count(s.sagyo_sts_id)                                 AS count_all,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 2)   AS count_sts2,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 1)   AS count_sts1,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 0)   AS count_sts0,
    CASE
        WHEN count(s.sagyo_sts_id) = 0 THEN '-1'::integer
        WHEN count(s.sagyo_sts_id) = count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 2)
            THEN s.sagyo_kbn_id + 2
        WHEN count(s.sagyo_sts_id) = count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 0)
            THEN 0
        ELSE s.sagyo_kbn_id + 1
    END                                                   AS sagyo_sts_id,
    s.juchu_kizai_head_kbn
FROM (
    SELECT
        t.juchu_head_id,
        t.sagyo_kbn_id,
        t.sagyo_den_dat,
        t.sagyo_id,
        t_juchu_kizai_head.juchu_kizai_head_kbn,
        CASE
            -- v_nyushuko_sts の WHERE 相当（該当しない行＝結合不成立を NULL で表す）
            WHEN t.sagyo_kbn_id = 30
                 AND t.plan_qty = 0 AND t.result_qty = 0 AND t.result_adj_qty = 0
                THEN NULL::integer
            WHEN (t.sagyo_kbn_id = 10 OR t.sagyo_kbn_id = 20)
                 AND t.plan_qty = 0 AND t.result_qty = 0 AND t.result_adj_qty = 0
                THEN NULL::integer
            -- v_nyushuko_sts の sagyo_sts_id 算出ロジック相当
            WHEN (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0)) = 0
                THEN 0
            WHEN (COALESCE(t.plan_qty, 0)
                  - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) > 0
                THEN t.sagyo_kbn_id + 1
            WHEN (COALESCE(t.plan_qty, 0)
                  - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) < 0
                 AND COALESCE(m_kizai.ctn_flg, 0) = 0
                THEN t.sagyo_kbn_id + 1
            WHEN (COALESCE(t.plan_qty, 0)
                  - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) < 0
                 AND COALESCE(m_kizai.ctn_flg, 0) = 1
                THEN t.sagyo_kbn_id + 2
            WHEN (COALESCE(t.plan_qty, 0)
                  - (COALESCE(t.result_qty, 0) + COALESCE(t.result_adj_qty, 0))) = 0
                THEN t.sagyo_kbn_id + 2
            ELSE 0
        END AS sagyo_sts_id
    FROM t_nyushuko_den t
    LEFT JOIN m_kizai ON m_kizai.kizai_id = t.kizai_id
    LEFT JOIN t_juchu_kizai_head
        ON t.juchu_head_id = t_juchu_kizai_head.juchu_head_id
       AND t.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
    WHERE t.juchu_kizai_meisai_id <> 0
      AND t.kizai_id <> 0
) s
GROUP BY s.juchu_head_id, s.sagyo_den_dat, s.sagyo_kbn_id, s.sagyo_id, s.juchu_kizai_head_kbn
ORDER BY s.sagyo_den_dat, s.sagyo_kbn_id, s.sagyo_id, s.juchu_head_id;
