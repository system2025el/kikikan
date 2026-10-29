-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_juchu_kizai_dat_qty のロールバック（本番の現在の定義）
-- 2026-10-21 にステージングから pg_get_viewdef で取得（applied/ と同じ定義。本番と同じかは本番に当てる前に確認すること）。
-- 列構成は変わらないので CREATE OR REPLACE で戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_juchu_kizai_dat_qty AS
 SELECT t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    t_juchu_kizai_meisai.kizai_id,
    sum(COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)) AS juchu_qty,
    sum(COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)) AS yobi_qty,
    sum(COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)) + sum(COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)) AS plan_qty,
    sum(
        CASE
            WHEN t_juchu_kizai_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS kics_juchu_qty,
    sum(
        CASE
            WHEN t_juchu_kizai_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)
            ELSE 0
        END) AS kics_yobi_qty,
    sum(
        CASE
            WHEN t_juchu_kizai_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0) + COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)
            ELSE 0
        END) AS kics_plan_qty,
    sum(
        CASE
            WHEN t_juchu_kizai_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS yard_juchu_qty,
    sum(
        CASE
            WHEN t_juchu_kizai_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)
            ELSE 0
        END) AS yard_yobi_qty,
    sum(
        CASE
            WHEN t_juchu_kizai_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0) + COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)
            ELSE 0
        END) AS yard_plan_qty
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_honbanbi_1.juchu_head_id,
            t_juchu_kizai_honbanbi_1.juchu_kizai_head_id,
            t_juchu_kizai_honbanbi_1.juchu_honbanbi_dat
           FROM t_juchu_kizai_honbanbi t_juchu_kizai_honbanbi_1) t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0
  GROUP BY t_juchu_kizai_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat
UNION ALL
 SELECT t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    t_juchu_ctn_meisai.kizai_id,
    sum(COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)) AS juchu_qty,
    0 AS yobi_qty,
    sum(COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)) AS plan_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS kics_juchu_qty,
    0 AS kics_yobi_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 1 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS kics_plan_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS yard_juchu_qty,
    0 AS yard_yobi_qty,
    sum(
        CASE
            WHEN t_juchu_ctn_meisai.shozoku_id = 2 THEN COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)
            ELSE 0
        END) AS yard_plan_qty
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_honbanbi_1.juchu_head_id,
            t_juchu_kizai_honbanbi_1.juchu_kizai_head_id,
            t_juchu_kizai_honbanbi_1.juchu_honbanbi_dat
           FROM t_juchu_kizai_honbanbi t_juchu_kizai_honbanbi_1) t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0 AND t_juchu_ctn_meisai.kizai_id IS NOT NULL
  GROUP BY t_juchu_ctn_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat
  ORDER BY 2, 1;
