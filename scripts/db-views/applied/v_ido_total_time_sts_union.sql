-- 適用状況: ステージング 2026-08-19 / 本番 2026-08-19
-- v_ido_total_time_sts_union 高速化版
--
-- 変更内容: v_ido_sts_union を4回自己JOINしていた構造（count_all / count_sts2 /
--           count_sts1 / count_sts0）を、1回のJOIN + count(*) FILTER に統合した。
--
-- 等価性の根拠:
--   * 4つの派生サブクエリはすべて同じ v_ido_sts_union を参照し、同一の5列キー
--     (ido_den_id, kizai_id, sagyo_kbn_id, nyushuko_dat, nyushuko_basho_id)
--     で v_ido_den2_union_lst に結合していた。
--   * v_ido_sts_union はその5列そのものを GROUP BY しているため5列キーは一意であり、
--     結合は 1:0..1 になる。よって「対応行が在るか／その sagyo_sts_id が何か」を
--     1回求めれば、4種類の件数は FILTER で再現できる。
--   * count(s.sagyo_sts_id) は「結合が成立した行数」＝ 旧 count(count_all.*) と同値
--     （v_ido_sts_union.sagyo_sts_id は CASE 式で常に非NULL）。
--   * mod(NULL,10) は NULL となり FILTER 条件が偽になるため、結合不成立の行が
--     count_sts2/1/0 に数えられることはない（旧 LEFT JOIN 不成立と同じ挙動）。
--
-- 注意: v_ido_den2_union_lst の ido_den_id は受注側の枝で NULL になるため、
--       その行は結合が成立せず count_all = 0 → sagyo_sts_id = 0 となる。
--       これは変更前の定義（同じ結合条件）と同じ挙動である。

CREATE OR REPLACE VIEW public.v_ido_total_time_sts_union
WITH (security_invoker = on) AS
SELECT
    u.ido_den_id,
    u.sagyo_kbn_id,
    u.nyushuko_dat,
    u.nyushuko_basho_id,
    count(s.sagyo_sts_id)                                 AS count_all,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 2)   AS count_sts2,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 1)   AS count_sts1,
    count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 0)   AS count_sts0,
    CASE
        WHEN count(s.sagyo_sts_id) = 0 THEN 0
        WHEN count(s.sagyo_sts_id) = count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 2)
            THEN u.sagyo_kbn_id + 2
        WHEN count(s.sagyo_sts_id) = count(*) FILTER (WHERE mod(s.sagyo_sts_id, 10) = 0)
            THEN 0
        ELSE u.sagyo_kbn_id + 1
    END                                                   AS sagyo_sts_id
FROM v_ido_den2_union_lst u
LEFT JOIN v_ido_sts_union s
    ON s.ido_den_id = u.ido_den_id
   AND s.kizai_id = u.kizai_id
   AND s.sagyo_kbn_id = u.sagyo_kbn_id
   AND s.nyushuko_dat = u.nyushuko_dat
   AND s.nyushuko_basho_id = u.nyushuko_basho_id
GROUP BY u.ido_den_id, u.sagyo_kbn_id, u.nyushuko_dat, u.nyushuko_basho_id
ORDER BY u.nyushuko_dat, u.sagyo_kbn_id, u.nyushuko_basho_id, u.ido_den_id;
