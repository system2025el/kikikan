-- 適用状況: 開発環境(preview/public) 2026-08-26 / 本番 2026-09-03
-- =====================================================================
-- t_mitu_head.comment を varchar(200) → varchar(100) に戻す（ロールバック用）
--
-- ★桁数の「縮小」は拡大と違って危険:
--   * 100文字を超えるデータが1件でもあると
--     "value too long for type character varying(100)" で失敗する。
--   * さらに縮小はテーブルの書き換え（rewrite）と全行の検査を伴うため、
--     拡大のように一瞬では終わらない。
--
--   そこで、先に DO ブロックで100文字超の行を数え、あれば明示的なエラーメッセージで
--   中断するようにしている。中断した場合は、該当データを100文字以内に直してから
--   再実行するか、そもそも戻さない判断をすること。
--   該当行の確認:
--     SELECT mitu_head_id, length(comment) FROM public.t_mitu_head
--      WHERE length(comment) > 100 ORDER BY 2 DESC;
--
-- 二重実行しても、既に varchar(100) なら同じ型に変えるだけなので害はない。
-- =====================================================================

BEGIN;

DO $$
DECLARE
  over_cnt integer;
  max_len  integer;
BEGIN
  SELECT count(*) FILTER (WHERE length(comment) > 100), COALESCE(max(length(comment)), 0)
    INTO over_cnt, max_len
    FROM public.t_mitu_head;

  IF over_cnt > 0 THEN
    RAISE EXCEPTION
      'comment が100文字を超える行が % 件あります（最大 % 文字）。先にデータを100文字以内に直してから再実行してください。',
      over_cnt, max_len;
  END IF;
END $$;

ALTER TABLE public.t_mitu_head
  ALTER COLUMN comment TYPE character varying(100);

COMMIT;
