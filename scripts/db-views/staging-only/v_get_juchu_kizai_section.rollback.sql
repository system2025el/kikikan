-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_get_juchu_kizai_section のロールバック（本番の現在の定義）
-- 2026-10-21 にステージングから pg_get_viewdef で取得（本番と同じかは本番に当てる前に確認すること）。
-- 列構成は変わらないので CREATE OR REPLACE で戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_get_juchu_kizai_section WITH (security_invoker = on) AS
 SELECT DISTINCT t_nyushuko_den.juchu_head_id,
    t_nyushuko_den.sagyo_den_dat,
    t_nyushuko_den.sagyo_id,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
    array_to_string(array_agg(DISTINCT
        CASE
            WHEN m_section.section_nam_short IS NOT NULL THEN m_section.section_nam_short::text
            ELSE m_kizai.section_num::text
        END), ' '::text) AS section_namv,
    t_juchu_kizai_head.juchu_kizai_head_kbn
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
     LEFT JOIN m_kizai ON m_kizai.kizai_id = t_nyushuko_den.kizai_id
     LEFT JOIN m_section ON m_section.section_id = COALESCE(m_kizai.section_num, 0) AND m_section.del_flg = 0
  WHERE t_nyushuko_den.juchu_kizai_meisai_id <> 0 AND t_nyushuko_den.kizai_id <> 0
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, t_nyushuko_den.sagyo_kbn_id, t_juchu_kizai_head.juchu_kizai_head_kbn
  ORDER BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            ELSE NULL::integer
        END);
