-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- ============================================================
-- 20261021-m-sagyo-kbn-jizen.sql
-- 作業区分マスタに 80（事前ピッキング）・90（事前最終確認）を追加する（事前準備）
--
-- 作業状態は sagyo_kbn_id + 1 / + 2 で作る（v_nyushuko_total_time_sts）ため、11・21 などと重ならない 80・90 にした。
-- 作業状態マスタ（m_sagyo_sts）には追加しない。一覧の作業状態はビューで本番と同じ値（11/12/21/22）に読み替えてから
-- 名前を引くので、81/82/91/92 の名前は使わない。
-- 監査値（add_user）は入れる値が無いので空のまま（README の方針）。
--
-- 期待件数: INSERT 0 2（二重実行しても 0 件で何も起きない）
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public.m_sagyo_kbn (sagyo_kbn_id, sagyo_kbn_nam, sagyo_kbn_nam_short, del_flg, add_dat)
SELECT v.sagyo_kbn_id, v.sagyo_kbn_nam, v.sagyo_kbn_nam_short, 0, now()
  FROM (VALUES
          (80, '事前ピッキング', '事ST'),
          (90, '事前最終確認', '事CH')
       ) AS v (sagyo_kbn_id, sagyo_kbn_nam, sagyo_kbn_nam_short)
 WHERE NOT EXISTS (SELECT 1 FROM public.m_sagyo_kbn m WHERE m.sagyo_kbn_id = v.sagyo_kbn_id);

COMMIT;
