-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- =====================================================================
-- v_juchu_kizai_dat_qty_kasi  事前準備の引き当てを加える（列構成・型は不変）
--
-- 貸出状況の受注別の在庫（v_zaiko_qty_kasi 経由）。v_juchu_kizai_dat_qty と同じ条件の事前準備の行を UNION ALL で足す
-- （受注・機材ヘッダー・機材・日付で集計）。使用日がある日は除くので、同じキーの行が既存の部分と重なることは無い。
-- 全体の在庫（v_juchu_kizai_dat_qty）と受注別の内訳を合わせるために必要。
--
-- リポジトリに定義が無かったビュー。2026-10-21 にステージングの pg_get_viewdef から起こした。
-- 依存しているビュー: v_zaiko_qty_kasi（列構成を変えないので作り直し不要）
-- reloptions: security_invoker = on
-- 2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前準備が無い状態で全列・行数（967,072）とも差分0
-- =====================================================================

CREATE OR REPLACE VIEW public.v_juchu_kizai_dat_qty_kasi WITH (security_invoker = on) AS
 SELECT t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    t_juchu_kizai_meisai.kizai_id,
    sum(COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)) AS juchu_qty,
    sum(COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)) AS yobi_qty,
    sum(COALESCE(t_juchu_kizai_meisai.plan_kizai_qty, 0)) + sum(COALESCE(t_juchu_kizai_meisai.plan_yobi_qty, 0)) AS plan_qty,
    t_juchu_head.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_id,
    t_juchu_kizai_head.oya_juchu_kizai_head_id
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_kizai_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_meisai.juchu_kizai_head_id
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_honbanbi_1.juchu_head_id,
            t_juchu_kizai_honbanbi_1.juchu_kizai_head_id,
            t_juchu_kizai_honbanbi_1.juchu_honbanbi_dat
           FROM t_juchu_kizai_honbanbi t_juchu_kizai_honbanbi_1) t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0
  GROUP BY t_juchu_kizai_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat, t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_kizai_head.oya_juchu_kizai_head_id
UNION ALL
 SELECT t_juchu_kizai_honbanbi.juchu_honbanbi_dat AS plan_dat,
    t_juchu_ctn_meisai.kizai_id,
    sum(COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)) AS juchu_qty,
    0 AS yobi_qty,
    sum(COALESCE(t_juchu_ctn_meisai.plan_kizai_qty, 0)) AS plan_qty,
    t_juchu_head.juchu_head_id,
    t_juchu_kizai_head.juchu_kizai_head_id,
    t_juchu_kizai_head.oya_juchu_kizai_head_id
   FROM t_juchu_head
     LEFT JOIN t_juchu_kizai_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_head.juchu_head_id
     LEFT JOIN t_juchu_ctn_meisai ON t_juchu_kizai_head.juchu_head_id = t_juchu_ctn_meisai.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_ctn_meisai.juchu_kizai_head_id
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_honbanbi_1.juchu_head_id,
            t_juchu_kizai_honbanbi_1.juchu_kizai_head_id,
            t_juchu_kizai_honbanbi_1.juchu_honbanbi_dat
           FROM t_juchu_kizai_honbanbi t_juchu_kizai_honbanbi_1) t_juchu_kizai_honbanbi ON t_juchu_kizai_honbanbi.juchu_head_id = t_juchu_kizai_head.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = t_juchu_kizai_head.juchu_kizai_head_id
  WHERE t_juchu_head.del_flg = 0 AND t_juchu_ctn_meisai.kizai_id IS NOT NULL
  GROUP BY t_juchu_ctn_meisai.kizai_id, t_juchu_kizai_honbanbi.juchu_honbanbi_dat, t_juchu_head.juchu_head_id, t_juchu_kizai_head.juchu_kizai_head_id, t_juchu_kizai_head.oya_juchu_kizai_head_id
UNION ALL
 SELECT jizen_dat.plan_dat,
    t_juchu_kizai_jizen.kizai_id,
    sum(t_juchu_kizai_jizen.jizen_qty) AS juchu_qty,
    0 AS yobi_qty,
    sum(t_juchu_kizai_jizen.jizen_qty) AS plan_qty,
    t_juchu_kizai_jizen.juchu_head_id,
    t_juchu_kizai_jizen.juchu_kizai_head_id,
    t_juchu_kizai_head.oya_juchu_kizai_head_id
   FROM t_juchu_kizai_jizen
     JOIN t_juchu_head ON t_juchu_head.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_head.del_flg = 0
     JOIN t_juchu_kizai_head ON t_juchu_kizai_head.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_kizai_head.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id
     JOIN t_juchu_kizai_meisai ON t_juchu_kizai_meisai.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND t_juchu_kizai_meisai.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND t_juchu_kizai_meisai.juchu_kizai_meisai_id = t_juchu_kizai_jizen.juchu_kizai_meisai_id AND t_juchu_kizai_meisai.kizai_id = t_juchu_kizai_jizen.kizai_id
     JOIN t_juchu_kizai_nyushuko shuko ON shuko.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND shuko.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND shuko.nyushuko_shubetu_id = 1 AND shuko.nyushuko_basho_id = t_juchu_kizai_meisai.shozoku_id
     CROSS JOIN LATERAL ( SELECT g.g::date AS plan_dat
           FROM generate_series((t_juchu_kizai_jizen.jizen_dat AT TIME ZONE 'Asia/Tokyo'::text)::date::timestamp without time zone, ((shuko.nyushuko_dat AT TIME ZONE 'Asia/Tokyo'::text)::date - 1)::timestamp without time zone, '1 day'::interval) g(g)) jizen_dat
  WHERE NOT (EXISTS ( SELECT 1
           FROM t_juchu_kizai_honbanbi h
          WHERE h.juchu_head_id = t_juchu_kizai_jizen.juchu_head_id AND h.juchu_kizai_head_id = t_juchu_kizai_jizen.juchu_kizai_head_id AND h.juchu_honbanbi_dat = jizen_dat.plan_dat))
  GROUP BY t_juchu_kizai_jizen.kizai_id, jizen_dat.plan_dat, t_juchu_kizai_jizen.juchu_head_id, t_juchu_kizai_jizen.juchu_kizai_head_id, t_juchu_kizai_head.oya_juchu_kizai_head_id
  ORDER BY 2, 1;
