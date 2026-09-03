-- 適用状況: 開発環境(preview/public) 2026-08-17 / 本番 2026-08-19
-- =====================================================================
-- v_nyushuko_total_time_sts 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : ステージング(preview) Supabase プロジェクト jimqcvyaoddsxbcrsnfs / public スキーマ
-- 取得方法: SELECT pg_get_viewdef('public.v_nyushuko_total_time_sts', true)
-- reloptions: ["security_invoker=on"]
--
-- 用途: 高速化版を適用したあとにデータ差異などの問題が出た場合、
--       このファイルをそのまま実行すれば変更前の定義に戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_total_time_sts
WITH (security_invoker = on) AS
SELECT t_nyushuko_den.juchu_head_id,
    t_nyushuko_den.sagyo_kbn_id,
    t_nyushuko_den.sagyo_den_dat,
    t_nyushuko_den.sagyo_id,
    count(count_all.*) AS count_all,
    count(count_sts2.*) AS count_sts2,
    count(count_sts1.*) AS count_sts1,
    count(count_sts0.*) AS count_sts0,
        CASE
            WHEN count(count_all.*) = 0 THEN '-1'::integer
            WHEN count(count_all.*) = count(count_sts2.*) THEN t_nyushuko_den.sagyo_kbn_id + 2
            WHEN count(count_all.*) = count(count_sts0.*) THEN 0
            ELSE t_nyushuko_den.sagyo_kbn_id + 1
        END AS sagyo_sts_id,
    t_juchu_kizai_head.juchu_kizai_head_kbn
   FROM t_nyushuko_den
     LEFT JOIN ( SELECT v_nyushuko_sts.juchu_head_id,
            v_nyushuko_sts.juchu_kizai_head_id,
            v_nyushuko_sts.juchu_kizai_meisai_id,
            v_nyushuko_sts.kizai_id,
            v_nyushuko_sts.sagyo_kbn_id,
            v_nyushuko_sts.sagyo_den_dat,
            v_nyushuko_sts.sagyo_id,
            v_nyushuko_sts.plan_qty,
            v_nyushuko_sts.result_qty,
            v_nyushuko_sts.result_adj_qty,
            v_nyushuko_sts.sagyo_sts_id,
            v_nyushuko_sts.juchu_kizai_head_kbn
           FROM v_nyushuko_sts
          GROUP BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id, v_nyushuko_sts.plan_qty, v_nyushuko_sts.result_qty, v_nyushuko_sts.result_adj_qty, v_nyushuko_sts.sagyo_sts_id, v_nyushuko_sts.juchu_kizai_head_kbn
          ORDER BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id) count_all ON count_all.juchu_head_id = t_nyushuko_den.juchu_head_id AND count_all.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND count_all.juchu_kizai_meisai_id = t_nyushuko_den.juchu_kizai_meisai_id AND count_all.kizai_id = t_nyushuko_den.kizai_id AND count_all.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND count_all.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND count_all.sagyo_id = t_nyushuko_den.sagyo_id
     LEFT JOIN ( SELECT v_nyushuko_sts.juchu_head_id,
            v_nyushuko_sts.juchu_kizai_head_id,
            v_nyushuko_sts.juchu_kizai_meisai_id,
            v_nyushuko_sts.kizai_id,
            v_nyushuko_sts.sagyo_kbn_id,
            v_nyushuko_sts.sagyo_den_dat,
            v_nyushuko_sts.sagyo_id,
            v_nyushuko_sts.plan_qty,
            v_nyushuko_sts.result_qty,
            v_nyushuko_sts.result_adj_qty,
            v_nyushuko_sts.sagyo_sts_id,
            v_nyushuko_sts.juchu_kizai_head_kbn
           FROM v_nyushuko_sts
          WHERE mod(v_nyushuko_sts.sagyo_sts_id, 10) = 2
          GROUP BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id, v_nyushuko_sts.plan_qty, v_nyushuko_sts.result_qty, v_nyushuko_sts.result_adj_qty, v_nyushuko_sts.sagyo_sts_id, v_nyushuko_sts.juchu_kizai_head_kbn
          ORDER BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id) count_sts2 ON count_sts2.juchu_head_id = t_nyushuko_den.juchu_head_id AND count_sts2.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND count_sts2.juchu_kizai_meisai_id = t_nyushuko_den.juchu_kizai_meisai_id AND count_sts2.kizai_id = t_nyushuko_den.kizai_id AND count_sts2.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND count_sts2.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND count_sts2.sagyo_id = t_nyushuko_den.sagyo_id
     LEFT JOIN ( SELECT v_nyushuko_sts.juchu_head_id,
            v_nyushuko_sts.juchu_kizai_head_id,
            v_nyushuko_sts.juchu_kizai_meisai_id,
            v_nyushuko_sts.kizai_id,
            v_nyushuko_sts.sagyo_kbn_id,
            v_nyushuko_sts.sagyo_den_dat,
            v_nyushuko_sts.sagyo_id,
            v_nyushuko_sts.plan_qty,
            v_nyushuko_sts.result_qty,
            v_nyushuko_sts.result_adj_qty,
            v_nyushuko_sts.sagyo_sts_id,
            v_nyushuko_sts.juchu_kizai_head_kbn
           FROM v_nyushuko_sts
          WHERE mod(v_nyushuko_sts.sagyo_sts_id, 10) = 1
          GROUP BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id, v_nyushuko_sts.plan_qty, v_nyushuko_sts.result_qty, v_nyushuko_sts.result_adj_qty, v_nyushuko_sts.sagyo_sts_id, v_nyushuko_sts.juchu_kizai_head_kbn
          ORDER BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id) count_sts1 ON count_sts1.juchu_head_id = t_nyushuko_den.juchu_head_id AND count_sts1.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND count_sts1.juchu_kizai_meisai_id = t_nyushuko_den.juchu_kizai_meisai_id AND count_sts1.kizai_id = t_nyushuko_den.kizai_id AND count_sts1.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND count_sts1.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND count_sts1.sagyo_id = t_nyushuko_den.sagyo_id
     LEFT JOIN ( SELECT v_nyushuko_sts.juchu_head_id,
            v_nyushuko_sts.juchu_kizai_head_id,
            v_nyushuko_sts.juchu_kizai_meisai_id,
            v_nyushuko_sts.kizai_id,
            v_nyushuko_sts.sagyo_kbn_id,
            v_nyushuko_sts.sagyo_den_dat,
            v_nyushuko_sts.sagyo_id,
            v_nyushuko_sts.plan_qty,
            v_nyushuko_sts.result_qty,
            v_nyushuko_sts.result_adj_qty,
            v_nyushuko_sts.sagyo_sts_id,
            v_nyushuko_sts.juchu_kizai_head_kbn
           FROM v_nyushuko_sts
          WHERE mod(v_nyushuko_sts.sagyo_sts_id, 10) = 0
          GROUP BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id, v_nyushuko_sts.plan_qty, v_nyushuko_sts.result_qty, v_nyushuko_sts.result_adj_qty, v_nyushuko_sts.sagyo_sts_id, v_nyushuko_sts.juchu_kizai_head_kbn
          ORDER BY v_nyushuko_sts.juchu_head_id, v_nyushuko_sts.juchu_kizai_head_id, v_nyushuko_sts.juchu_kizai_meisai_id, v_nyushuko_sts.kizai_id, v_nyushuko_sts.sagyo_kbn_id, v_nyushuko_sts.sagyo_den_dat, v_nyushuko_sts.sagyo_id) count_sts0 ON count_sts0.juchu_head_id = t_nyushuko_den.juchu_head_id AND count_sts0.juchu_kizai_head_id = t_nyushuko_den.juchu_kizai_head_id AND count_sts0.juchu_kizai_meisai_id = t_nyushuko_den.juchu_kizai_meisai_id AND count_sts0.kizai_id = t_nyushuko_den.kizai_id AND count_sts0.sagyo_kbn_id = t_nyushuko_den.sagyo_kbn_id AND count_sts0.sagyo_den_dat = t_nyushuko_den.sagyo_den_dat AND count_sts0.sagyo_id = t_nyushuko_den.sagyo_id
     LEFT JOIN t_juchu_kizai_head ON t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_nyushuko_den.juchu_kizai_meisai_id <> 0 AND t_nyushuko_den.kizai_id <> 0
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_kbn_id, t_nyushuko_den.sagyo_id, t_juchu_kizai_head.juchu_kizai_head_kbn
  ORDER BY t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_kbn_id, t_nyushuko_den.sagyo_id, t_nyushuko_den.juchu_head_id;
