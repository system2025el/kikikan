-- ============================================================
-- 02-truncate-staging.sql
-- ステージングのデータを削除する（★破壊的。実行前に必ずバックアップを取得すること）
-- 除外テーブル:
--   m_user        … ステージングのアカウントを維持する（認証と紐づくため置換しない）
--   t_lock        … 編集ロックの残骸。移行不要
--   t_log         … 移行不要（含めるならシーケンス setval が必要）
--   t_juchu_tempu … 受注添付ファイル。実体はStorage側にあり移行されないため、
--                   行だけ入れるとファイルを開けない添付が並ぶ（ステージングの分を維持する）
-- FK制約は0件のため TRUNCATE の順序・CASCADE は不要
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  r        record;
  skip_tbl text[] := ARRAY['m_user', 't_lock', 't_log', 't_juchu_tempu'];
  cnt      int    := 0;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND NOT (table_name = ANY (skip_tbl))
    ORDER BY table_name
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I', r.table_name);
    cnt := cnt + 1;
    RAISE NOTICE 'truncated: %', r.table_name;
  END LOOP;

  RAISE NOTICE '--- %件のテーブルをTRUNCATEしました（m_user / t_lock / t_log / t_juchu_tempu は保持）---', cnt;
END $$;

-- 残しているテーブルの件数を確認
SELECT 'kept' AS chk, 'm_user' AS tbl, count(*) FROM m_user
UNION ALL SELECT 'kept', 't_lock', count(*) FROM t_lock
UNION ALL SELECT 'kept', 't_log', count(*) FROM t_log
UNION ALL SELECT 'kept', 't_juchu_tempu', count(*) FROM t_juchu_tempu;

COMMIT;
