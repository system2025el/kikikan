-- ============================================================
-- 01-precheck.sql
-- 本番・ステージングの両方で実行し、出力を比較する（差分があれば移行前に解消）
--   psql "$PROD_URL" -f 01-precheck.sql > precheck_prod.txt
--   psql "$STG_URL"  -f 01-precheck.sql > precheck_stg.txt
--   diff precheck_prod.txt precheck_stg.txt
-- ============================================================

\pset pager off

-- [1] サーバーバージョン（pg_dump のバージョン選定用。異なる場合は新しい方に合わせる）
SELECT 'server_version' AS chk, version();

-- [2] テーブル一覧（構成差分の検出）
SELECT 'tables' AS chk, table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- [3] カラム定義（列の増減・型変更の検出。ここに差分があると COPY が失敗する）
SELECT 'columns' AS chk,
       table_name || '.' || column_name || ' ' || data_type ||
       coalesce('(' || character_maximum_length || ')', '') AS col
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (SELECT table_name FROM information_schema.tables
                     WHERE table_schema = 'public' AND table_type = 'BASE TABLE')
ORDER BY table_name, ordinal_position;

-- [4] ビュー・マテビュー一覧（データ移行対象外だが定義差分の確認）
SELECT 'views' AS chk, table_name FROM information_schema.views
WHERE table_schema = 'public' ORDER BY table_name;
SELECT 'matviews' AS chk, matviewname FROM pg_matviews
WHERE schemaname = 'public' ORDER BY matviewname;

-- [5] シーケンス（t_log 以外に増えていないかの確認）
SELECT 'sequences' AS chk, sequence_name FROM information_schema.sequences
WHERE sequence_schema = 'public' ORDER BY sequence_name;

-- [6] FK・トリガー（0件であることの再確認。増えていれば投入順の考慮が必要）
SELECT 'fk_count' AS chk, count(*) FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';
SELECT 'trigger_count' AS chk, count(*) FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- [7] 行数（移行後の突合用。本番側の出力を控えておく）
SELECT 'rowcount' AS chk, relname AS tbl, n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
