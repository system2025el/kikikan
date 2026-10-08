-- 20260930-t-nyushuko-den-nyuko-fix-qty.sql のロールバック
--
-- ⚠️ 列を消す前に、nyuko_fix_qty を使うコード（入庫明細の到着・到着解除）を元に戻しておくこと。
--    コードが列を参照したまま消すと、到着・到着解除が落ちる。

\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE public.t_nyushuko_den DROP COLUMN IF EXISTS nyuko_fix_qty;

COMMIT;
