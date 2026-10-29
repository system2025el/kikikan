-- ============================================================
-- 20261021-m-honbanbi-color-jizen.rollback.sql
-- 20261021-m-honbanbi-color-jizen.sql を取り消す（事前準備の色を削除）
--
-- 消しても画面がエラーになることは無い（事前準備の期間が白になるだけ）。
-- 期待件数: DELETE 1
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

DELETE FROM public.m_honbanbi_color WHERE clolor_id = 4;

COMMIT;
