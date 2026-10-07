-- 20260925-ido-send-rpc.sql のロールバック
--
-- 新規追加した3つの関数を落とすだけ。既存3本（ido_send_20260716_1 /
-- rf_ido_send_20251225_1 / el_ido_send_20251225_1）は触っていないので、
-- これを流せば HT・ゲートは元の関数で動き続ける。
--
-- ★ HT・ゲートが ido_send_20260925 に乗り換えた後に流すと、実績送信ができなくなる。
--   両アプリがどの関数を呼んでいるか確認してから実行すること。

\set ON_ERROR_STOP on

BEGIN;

DROP FUNCTION IF EXISTS public.ido_send_20260925(public.t_ido_result[], public.t_ido_ctn_result[]);
DROP FUNCTION IF EXISTS public.ido_recount_result_qty(public.t_ido_result[], boolean);

-- 一時期 ido_allocate_juchu（DB側でタグを明細に充当する関数）も作っていたが、
-- 充当はアプリ側で行う方針に変えたため廃止した。残っていれば落とす
DROP FUNCTION IF EXISTS public.ido_allocate_juchu(public.t_ido_result[], boolean);

COMMIT;

-- 参考: HT・ゲートの移行が完了して古い3本が不要になったときは、こちらを流す
--   （ロールバックではなく後片付け。実行前に両アプリのソースを確認すること）
--
-- BEGIN;
-- DROP FUNCTION IF EXISTS public.ido_send_20260716_1(public.t_ido_result[], public.t_ido_ctn_result[]);
-- DROP FUNCTION IF EXISTS public.rf_ido_send_20251225_1(public.t_ido_result[], public.t_ido_ctn_result[]);
-- DROP FUNCTION IF EXISTS public.el_ido_send_20251225_1(public.t_ido_result[], public.t_ido_ctn_result[]);
-- COMMIT;
