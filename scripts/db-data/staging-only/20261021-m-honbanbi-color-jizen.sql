-- 適用状況: ステージング 2026-10-21 / 本番 未適用
-- ============================================================
-- 20261021-m-honbanbi-color-jizen.sql
-- 本番日色マスタに事前準備の色（clolor_id = 4）を追加する
--
-- 在庫表（受注機材明細画面・貸出状況）で、準備日〜出庫日の前日のセルを塗る色。
-- 4 は 使用日1・出庫日2・入庫日3 の次。同じ日に別の種別があると max(種別) で大きい方が勝つので、
-- 仕込み〜本番（10〜40）や出庫日・入庫日の色の方が優先される。
-- 種別4は色のためだけの値で、t_juchu_kizai_honbanbi には入れない（事前準備は t_juchu_kizai_jizen で持つ）。
-- マスタの全行を一覧する画面は無い（各画面は種別IDで引く）ので、行を足しても他の画面の表示は変わらない。
-- 監査値（add_user）は入れる値が無いので空のまま（README の方針。後で入れる可能性あり）。
--
-- 期待件数: INSERT 0 1（二重実行しても 0 件で何も起きない）
-- ============================================================

\set ON_ERROR_STOP on

BEGIN;

INSERT INTO public.m_honbanbi_color (clolor_id, color_nam, mem, add_dat)
SELECT 4, '#E8D5B7', '事前準備（準備日～出庫日の前日）', now()
 WHERE NOT EXISTS (SELECT 1 FROM public.m_honbanbi_color WHERE clolor_id = 4);

COMMIT;
