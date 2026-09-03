-- 適用状況: ステージング 2026-09-03 / 本番 未適用
-- =====================================================================
-- v_honbanbi_calc ロールバック（変更前の定義）
--
-- 取得元: ステージング jimqcvyaoddsxbcrsnfs / public スキーマ
--
-- このビューはこれまで db-views の管理下に無く、変更履歴もないため、
-- ステージングと本番の定義は同一である想定。
-- 本番へ適用する前に pg_get_viewdef で本番の定義がこれと一致することを確認すること。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_honbanbi_calc
WITH (security_invoker = on) AS
 SELECT t_juchu_kizai_honbanbi.juchu_head_id,
    t_juchu_kizai_honbanbi.juchu_kizai_head_id,
    honbanbi_qty.honbanbi_dat_qty AS juchu_honbanbi_qty,
    sum(COALESCE(t_juchu_kizai_honbanbi.juchu_honbanbi_add_qty, 0::numeric)) AS juchu_honbanbi_add_qty,
    honbanbi_qty.honbanbi_dat_qty::numeric + sum(COALESCE(t_juchu_kizai_honbanbi.juchu_honbanbi_add_qty, 0::numeric)) AS juchu_honbanbi_calc_qty
   FROM t_juchu_kizai_honbanbi
     LEFT JOIN ( SELECT qty_40.juchu_head_id,
            qty_40.juchu_kizai_head_id,
            count(qty_40.juchu_honbanbi_dat) AS honbanbi_dat_qty
           FROM t_juchu_kizai_honbanbi qty_40
          WHERE qty_40.juchu_honbanbi_shubetu_id = 40
          GROUP BY qty_40.juchu_head_id, qty_40.juchu_kizai_head_id) honbanbi_qty ON t_juchu_kizai_honbanbi.juchu_head_id = honbanbi_qty.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = honbanbi_qty.juchu_kizai_head_id
  WHERE t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id = ANY (ARRAY[10, 20, 30, 40])
  GROUP BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id, honbanbi_qty.honbanbi_dat_qty
  ORDER BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id;
