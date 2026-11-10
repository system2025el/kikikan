-- 適用状況: ステージング 2026-11-09 / 本番 2026-11-09
--
-- HT・ゲートが呼ばなくなった旧RPCの削除（本番14本、ステージングは test_proc を加えた15本）
--
-- 2026-11-09 時点で HT（master 679cc62）・ゲート（master f129108 / 1.0.6.0）が呼ぶのは
--   nyushuko_send_20261021_1 / ido_send_20260925 / v_rfid_refresh_20260716_1 /
--   den_info_20260618_1（HT のみ）/ nyuko_list_cut_keep_20260917_1（HT のみ）
-- の5本だけ。Web（kikikan2026）と ELポータルは RPC を呼ばない。下の14本はどこからも呼ばれておらず、
-- 関数どうしの呼び出し・ビュー・トリガー・cron からの参照も無いことを両環境で確認した。
--
-- 削除は1トランザクションで行い、同じトランザクションの中で .rollback.sql 相当の定義から作り直して
-- 定義（バイト一致）・権限・所有者が元と同じになることを確認してから、作り直しだけを取り消して COMMIT した。
--
-- 定義のバックアップ（バイト一致・環境別）は作業者のPCのデスクトップ「不要RPC」にある
--   prod_20261109/ … 本番の14本（このフォルダの .rollback.sql と同じ内容）
--   stg_20261109/  … ステージングの15本。rf_nyushuko_send_20251225_1（staging-only だった修正入り）・
--                    rf_v_rfid_refresh_20251225_1・el_v_rfid_refresh_20251225_1 は本番と定義が違う

\set ON_ERROR_STOP on

BEGIN;
SET LOCAL lock_timeout = '5s';

-- 入出庫送信
DROP FUNCTION public.nyushuko_send_20261009_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer);
DROP FUNCTION public.nyushuko_send_20260626_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[],integer);
DROP FUNCTION public.rf_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]);
DROP FUNCTION public.el_nyushuko_send_20251225_1(t_nyushuko_result[],t_nyushuko_ctn_result[],ty_result_oya_den_link[],ty_ctn_result_oya_den_link[]);

-- 移動送信
DROP FUNCTION public.ido_send_20260716_1(t_ido_result[],t_ido_ctn_result[]);
DROP FUNCTION public.rf_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]);
DROP FUNCTION public.el_ido_send_20251225_1(t_ido_result[],t_ido_ctn_result[]);

-- 伝票情報
DROP FUNCTION public.rf_den_info_20251225_1(integer,integer,integer,integer);
DROP FUNCTION public.el_den_info_20251225_1(integer,integer,integer,integer);

-- 入庫キープ
DROP FUNCTION public.nyuko_list_cut_keep_20260716_1(integer,timestamp with time zone,integer,integer);
DROP FUNCTION public.rf_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer);
DROP FUNCTION public.el_nyuko_list_cut_keep_20251225_1(integer,timestamp with time zone,integer,integer);

-- v_rfid のリフレッシュ（中身は v_rfid_refresh_20260716_1 と同じ）
DROP FUNCTION public.rf_v_rfid_refresh_20251225_1();
DROP FUNCTION public.el_v_rfid_refresh_20251225_1();

-- ステージングだけ（本番には無い。中身は RAISE NOTICE するだけのテスト用プロシージャ）
-- DROP PROCEDURE public.test_proc(text);

COMMIT;
