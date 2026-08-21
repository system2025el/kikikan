-- 適用状況: 開発環境(preview/public) 2026-08-18 / 本番 2026-08-19
-- =====================================================================
-- v_rfid_sts 変更前定義（ロールバック用バックアップ）
--
-- 取得元 : ステージング(preview) Supabase プロジェクト jimqcvyaoddsxbcrsnfs / public スキーマ
-- 取得方法: SELECT pg_get_viewdef('public.v_rfid_sts', true)
-- reloptions: なし
--
-- 用途: 高速化版（v_rfid_sts.sql）を適用したあとにデータ差異などの問題が出た場合、
--       このファイルをそのまま実行すれば変更前の定義に戻せる。
-- =====================================================================

CREATE OR REPLACE VIEW public.v_rfid_sts AS
 SELECT tab_rfid_sagyo_sts.rfid_tag_id,
    tab_rfid_shozoku.shozoku_id,
    tab_rfid_kizaists.rfid_kizai_sts,
    tab_rfid_last.upd_dat,
    tab_rfid_user.upd_user
   FROM ( SELECT v_rfid_sagyo_sts.rfid_tag_id
           FROM v_rfid_sagyo_sts
          GROUP BY v_rfid_sagyo_sts.rfid_tag_id) tab_rfid_sagyo_sts
     LEFT JOIN ( SELECT v_rfid_sagyo_sts.rfid_tag_id,
            max(v_rfid_sagyo_sts.upd_dat) AS upd_dat
           FROM v_rfid_sagyo_sts
          GROUP BY v_rfid_sagyo_sts.rfid_tag_id
          ORDER BY v_rfid_sagyo_sts.rfid_tag_id) tab_rfid_last ON tab_rfid_sagyo_sts.rfid_tag_id::text = tab_rfid_last.rfid_tag_id::text
     LEFT JOIN ( SELECT DISTINCT v_rfid_sagyo_sts.rfid_tag_id,
            v_rfid_sagyo_sts.upd_dat,
            v_rfid_sagyo_sts.upd_user
           FROM v_rfid_sagyo_sts
          ORDER BY v_rfid_sagyo_sts.rfid_tag_id) tab_rfid_user ON tab_rfid_user.rfid_tag_id::text = tab_rfid_last.rfid_tag_id::text AND tab_rfid_user.upd_dat = tab_rfid_last.upd_dat
     LEFT JOIN ( SELECT sts.rfid_tag_id,
            sts.shozoku_id,
            sts.upd_dat
           FROM v_rfid_sagyo_sts sts
             JOIN ( SELECT v_rfid_sagyo_sts.rfid_tag_id,
                    max(v_rfid_sagyo_sts.upd_dat) AS upd_dat
                   FROM v_rfid_sagyo_sts
                  WHERE v_rfid_sagyo_sts.shozoku_id IS NOT NULL
                  GROUP BY v_rfid_sagyo_sts.rfid_tag_id
                  ORDER BY v_rfid_sagyo_sts.rfid_tag_id) sts_last ON sts.rfid_tag_id::text = sts_last.rfid_tag_id::text AND sts.upd_dat = sts_last.upd_dat) tab_rfid_shozoku ON tab_rfid_sagyo_sts.rfid_tag_id::text = tab_rfid_shozoku.rfid_tag_id::text
     LEFT JOIN ( SELECT sts.rfid_tag_id,
            sts.rfid_kizai_sts,
            sts.upd_dat
           FROM v_rfid_sagyo_sts sts
             JOIN ( SELECT v_rfid_sagyo_sts.rfid_tag_id,
                    max(v_rfid_sagyo_sts.upd_dat) AS upd_dat
                   FROM v_rfid_sagyo_sts
                  WHERE v_rfid_sagyo_sts.rfid_kizai_sts IS NOT NULL
                  GROUP BY v_rfid_sagyo_sts.rfid_tag_id
                  ORDER BY v_rfid_sagyo_sts.rfid_tag_id) sts_last ON sts.rfid_tag_id::text = sts_last.rfid_tag_id::text AND sts.upd_dat = sts_last.upd_dat) tab_rfid_kizaists ON tab_rfid_sagyo_sts.rfid_tag_id::text = tab_rfid_kizaists.rfid_tag_id::text
  ORDER BY tab_rfid_last.rfid_tag_id;
