-- 適用状況: ステージング 2026-10-19 / 本番 未適用
-- =====================================================================
-- v_get_juchu_kizai_head のロールバック（本番の現在の定義）
-- 2026-10-19 にステージングから pg_get_viewdef で取得（本番と同じかは本番に当てる前に確認すること）。
-- GROUP BY が作業区分（sagyo_kbn_id）単位。列構成は変わらないので CREATE OR REPLACE で戻せる。
-- reloptions: security_invoker = on（ステージングで確認）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_get_juchu_kizai_head WITH (security_invoker = on) AS
 SELECT DISTINCT t_nyushuko_den.juchu_head_id,
    t_nyushuko_den.sagyo_den_dat,
    t_nyushuko_den.sagyo_id,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
    array_to_string(array_agg(DISTINCT t_nyushuko_den.juchu_kizai_head_id ORDER BY t_nyushuko_den.juchu_kizai_head_id), ','::text) AS juchu_kizai_head_idv,
    array_to_string(array_agg(DISTINCT my_juchu_kizai_head.head_nam), '，'::text) AS head_namv,
    array_to_string(array_agg(DISTINCT my_juchu_kizai_head.juchu_kizai_head_kbn), ','::text) AS juchu_kizai_head_kbnv,
    my_juchu_kizai_head.juchu_kizai_head_kbn,
    array_to_string(array_agg(DISTINCT my_juchu_kizai_head.mem), '，'::text) AS memv
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_head.juchu_head_id,
            t_juchu_kizai_head.juchu_kizai_head_id,
            t_juchu_kizai_head.juchu_kizai_head_kbn,
            t_juchu_kizai_head.juchu_honbanbi_qty,
            t_juchu_kizai_head.nebiki_amt,
            t_juchu_kizai_head.mem,
            t_juchu_kizai_head.head_nam,
            t_juchu_kizai_head.dsp_ord_num,
            t_juchu_kizai_head.oya_juchu_kizai_head_id,
            t_juchu_kizai_head.ht_kbn,
            t_juchu_kizai_head.add_dat,
            t_juchu_kizai_head.add_user,
            t_juchu_kizai_head.upd_dat,
            t_juchu_kizai_head.upd_user,
            t_juchu_kizai_head.nebiki_rat
           FROM t_juchu_kizai_head
          ORDER BY t_juchu_kizai_head.juchu_head_id, t_juchu_kizai_head.dsp_ord_num) my_juchu_kizai_head ON t_juchu_head.juchu_head_id = my_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = my_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = my_juchu_kizai_head.juchu_kizai_head_id
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, t_nyushuko_den.sagyo_kbn_id, my_juchu_kizai_head.juchu_kizai_head_kbn
  ORDER BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END);
