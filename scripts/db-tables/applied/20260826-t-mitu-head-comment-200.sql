-- 適用状況: 開発環境(preview/public) 2026-08-26 / 本番 2026-09-03
-- =====================================================================
-- t_mitu_head.comment（論理名：コメント）を varchar(100) → varchar(200) に拡大
--
-- 変更内容: ALTER TABLE ... ALTER COLUMN comment TYPE character varying(200)
--
-- 安全性の根拠（2026-08-26 時点で確認済み）:
--   * varchar の桁数「拡大」は PostgreSQL 9.2 以降カタログ更新のみで、
--     テーブルの書き換え（rewrite）は発生しない。開発環境での実測15ms。
--   * comment 列を参照しているビューは 0 件。t_mitu_head を参照するビューは
--     v_mitu_lst のみで、そちらは comment を出していない。
--     （列を参照するビューがあると "cannot alter type of a column used by a view"
--       で失敗するため、事前に pg_depend で確認すること）
--   * comment に CHECK 制約なし（t_mitu_head の制約は主キーのみ）。
--   * 既存データの最大長は開発環境100文字・本番98文字。拡大なので切り捨ては起きない。
--   * 開発環境で BEGIN → ALTER → ROLLBACK のリハーサル実施済み。
--
-- 実行中は一瞬 ACCESS EXCLUSIVE ロックを取る（テーブル書き換えが無いので短時間）。
-- 二重実行しても同じ型に変えるだけなので害はない。
--
-- ★この時点ではまだ画面から101文字以上は入力できない:
--   app/(main)/quotation-list/_lib/types.ts の Zod が .max(100) のままのため。
--   200文字を実際に使うには、そちらを .max(200) に変更する必要がある。
--
-- ★PDF出力の制約（未対応）:
--   app/(main)/quotation-list/_lib/hooks/usePdf.ts のコメント欄は
--   formatTextArray(comment, font, 8, 290) で折り返した結果を
--   `if (innerIndex < 5)` で先頭5行だけ描画し、6行目以降は無言で捨てる。
--   全角はサイズ8で1行36文字前後なので、PDFに載るのは概算180文字程度が上限。
--   改行を入力するとさらに少ない文字数で5行に達する。
--   200文字を入力できるようにする場合は、描画行数を増やすかどうかの判断が必要。
--
-- Supabase の自動生成型（app/_lib/db/types/types.ts）は varchar の桁数を持たず
-- comment: string | null のままなので、この変更による再生成は不要。
-- =====================================================================

BEGIN;

ALTER TABLE public.t_mitu_head
  ALTER COLUMN comment TYPE character varying(200);

COMMIT;
