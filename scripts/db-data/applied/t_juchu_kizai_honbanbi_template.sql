-- 適用状況: 開発環境(preview/public) 2026-08-31 / 本番 2026-09-03
-- =====================================================================
-- 本番日（仕込・RH・GP・本番）の受注ヘッダー単位テンプレート作成
--
-- 本番日の入力を明細画面から伝票画面へ移すのに伴い、既存の受注機材ヘッダー単位の
-- 本番日から、受注ヘッダー単位のテンプレートを juchu_kizai_head_id = 0 で作る。
--
-- 方針:
--   * テンプレート = 受注配下の全ヘッダーの (種別, 日付) の和集合
--   * メモ         = 空でない方を採用（juchu_kizai_head_id の小さい方を優先）
--                    ※両方が非空で内容が異なるケースは 0 件であることを確認済み
--   * 追加日数     = 最大値（ヘッダー間で食い違うケースは 0 件であることを確認済み）
--
-- 既存の受注機材ヘッダー単位の行はそのまま残す（この時点では展開し直さない）。
-- 差分は次にその受注を伝票画面で保存したときに解消される。
--
-- 実行前に t_juchu_kizai_honbanbi のバックアップを取ること。
-- =====================================================================

INSERT INTO public.t_juchu_kizai_honbanbi (
  juchu_head_id,
  juchu_kizai_head_id,
  juchu_honbanbi_shubetu_id,
  juchu_honbanbi_dat,
  mem,
  juchu_honbanbi_add_qty,
  add_dat,
  add_user,
  upd_dat,
  upd_user
)
SELECT
  b.juchu_head_id,
  0 AS juchu_kizai_head_id,
  b.juchu_honbanbi_shubetu_id,
  b.juchu_honbanbi_dat,
  (array_agg(b.mem ORDER BY b.juchu_kizai_head_id) FILTER (WHERE NULLIF(b.mem, '') IS NOT NULL))[1] AS mem,
  max(COALESCE(b.juchu_honbanbi_add_qty, 0)) AS juchu_honbanbi_add_qty,
  now() AS add_dat,
  'migration' AS add_user,
  now() AS upd_dat,
  'migration' AS upd_user
FROM
  public.t_juchu_kizai_honbanbi b
WHERE
  b.juchu_honbanbi_shubetu_id IN (10, 20, 30, 40)
  AND b.juchu_kizai_head_id <> 0
GROUP BY
  b.juchu_head_id,
  b.juchu_honbanbi_shubetu_id,
  b.juchu_honbanbi_dat;
