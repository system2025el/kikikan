-- ============================================================
-- データ投入後にステージングで実行する
--   1) ユーザー名列を対象ユーザーに書き換え
--   2) マテリアライズドビュー v_rfid のリフレッシュ
--   3) 統計情報の更新
--   4) 検証
-- 詳細は README.md を参照
-- ============================================================

\set ON_ERROR_STOP on
\pset pager off

-- ★書き換え先のユーザー（ステージングの m_user に存在する自分のアドレスに変更する）
\set target_mail 'y.yoneyama@refact.co.jp'
SELECT set_config('migration.target_mail', :'target_mail', false);

-- ------------------------------------------------------------
-- 1) ユーザー名列の書き換え
--    対象: add_user / upd_user / nyuryoku_user（全テーブル）
--    非対象:
--      kokyaku_tanto_nam  … 顧客側の担当者名（自社ユーザーではない）
--      t_weekly.tanto_nam … スケジュール画面「日直」の自由入力テキスト
--      m_kokyaku.mail / m_koenbasho.mail … 顧客・会場のメールアドレス
--      m_user             … ステージングのものを維持
--    NULL は NULL のまま残す（監査情報を捏造しない）
-- ------------------------------------------------------------
BEGIN;

DO $$
DECLARE
  r        record;
  target   text;
  n        bigint;
  total    bigint := 0;
  skip_tbl text[] := ARRAY['m_user', 't_lock', 't_log'];
BEGIN
  SELECT user_nam INTO target
  FROM m_user
  WHERE mail_adr = current_setting('migration.target_mail') AND del_flg = 0;

  IF target IS NULL OR target = '' THEN
    RAISE EXCEPTION 'm_user に % の有効な行が見つかりません。移行を中断します。',
      current_setting('migration.target_mail');
  END IF;

  RAISE NOTICE '書き換え先: user_nam = %', target;

  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name  = c.table_name
     AND t.table_type  = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.column_name IN ('add_user', 'upd_user', 'nyuryoku_user')
      AND NOT (c.table_name = ANY (skip_tbl))
    ORDER BY c.table_name, c.column_name
  LOOP
    EXECUTE format(
      'UPDATE public.%I SET %I = $1 WHERE %I IS NOT NULL AND %I <> $1',
      r.table_name, r.column_name, r.column_name, r.column_name
    ) USING target;

    GET DIAGNOSTICS n = ROW_COUNT;
    total := total + n;

    IF n > 0 THEN
      RAISE NOTICE '  %.% : %行', r.table_name, r.column_name, n;
    END IF;
  END LOOP;

  RAISE NOTICE '--- 合計 %行を「%」に書き換えました ---', total, target;
END $$;

COMMIT;

-- ------------------------------------------------------------
-- 2) マテリアライズドビューのリフレッシュ
--    v_rfid はインデックスが無いため CONCURRENTLY は使えない（排他ロックあり）
--    これを実行するまで保有数・在庫数は旧データのまま
-- ------------------------------------------------------------
REFRESH MATERIALIZED VIEW public.v_rfid;

-- ------------------------------------------------------------
-- 3) 統計情報の更新
--    Supabaseの postgres ロールはスーパーユーザーではないため、
--    システムカタログに対する "only superuser can analyze it" 警告が出るが無害
-- ------------------------------------------------------------
ANALYZE;

-- ------------------------------------------------------------
-- 4) 検証
-- ------------------------------------------------------------

-- [4-1] 行数一覧（precheck_prod.txt の rowcount と突合。厳密な比較は 03-migrate.sh verify）
SELECT 'rowcount' AS chk, relname AS tbl, n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;

-- [4-2] m_user はステージングのまま維持されているか
SELECT 'm_user' AS chk, mail_adr, user_nam, permission, del_flg
FROM m_user
WHERE mail_adr = current_setting('migration.target_mail');

-- [4-3] 担当者ドロップダウン（m_user.user_nam）に無い nyuryoku_user が残っていないか
--       → 0件であること
SELECT 'orphan_nyuryoku_user' AS chk, t.tbl, t.nyuryoku_user, count(*) AS rows
FROM (
  SELECT 't_juchu_head' AS tbl, nyuryoku_user FROM t_juchu_head
  UNION ALL SELECT 't_mitu_head',   nyuryoku_user FROM t_mitu_head
  UNION ALL SELECT 't_seikyu_head', nyuryoku_user FROM t_seikyu_head
) t
WHERE t.nyuryoku_user IS NOT NULL
  AND t.nyuryoku_user NOT IN (SELECT user_nam FROM m_user WHERE del_flg = 0)
GROUP BY 1, 2, 3;

-- [4-4] 書き換え漏れの upd_user が残っていないか（サンプル）→ 0件であること
SELECT 'orphan_upd_user' AS chk, upd_user, count(*)
FROM m_kizai
WHERE upd_user IS NOT NULL
  AND upd_user <> (SELECT user_nam FROM m_user WHERE mail_adr = current_setting('migration.target_mail'))
GROUP BY 1, 2;

-- [4-5] m_master_update（updateMasterUpdates は UPDATE のみなので行が必要）→ 5行
SELECT 'm_master_update' AS chk, master_nam, upd_dat FROM m_master_update ORDER BY master_nam;

-- [4-6] RFIDタグの所属・ステータスが復元されているか
--       shozoku_null が 0 に近いこと（所属が無いと所属別数量が全て0になる）
SELECT 'v_rfid' AS chk,
       count(*)                                        AS tags,
       count(*) FILTER (WHERE shozoku_id IS NULL)      AS shozoku_null,
       count(*) FILTER (WHERE rfid_kizai_sts IS NULL)  AS sts_null,
       count(*) FILTER (WHERE rfid_kizai_sts >= 100)   AS ng_tags
FROM v_rfid;

-- [4-7] 保有数・在庫数のサンプル
SELECT 'kizai_qty' AS chk, kizai_id, kizai_nam, kizai_qty, rfid_kics_qty, rfid_yard_qty
FROM v_kizai_qty
WHERE kizai_qty > 0
ORDER BY kizai_qty DESC
LIMIT 5;

SELECT 'zaiko_qty' AS chk, plan_dat, kizai_id, kizai_qty, plan_qty, zaiko_qty
FROM v_zaiko_qty
WHERE plan_dat >= current_date
ORDER BY plan_dat, kizai_id
LIMIT 5;

-- [4-8] 在庫がマイナス（引き当て超過）の件数。本番と同数になるのが正しい
SELECT 'negative_zaiko' AS chk, count(*) FROM v_zaiko_qty WHERE zaiko_qty < 0;
