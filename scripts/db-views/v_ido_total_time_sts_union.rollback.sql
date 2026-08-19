-- =====================================================================
-- v_ido_total_time_sts_union 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : ステージング(preview) Supabase プロジェクト jimqcvyaoddsxbcrsnfs / public スキーマ
-- 取得方法: SELECT pg_get_viewdef('public.v_ido_total_time_sts_union', true)
-- reloptions: ["security_invoker=on"]
--
-- 用途: 高速化版を適用したあとにデータ差異などの問題が出た場合、
--       このファイルをそのまま実行すれば変更前の定義に戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_ido_total_time_sts_union
WITH (security_invoker = on) AS
SELECT v_ido_den2_union_lst.ido_den_id,
    v_ido_den2_union_lst.sagyo_kbn_id,
    v_ido_den2_union_lst.nyushuko_dat,
    v_ido_den2_union_lst.nyushuko_basho_id,
    count(count_all.*) AS count_all,
    count(count_sts2.*) AS count_sts2,
    count(count_sts1.*) AS count_sts1,
    count(count_sts0.*) AS count_sts0,
        CASE
            WHEN count(count_all.*) = 0 THEN 0
            WHEN count(count_all.*) = count(count_sts2.*) THEN v_ido_den2_union_lst.sagyo_kbn_id + 2
            WHEN count(count_all.*) = count(count_sts0.*) THEN 0
            ELSE v_ido_den2_union_lst.sagyo_kbn_id + 1
        END AS sagyo_sts_id
   FROM v_ido_den2_union_lst
     LEFT JOIN ( SELECT v_ido_sts_union.ido_den_id,
            v_ido_sts_union.kizai_id,
            v_ido_sts_union.sagyo_kbn_id,
            v_ido_sts_union.nyushuko_dat,
            v_ido_sts_union.nyushuko_basho_id,
            v_ido_sts_union.plan_qty,
            v_ido_sts_union.result_qty,
            v_ido_sts_union.result_adj_qty,
            v_ido_sts_union.sagyo_sts_id
           FROM v_ido_sts_union
          GROUP BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id, v_ido_sts_union.plan_qty, v_ido_sts_union.result_qty, v_ido_sts_union.result_adj_qty, v_ido_sts_union.sagyo_sts_id
          ORDER BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id) count_all ON count_all.ido_den_id = v_ido_den2_union_lst.ido_den_id AND count_all.kizai_id = v_ido_den2_union_lst.kizai_id AND count_all.sagyo_kbn_id = v_ido_den2_union_lst.sagyo_kbn_id AND count_all.nyushuko_dat = v_ido_den2_union_lst.nyushuko_dat AND count_all.nyushuko_basho_id = v_ido_den2_union_lst.nyushuko_basho_id
     LEFT JOIN ( SELECT v_ido_sts_union.ido_den_id,
            v_ido_sts_union.kizai_id,
            v_ido_sts_union.sagyo_kbn_id,
            v_ido_sts_union.nyushuko_dat,
            v_ido_sts_union.nyushuko_basho_id,
            v_ido_sts_union.plan_qty,
            v_ido_sts_union.result_qty,
            v_ido_sts_union.result_adj_qty,
            v_ido_sts_union.sagyo_sts_id
           FROM v_ido_sts_union
          WHERE mod(v_ido_sts_union.sagyo_sts_id, 10) = 2
          GROUP BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id, v_ido_sts_union.plan_qty, v_ido_sts_union.result_qty, v_ido_sts_union.result_adj_qty, v_ido_sts_union.sagyo_sts_id
          ORDER BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id) count_sts2 ON count_sts2.ido_den_id = v_ido_den2_union_lst.ido_den_id AND count_sts2.kizai_id = v_ido_den2_union_lst.kizai_id AND count_sts2.sagyo_kbn_id = v_ido_den2_union_lst.sagyo_kbn_id AND count_sts2.nyushuko_dat = v_ido_den2_union_lst.nyushuko_dat AND count_sts2.nyushuko_basho_id = v_ido_den2_union_lst.nyushuko_basho_id
     LEFT JOIN ( SELECT v_ido_sts_union.ido_den_id,
            v_ido_sts_union.kizai_id,
            v_ido_sts_union.sagyo_kbn_id,
            v_ido_sts_union.nyushuko_dat,
            v_ido_sts_union.nyushuko_basho_id,
            v_ido_sts_union.plan_qty,
            v_ido_sts_union.result_qty,
            v_ido_sts_union.result_adj_qty,
            v_ido_sts_union.sagyo_sts_id
           FROM v_ido_sts_union
          WHERE mod(v_ido_sts_union.sagyo_sts_id, 10) = 1
          GROUP BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id, v_ido_sts_union.plan_qty, v_ido_sts_union.result_qty, v_ido_sts_union.result_adj_qty, v_ido_sts_union.sagyo_sts_id
          ORDER BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id) count_sts1 ON count_sts1.ido_den_id = v_ido_den2_union_lst.ido_den_id AND count_sts1.kizai_id = v_ido_den2_union_lst.kizai_id AND count_sts1.sagyo_kbn_id = v_ido_den2_union_lst.sagyo_kbn_id AND count_sts1.nyushuko_dat = v_ido_den2_union_lst.nyushuko_dat AND count_sts1.nyushuko_basho_id = v_ido_den2_union_lst.nyushuko_basho_id
     LEFT JOIN ( SELECT v_ido_sts_union.ido_den_id,
            v_ido_sts_union.kizai_id,
            v_ido_sts_union.sagyo_kbn_id,
            v_ido_sts_union.nyushuko_dat,
            v_ido_sts_union.nyushuko_basho_id,
            v_ido_sts_union.plan_qty,
            v_ido_sts_union.result_qty,
            v_ido_sts_union.result_adj_qty,
            v_ido_sts_union.sagyo_sts_id
           FROM v_ido_sts_union
          WHERE mod(v_ido_sts_union.sagyo_sts_id, 10) = 0
          GROUP BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id, v_ido_sts_union.plan_qty, v_ido_sts_union.result_qty, v_ido_sts_union.result_adj_qty, v_ido_sts_union.sagyo_sts_id
          ORDER BY v_ido_sts_union.ido_den_id, v_ido_sts_union.kizai_id, v_ido_sts_union.sagyo_kbn_id, v_ido_sts_union.nyushuko_dat, v_ido_sts_union.nyushuko_basho_id) count_sts0 ON count_sts0.ido_den_id = v_ido_den2_union_lst.ido_den_id AND count_sts0.kizai_id = v_ido_den2_union_lst.kizai_id AND count_sts0.sagyo_kbn_id = v_ido_den2_union_lst.sagyo_kbn_id AND count_sts0.nyushuko_dat = v_ido_den2_union_lst.nyushuko_dat AND count_sts0.nyushuko_basho_id = v_ido_den2_union_lst.nyushuko_basho_id
  GROUP BY v_ido_den2_union_lst.ido_den_id, v_ido_den2_union_lst.sagyo_kbn_id, v_ido_den2_union_lst.nyushuko_dat, v_ido_den2_union_lst.nyushuko_basho_id
  ORDER BY v_ido_den2_union_lst.nyushuko_dat, v_ido_den2_union_lst.sagyo_kbn_id, v_ido_den2_union_lst.nyushuko_basho_id, v_ido_den2_union_lst.ido_den_id;
