-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- ============================================================
-- 20261021-t-juchu-kizai-jizen.sql
-- 事前準備（事前ピッキング・事前最終確認）の追加
--   1) テーブル public.t_juchu_kizai_jizen の作成（受注機材明細ごとの準備日時・準備数）
--   2) anon / authenticated への GRANT
--
-- 明細ごとに 0〜1 行。キーは受注機材明細（t_juchu_kizai_meisai）と同じ4列で、明細idも同じ値を持つ。
-- t_juchu_kizai_meisai に列を足さないのは、関数の row(...)::t_juchu_kizai_meisai が列の個数と順に依存して壊れるのを避け、
-- 見積・請求のビューに触れずに済ませるため。
--
-- 在庫は準備日〜出庫日の前日に準備数を引き当てる（v_juchu_kizai_dat_qty ほか）。出庫日以降は今どおり合計数。
-- 伝票は t_nyushuko_den に作業区分 80（事前ピッキング）・90（事前最終確認）の2行を作る（Web の保存処理）。
--
-- ★GRANT は必須。ステージングは public スキーマに default privileges が無く、CREATE TABLE だけでは 42501 になる。
--   既存テーブル（t_juchu_kizai_meisai）と同じ anon=arwd / authenticated=arwdDxt に揃える。
-- ★RLS は有効化しない（既存テーブルはすべて relrowsecurity = false）。
-- ★外部キーは張らない（このDBは外部キー0件）。明細を消すときの事前準備の行の削除はアプリ側で行う。
-- ★本番データのステージング移行（scripts/db-migration）の除外リストには入れない（トランザクションデータとして移行する）。
--
-- 適用順: このテーブル → db-data（m_sagyo_kbn・m_honbanbi_color）→ db-views → db-functions → Web
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

CREATE TABLE IF NOT EXISTS public.t_juchu_kizai_jizen (
  juchu_head_id         integer NOT NULL,
  juchu_kizai_head_id   integer NOT NULL,
  juchu_kizai_meisai_id integer NOT NULL,
  kizai_id              integer NOT NULL,
  jizen_dat             timestamp with time zone NOT NULL,
  jizen_qty             integer NOT NULL,
  add_dat               timestamp with time zone,
  add_user              character varying(50),
  upd_dat               timestamp with time zone,
  upd_user              character varying(50),
  CONSTRAINT t_juchu_kizai_jizen_pkey PRIMARY KEY (juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, kizai_id)
);

COMMENT ON TABLE  public.t_juchu_kizai_jizen           IS '事前準備。受注機材明細ごとの準備日時・準備数（明細idは t_juchu_kizai_meisai と同じ）';
COMMENT ON COLUMN public.t_juchu_kizai_jizen.jizen_dat IS '準備日時。この日から出庫日の前日まで、在庫を準備数だけ引き当てる';
COMMENT ON COLUMN public.t_juchu_kizai_jizen.jizen_qty IS '準備数（1以上、明細の合計数以下。アプリで検証する）';

-- 権限（★必須）。t_juchu_kizai_meisai と同じ
-- ★ステージングでは CREATE TABLE の時点で anon に全権限（arwdDxt）が付いた（2026-10-21 適用時に確認）。
--   t_juchu_kizai_meisai（anon = arwd）にそろえるため、いったん REVOKE してから付ける。
REVOKE ALL ON public.t_juchu_kizai_jizen FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.t_juchu_kizai_jizen TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.t_juchu_kizai_jizen TO authenticated;

COMMIT;

-- ------------------------------------------------------------
-- 適用後の確認
--   SELECT relrowsecurity FROM pg_class WHERE oid = 'public.t_juchu_kizai_jizen'::regclass;  -- false
--   SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type)
--     FROM information_schema.role_table_grants
--    WHERE table_schema = 'public' AND table_name = 't_juchu_kizai_jizen' GROUP BY grantee;
-- ------------------------------------------------------------
