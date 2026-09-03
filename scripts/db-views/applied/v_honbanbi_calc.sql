-- 適用状況: 開発環境(preview/public) 2026-09-03 / 本番 2026-09-03
-- =====================================================================
-- v_honbanbi_calc から本番日テンプレートの行を除外する
--
-- 変更内容:
--   juchu_kizai_head_id <> 0 の条件を2箇所（外側のWHEREと種別40の集計サブクエリ）に追加。
--
-- 背景:
--   本番日（種別10/20/30/40）の入力を受注ヘッダー単位に変更したのに伴い、
--   t_juchu_kizai_honbanbi に juchu_kizai_head_id = 0 の「テンプレート」行を持たせている。
--   このビューは t_juchu_kizai_head と結合せず honbanbi テーブルだけを
--   (juchu_head_id, juchu_kizai_head_id) で GROUP BY しているため、
--   テンプレート行が juchu_kizai_head_id = 0 の行として出てしまう。
--
--   現時点でこのビューを参照している5本（v_juchu_kizai_head_lst、見積4本）は
--   いずれも実在の受注機材ヘッダーと結合しており、juchu_kizai_head_id = 0 の
--   ヘッダーは存在しないため実害は出ていない。ただしこのビューを直接
--   SELECT するコードを書くと、そのまま誤った行を拾う。
--
--   テンプレート行の読み書きは app/_lib/db/tables/t-juchu-honbanbi.ts に閉じており、
--   このビューはテンプレートを扱わないため、ここで除外するのが正しい。
--
-- 影響:
--   juchu_kizai_head_id = 0 の行が消えるだけで、既存の行の値は変わらない。
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
          WHERE qty_40.juchu_honbanbi_shubetu_id = 40 AND qty_40.juchu_kizai_head_id <> 0
          GROUP BY qty_40.juchu_head_id, qty_40.juchu_kizai_head_id) honbanbi_qty ON t_juchu_kizai_honbanbi.juchu_head_id = honbanbi_qty.juchu_head_id AND t_juchu_kizai_honbanbi.juchu_kizai_head_id = honbanbi_qty.juchu_kizai_head_id
  WHERE t_juchu_kizai_honbanbi.juchu_honbanbi_shubetu_id = ANY (ARRAY[10, 20, 30, 40]) AND t_juchu_kizai_honbanbi.juchu_kizai_head_id <> 0
  GROUP BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id, honbanbi_qty.honbanbi_dat_qty
  ORDER BY t_juchu_kizai_honbanbi.juchu_head_id, t_juchu_kizai_honbanbi.juchu_kizai_head_id;
