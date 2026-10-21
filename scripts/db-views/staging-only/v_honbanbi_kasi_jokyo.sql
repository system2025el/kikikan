-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_honbanbi_kasi_jokyo  事前準備の期間を種別 4 として加える（貸出状況のセルの色。列構成・型は不変）
--
-- 事前準備の行（v_juchu_kizai_dat_qty と同じ条件。使用日がある日は除く）を UNION ALL で足し、
-- juchu_honbanbi_shubetu_id = 4、色は m_honbanbi_color の clolor_id = 4（db-data/staging-only/20261021-m-honbanbi-color-jizen.sql）。
-- 色マスタに 4 が無ければ 'white'（既存の行と同じ扱い）。種別 4 は t_juchu_kizai_honbanbi には入れない（色のためだけの値）。
--
-- リポジトリに定義が無かったビュー。2026-10-21 にステージングの pg_get_viewdef から起こした。
-- 使う所: app/_lib/db/tables/stock-table.ts（貸出状況）
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前準備が無い状態で全列・行数（967,072）とも差分0
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
UNION ALL
 SELECT t_juchu_kizai_jizen.juchu_head_id,
    t_juchu_kizai_jizen.juchu_kizai_head_id,
    t_juchu_kizai_jizen.kizai_id,
    jizen_dat.plan_dat,
    4 AS juchu_honbanbi_shubetu_id,
    COALESCE(( SELECT m_honbanbi_color.color_nam
           FROM m_honbanbi_color
          WHERE m_honbanbi_color.clolor_id = 4), 'white'::character varying) AS juchu_honbanbi_shubetu_color
   FROM t_juchu_kizai_jizen
     JOIN t_juchu_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_head.del_flg = 0
     JOIN t_juchu_kizai_meisai ON t_juchu_kizai_meisai.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_kizai_meisai.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND t_juchu_kizai_meisai.juchu_kizai_meisai_id = t_juchu_kizai_jizen.juchu_kizai_meisai_id AND t_juchu_kizai_meisai.kizai_id = t_juchu_kizai_jizen.kizai_id
     JOIN t_juchu_kizai_nyushuko shuko ON shuko.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND shuko.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND shuko.nyushuko_shubetu_id = 1 AND shuko.nyushuko_basho_id = t_juchu_kizai_meisai.shozoku_id
     CROSS JOIN LATERAL ( SELECT g.g::date AS plan_dat
           FROM generate_series((t_juchu_kizai_jizen.jizen_dat AT TIME ZONE 'Asia/Tokyo'::text)::date::timestamp without time zone, ((shuko.nyushuko_dat AT TIME ZONE 'Asia/Tokyo'::text)::date - 1)::timestamp without time zone, '1 day'::interval) g(g)) jizen_dat
  WHERE NOT (EXISTS ( SELECT 1
           FROM t_juchu_kizai_honbanbi h
          WHERE h.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND h.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND h.juchu_honbanbi_dat = jizen_dat.plan_dat))
  GROUP BY t_juchu_kizai_jizen.juchu_head_id, t_juchu_kizai_jizen.juchu_kizai_head_id, t_juchu_kizai_jizen.kizai_id, jizen_dat.plan_dat
  ORDER BY 1, 3, 4;
