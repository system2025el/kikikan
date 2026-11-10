-- 20261021-nyushuko-send-jizen.sql のロールバック
--
-- 新しく作った nyushuko_send_20261021_1 を削除する。既存の nyushuko_send_20261009_1・nyushuko_send_20260626_1 には影響しない。
-- ★ 先に HT・ゲートを前の関数に戻してから流すこと（呼んでいるアプリがあると送信が落ちる）
-- ★ t_juchu_kizai_jizen（db-tables）を戻す前にこれを流す（この関数がテーブルを参照している）
-- ★★ 2026-11-09 に前の関数（nyushuko_send_20261009_1・nyushuko_send_20260626_1）は削除済み（20261109-drop-unused-rpc）。
--    これだけ流すと入出庫送信の関数が1本も無くなる。戻すなら先に 20261109-drop-unused-rpc.rollback.sql で前の関数を作り直し、
--    HT・ゲートをその関数を呼ぶ版に戻してから流すこと。

\set ON_ERROR_STOP on

BEGIN;

DROP FUNCTION IF EXISTS public.nyushuko_send_20261021_1(public.t_nyushuko_result[], public.t_nyushuko_ctn_result[], public.ty_result_oya_den_link[], public.ty_ctn_result_oya_den_link[], integer);

COMMIT;
