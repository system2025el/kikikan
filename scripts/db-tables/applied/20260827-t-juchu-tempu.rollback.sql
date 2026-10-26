-- ============================================================
-- 20260827-t-juchu-tempu.rollback.sql
-- 20260827-t-juchu-tempu.sql を取り消す
--
-- ★破壊的。アップロード済みの添付PDFはすべて失われる。
--   実体（storage.objects）を消してからバケットを消す必要がある
--   （オブジェクトが残っているとバケットは削除できない）。
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

-- 1) テーブル
DROP TABLE IF EXISTS public.t_juchu_tempu;

-- 2) Storage のオブジェクト実体 → バケットの順で削除
DELETE FROM storage.objects WHERE bucket_id = 'juchu-tempu';
DELETE FROM storage.buckets WHERE id = 'juchu-tempu';

COMMIT;

-- 確認（どちらも0件になること）
SELECT count(*) AS tbl FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 't_juchu_tempu';

SELECT count(*) AS bucket FROM storage.buckets WHERE id = 'juchu-tempu';
