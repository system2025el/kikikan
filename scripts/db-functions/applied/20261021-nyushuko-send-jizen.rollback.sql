-- 20261021-nyushuko-send-jizen.sql のロールバック
--
-- 新しく作った nyushuko_send_20261021_1 を削除する。既存の nyushuko_send_20261009_1・nyushuko_send_20260626_1 には影響しない。
-- ★ 先に HT・ゲートを前の関数に戻してから流すこと（呼んでいるアプリがあると送信が落ちる）
-- ★ t_juchu_kizai_jizen（db-tables）を戻す前にこれを流す（この関数がテーブルを参照している）

\set ON_ERROR_STOP on

BEGIN;

DROP FUNCTION IF EXISTS public.nyushuko_send_20261021_1(public.t_nyushuko_result[], public.t_nyushuko_ctn_result[], public.ty_result_oya_den_link[], public.ty_ctn_result_oya_den_link[], integer);

COMMIT;
