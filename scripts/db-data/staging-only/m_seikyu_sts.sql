-- 適用状況: 開発環境(preview/public) 2026-08-26 / 本番 未適用
-- =====================================================================
-- m_seikyu_sts  請求ステータス名の変更
--
-- 変更内容:
--   sts_id = 2 : '処理中'   → '確認待ち'
--   sts_id = 3 : '郵送済み' → 'メール、配送済み'
--
-- 対象は sts_nam のみ。del_flg / add_dat / add_user / upd_dat / upd_user は変更しない。
-- （m_seikyu_sts はアプリからは selectActiveSeikyuSts の読み取り専用で、編集画面も
--   監査表示も無いため。upd_user に入れるべき値が無いので NULL のまま残す）
--
-- m_master_update は m_kizai / m_rfid / m_sagyo_sts / m_shozoku / m_tanaban の
-- 5件しか持たず m_seikyu_sts は対象外なので、updateMasterUpdates 相当の更新は不要。
--
-- WHERE に変更前の値を含めているため、二重実行しても何も起きない（冪等）。
-- 期待する更新件数はそれぞれ 1 件。
-- =====================================================================

BEGIN;

UPDATE public.m_seikyu_sts
   SET sts_nam = '確認待ち'
 WHERE sts_id = 2
   AND sts_nam = '処理中';

UPDATE public.m_seikyu_sts
   SET sts_nam = 'メール、配送済み'
 WHERE sts_id = 3
   AND sts_nam = '郵送済み';

COMMIT;
