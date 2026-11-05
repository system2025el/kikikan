-- ============================================================
-- 20261021-m-sagyo-kbn-jizen.rollback.sql
-- 20261021-m-sagyo-kbn-jizen.sql を取り消す（作業区分 80・90 を削除）
--
-- ★80・90 の伝票（t_nyushuko_den）が残っていると、出庫明細などで作業区分名が空になる。
--   事前準備を戻すときは、伝票を消してからこのSQLを流す。
-- 期待件数: DELETE 2
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

DELETE FROM public.m_sagyo_kbn WHERE sagyo_kbn_id IN (80, 90);

COMMIT;
