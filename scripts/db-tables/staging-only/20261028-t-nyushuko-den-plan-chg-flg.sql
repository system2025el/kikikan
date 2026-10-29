-- 適用状況: ステージング 2026-10-28 / 本番 未適用
-- ============================================================
-- 20261028-t-nyushuko-den-plan-chg-flg.sql
-- 出庫伝票の「数量変更」フラグ（plan_chg_flg）とトリガー
--   1) t_nyushuko_den に plan_chg_flg を追加
--   2) BEFORE UPDATE トリガーで、立てる・消すを判定する
--
-- なぜ必要か
--   メイン受注機材明細（キープ・分離を含む）で、出庫の読取実績がある機材の数量を変えても、出庫側（Web 出庫明細・HT・ゲート）
--   では変わったことが分からない。変わった機材を強調し、予定数 = 読取数＋補正数 になったら（再送信・実績クリア・補正・出発）
--   強調をやめる。一度一致したあとに追加の読取でまたずれても強調しない（数量がもう一度変わったら再び強調する）。
--   予定数と読取数の更新時刻を区別できる列が無いので、状態を列に持たせる。
--
-- 判定（作業区分 10/20/80/90 の機材の行だけ。コンテナ（m_kizai.ctn_flg = 1）は出庫明細で予定数を変えるので対象外）
--   立てる: 予定数が変わり、変わる前に読取数＋補正数が 1 以上あり、変わった後の予定数が 0 でない
--           （受注削除・出庫場所の変更・準備日の取り消しで予定0にして残す行は、受注削除として表示するので立てない）
--   消す  : 更新後の予定数 = 読取数＋補正数（立てる判定より後に見るので、変えた数量が読取とちょうど合っていれば立たない）
--   INSERT では動かない（新しく作られる伝票は 0）。
--
-- トリガーにした理由
--   消す判定は、HT・ゲートの送信RPC（nyushuko_send_*）・Web の実績クリア・補正・出発のすべての更新で要る。本番で動いている
--   送信RPCを作り直さずに、どの経路の UPDATE でも同じ判定にするため。このDBで初めてのトリガー（CLAUDE.md に記載）。
--   トリガーはこの列しか書き換えないので、フラグを読まない旧コードの動きは変わらない。
--
-- 影響確認（★適用前にステージングで流すこと）
--   t_nyushuko_den の行型をそのまま使う関数（%rowtype、::t_nyushuko_den）があると、列の追加で壊れる。
--   2026-09-30 の nyuko_fix_qty 追加時は無かったが、その後に送信RPCが増えているので、適用前に次で0件を確認する。
--     SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
--      WHERE n.nspname = 'public' AND p.prokind = 'f'
--        AND pg_get_functiondef(p.oid) ~* '(::\s*(public\.)?t_nyushuko_den\M|t_nyushuko_den%rowtype)';
--   既存テーブルへの列追加なので GRANT・移行の除外リスト（scripts/db-migration）の変更は不要。
--
-- 適用順: このファイル → db-views/staging-only/v_nyushuko_den2_lst.sql → Web → HT・ゲート
-- ロールバック: 20261028-t-nyushuko-den-plan-chg-flg.rollback.sql
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

-- 送信RPCとロックを取り合ったら待たずに失敗させる（流し直せばよい）
SET LOCAL lock_timeout = '5s';

-- 1. 列の追加 ------------------------------------------------------------------------------------
-- DEFAULT が定数なので、PG11 以降は既存行を書き換えずに一瞬で終わる
ALTER TABLE public.t_nyushuko_den ADD COLUMN IF NOT EXISTS plan_chg_flg smallint NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.t_nyushuko_den.plan_chg_flg IS
  '数量変更（1 = 読取実績のある状態で予定数が変わり、まだ 予定数 = 読取数＋補正数 になっていない）。トリガー trg_nyushuko_den_plan_chg が更新する。出庫（10/20）・事前（80/90）の機材のみ';

-- 2. トリガー -------------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_nyushuko_den_plan_chg()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sagyo_kbn_id IN (10, 20, 80, 90)
     AND NOT EXISTS (SELECT 1 FROM public.m_kizai k WHERE k.kizai_id = NEW.kizai_id AND COALESCE(k.ctn_flg, 0) = 1) THEN
    -- 読取実績のある状態で予定数が変わった → 立てる
    IF NEW.plan_qty IS DISTINCT FROM OLD.plan_qty
       AND COALESCE(NEW.plan_qty, 0) <> 0
       AND COALESCE(OLD.result_qty, 0) + COALESCE(OLD.result_adj_qty, 0) > 0 THEN
      NEW.plan_chg_flg := 1;
    END IF;
    -- 予定数 = 読取数＋補正数 になった → 消す（立てる判定より後）
    IF COALESCE(NEW.plan_qty, 0) = COALESCE(NEW.result_qty, 0) + COALESCE(NEW.result_adj_qty, 0) THEN
      NEW.plan_chg_flg := 0;
    END IF;
  END IF;
  RETURN NEW;
END
$$;

COMMENT ON FUNCTION public.trg_nyushuko_den_plan_chg() IS
  't_nyushuko_den.plan_chg_flg（数量変更）を更新するトリガー関数。scripts/db-tables/staging-only/20261028-t-nyushuko-den-plan-chg-flg.sql';

-- トリガー関数は RPC として呼ぶものではないので、API のロールからは実行権限を外す（トリガーの発火には影響しない）
REVOKE ALL ON FUNCTION public.trg_nyushuko_den_plan_chg() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_nyushuko_den_plan_chg ON public.t_nyushuko_den;
CREATE TRIGGER trg_nyushuko_den_plan_chg
  BEFORE UPDATE ON public.t_nyushuko_den
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_nyushuko_den_plan_chg();

COMMIT;

-- ------------------------------------------------------------
-- 適用後の確認（読み取りのみ）
--   SELECT tgname, tgenabled FROM pg_trigger WHERE tgrelid = 'public.t_nyushuko_den'::regclass AND NOT tgisinternal;  -- O
--   SELECT count(*) FROM public.t_nyushuko_den WHERE plan_chg_flg <> 0;  -- 0（既存行は全部 0）
--
-- 判定の確認（★必ず ROLLBACK する。実在の伝票を1行選んで値を変えてみる）
--   BEGIN;
--   -- 予定5・読取5 の行を 6 にする → 1、5 に戻す → 0
--   UPDATE public.t_nyushuko_den SET plan_qty = plan_qty + 1 WHERE <主キー> RETURNING plan_qty, result_qty, result_adj_qty, plan_chg_flg;
--   UPDATE public.t_nyushuko_den SET plan_qty = plan_qty - 1 WHERE <主キー> RETURNING plan_qty, result_qty, result_adj_qty, plan_chg_flg;
--   ROLLBACK;
--
-- 一時的に止める／戻す（定義は残る。止めている間はフラグが更新されない）
--   ALTER TABLE public.t_nyushuko_den DISABLE TRIGGER trg_nyushuko_den_plan_chg;
--   ALTER TABLE public.t_nyushuko_den ENABLE TRIGGER trg_nyushuko_den_plan_chg;
--
-- 判定だけ変える（キープを対象外にするなど）ときは、関数を CREATE OR REPLACE するだけでよい。
-- 判定を変える前に立ったフラグは、一致するか出発すれば消える。すぐ消したいときは UPDATE を流す。
-- ------------------------------------------------------------
