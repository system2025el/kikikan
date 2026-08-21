-- 適用状況: 開発環境(preview/public) 2026-08-18 / 本番 2026-08-19
-- v_rfid_sts 高速化版
--
-- 変更内容: rfid_tag_id ごとの「最新の upd_dat/upd_user」「最新の非NULL shozoku_id」
--           「最新の非NULL rfid_kizai_sts」を、それぞれ独立した相関サブクエリ
--           （tab_rfid_sagyo_sts / tab_rfid_last / tab_rfid_user / tab_rfid_shozoku /
--           tab_rfid_kizaists の5つ）で求めていたため、v_rfid_sagyo_sts
--           （5テーブルUNION ALL、実測53万行超）を実質6回スキャンしていた。
--           これをウィンドウ関数（first_value）による1回のスキャンに統合した。
--
-- 等価性の根拠:
--   * w_all（PARTITION BY rfid_tag_id ORDER BY upd_dat DESC NULLS LAST）の
--     first_value(upd_dat)/first_value(upd_user) は、旧ロジックの
--     tab_rfid_last（MAX(upd_dat)）+ tab_rfid_user（DISTINCTで該当upd_datの行を取得）
--     と同じ「rfid_tag_idごとの最新行」を指す。
--   * w_shozoku（ORDER BY (shozoku_id IS NULL), upd_dat DESC NULLS LAST）の
--     first_value(shozoku_id) は、非NULLの行を先頭に寄せてから最新順に並べるため、
--     旧ロジックの tab_rfid_shozoku（WHERE shozoku_id IS NOT NULL の中でMAX(upd_dat)）
--     と同じ値になる。全行NULLの場合はどちらもNULLを返す点も一致。
--   * w_sts も同様に tab_rfid_kizaists と同値。
--   * 実データ(rfid_tag_id 102,868件)で新旧ロジックの全カラムを突き合わせ、
--     差分0件を確認済み（開発環境、2026-08-18時点）。
--
-- 注意: 旧ロジックの tab_rfid_user は DISTINCT + upd_dat一致のJOINだったため、
--       同一 rfid_tag_id・同一 upd_dat の行が複数テーブルにまたがって存在すると
--       理論上は行が重複する可能性があった（潜在バグ）。本バージョンは
--       first_value で必ず1行に決定されるため、その意味では旧ロジックより安全側になる。
--
-- 実測（開発環境、work_memはデフォルト値のまま変更なし）:
--   REFRESH MATERIALIZED VIEW public.v_rfid の実行時間
--     変更前: 約16.8〜25.0秒
--     変更後: 約5.2〜8.5秒

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
