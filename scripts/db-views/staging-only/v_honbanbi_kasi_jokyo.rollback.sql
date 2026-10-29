-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_honbanbi_kasi_jokyo のロールバック（本番の現在の定義）
-- 2026-10-21 にステージングから pg_get_viewdef で取得（本番と同じかは本番に当てる前に確認すること）。
-- 列構成は変わらないので CREATE OR REPLACE で戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_honbanbi_kasi_jokyo WITH (security_invoker = on) AS
 SELECT t_juchu_head.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_id,
    t_juchu_kizai_meisai.kizai_id,
    t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    max(t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id) AS juchu_honbanbi_shubetu_id,
    COALESCE(( SELECT m_honbanbi_color.color_nam
           FROM m_honbanbi_color
          WHERE m_honbanbi_color.clolor_id = max(t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id)), 'white'::character varying) AS juchu_honbanbi_shubetu_color
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id
     LEFT JOIN t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0
  GROUP BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_kizai_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat
UNION ALL
 SELECT t_juchu_head.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_id,
    t_juchu_ctn_meisai.kizai_id,
    t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    max(t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id) AS juchu_honbanbi_shubetu_id,
    COALESCE(( SELECT m_honbanbi_color.color_nam
           FROM m_honbanbi_color
          WHERE m_honbanbi_color.clolor_id = max(t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id)), 'white'::character varying) AS juchu_honbanbi_shubetu_color
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id
     LEFT JOIN t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0 AND t_juchu_ctn_meisai.kizai_id IS NOT NULL
  GROUP BY t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_ctn_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat
  ORDER BY 1, 3, 4;
