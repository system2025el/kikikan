-- v_ido_den2_meisai_lst のロールバック。
-- 新規追加したビューなので、落とすだけ。既存ビューには影響しない。
-- ★ HT・ゲートが乗り換えた後に落とすとリストが取得できなくなる。
--   段階2が始まっていないこと（両アプリとも v_ido_den2_lst を読んでいること）を確認してから流すこと。

DROP VIEW IF EXISTS public.v_ido_den2_meisai_lst;
