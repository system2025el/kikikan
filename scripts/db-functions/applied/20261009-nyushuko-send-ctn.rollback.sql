-- 20261009-nyushuko-send-ctn.sql のロールバック
--
-- 新しく作った nyushuko_send_20261009_1 を削除する。既存の nyushuko_send_20260626_1・rf_nyushuko_send_20251225_1 には影響しない。
-- ★ 先に HT・ゲートを旧関数（nyushuko_send_20260626_1）に戻してから流すこと（呼んでいるアプリがあると送信が落ちる）
-- ★★ 2026-11-09 に nyushuko_send_20261009_1 も旧関数も削除済み（20261109-drop-unused-rpc）。経緯の記録で、今は流す意味が無い。

\set ON_ERROR_STOP on

BEGIN;

DROP FUNCTION IF EXISTS public.nyushuko_send_20261009_1(public.t_nyushuko_result[], public.t_nyushuko_ctn_result[], public.ty_result_oya_den_link[], public.ty_ctn_result_oya_den_link[], integer);

COMMIT;
