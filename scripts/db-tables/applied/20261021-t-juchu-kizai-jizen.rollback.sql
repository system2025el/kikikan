-- ============================================================
-- 20261021-t-juchu-kizai-jizen.rollback.sql
-- 20261021-t-juchu-kizai-jizen.sql を取り消す
--
-- ★破壊的。入力済みの事前準備（準備日時・準備数）はすべて失われる。
-- ★先に db-views（在庫・出庫系ビュー）と db-functions（事前準備用の送信RPC）を戻すこと。
--   このテーブルを参照するビュー・関数が残っていると DROP できない。
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

DROP TABLE IF EXISTS public.t_juchu_kizai_jizen;

COMMIT;
