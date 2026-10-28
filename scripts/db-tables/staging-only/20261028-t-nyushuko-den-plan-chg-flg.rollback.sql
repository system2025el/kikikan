-- 20261028-t-nyushuko-den-plan-chg-flg.sql のロールバック
--
-- 1. だけ流せば、フラグは更新されなくなり、立っているフラグも消える（列は残るので、列を読むコードはそのまま動く）。
-- ⚠️ 2. の列の削除は、plan_chg_flg を読むコードを先に戻してから。v_nyushuko_den2_lst が列を参照しているので、
--    先に db-views/staging-only/v_nyushuko_den2_lst.rollback.sql でビューを戻すこと（戻さないと DROP COLUMN が失敗する）。
--    HT・ゲートはビューの列を名前で読んでいるので、ビューから列を消す前に HT・ゲートも戻すこと。

\set ON_ERROR_STOP on

BEGIN;

SET LOCAL lock_timeout = '5s';

-- 1. トリガーを外し、立っているフラグを消す
DROP TRIGGER IF EXISTS trg_nyushuko_den_plan_chg ON public.t_nyushuko_den;
DROP FUNCTION IF EXISTS public.trg_nyushuko_den_plan_chg();
UPDATE public.t_nyushuko_den SET plan_chg_flg = 0 WHERE plan_chg_flg <> 0;

-- 2. 列の削除（上の⚠️を済ませてから、コメントを外して流す）
-- ALTER TABLE public.t_nyushuko_den DROP COLUMN IF EXISTS plan_chg_flg;

COMMIT;
