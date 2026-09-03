-- v_rfid_sts ロールバック用（= 本番の現在の定義）
--
-- これは applied/v_rfid_sts.sql（ウィンドウ関数3つ版、本番2026-08-19適用済み）と
-- 同じ内容です。staging-only/v_rfid_sts.sql（集約1パス版）を戻したい場合にこれを実行します。
--
-- 実行後は v_rfid のリフレッシュも必要です:
--   REFRESH MATERIALIZED VIEW public.v_rfid;

CREATE OR REPLACE VIEW public.v_rfid_sts AS
SELECT DISTINCT ON (rfid_tag_id)
  rfid_tag_id,
  first_value(shozoku_id)     OVER w_shozoku AS shozoku_id,
  first_value(rfid_kizai_sts) OVER w_sts      AS rfid_kizai_sts,
  first_value(upd_dat)        OVER w_all      AS upd_dat,
  (first_value(upd_user)      OVER w_all)::character varying(50) AS upd_user
FROM v_rfid_sagyo_sts
WINDOW
  w_all     AS (PARTITION BY rfid_tag_id ORDER BY upd_dat DESC NULLS LAST),
  w_shozoku AS (PARTITION BY rfid_tag_id ORDER BY (shozoku_id IS NULL), upd_dat DESC NULLS LAST),
  w_sts     AS (PARTITION BY rfid_tag_id ORDER BY (rfid_kizai_sts IS NULL), upd_dat DESC NULLS LAST)
ORDER BY rfid_tag_id;
