-- 適用状況: 開発環境(preview/public) 2026-08-25 / 本番 未適用
-- v_rfid_sts 高速化版（第2弾）
--
-- 前提: 本ファイルは applied/v_rfid_sts.sql（5つの相関サブクエリ → ウィンドウ関数3つに統合、
--       本番2026-08-19適用済み）に続く2回目の高速化です。ロールバック先はその
--       ウィンドウ関数版（＝本番の現在の定義）になります。
--
-- 変更内容: ORDER BY の異なる3つのウィンドウ（w_all / w_shozoku / w_sts）を
--           GROUP BY rfid_tag_id の集約1パスに置き換えた。
--
-- なぜ速くなるか:
--   旧定義は3つのウィンドウの ORDER BY がそれぞれ異なるため、
--     w_all     : ORDER BY upd_dat DESC NULLS LAST
--     w_shozoku : ORDER BY (shozoku_id IS NULL),     upd_dat DESC NULLS LAST
--     w_sts     : ORDER BY (rfid_kizai_sts IS NULL), upd_dat DESC NULLS LAST
--   v_rfid_sagyo_sts（5テーブルUNION ALL、実測53.5万行）を3回ソートし直していた。
--   さらに元データ全体のソートが work_mem（開発環境で3500kB）に収まらず、
--   16MB前後のディスクスピル（external merge）が発生していた。
--
--   集約1パスにすると、5つのソーステーブルすべてに存在する
--   idx_t_rfid_status_result / idx_t_nyushuko_result / idx_t_nyushuko_ctn_result /
--   idx_t_ido_result / idx_t_ido_ctn_result（いずれも先頭列 rfid_tag_id で、
--   本ビューが必要とする5列をすべて含むカバリングインデックス）を使って
--   Index Only Scan + Merge Append が選ばれる。Merge Append の出力は
--   すでに rfid_tag_id 順のため GroupAggregate がそのまま乗り、
--   ソート0回・ディスクスピル0になる。
--   1タグあたり平均5.19行（最大47行）と小さいので、集約内の ORDER BY のコストは無視できる。
--
--   ※この計画は上記5本の idx_* インデックスに依存する。これらを削除・変更すると
--     Seq Scan + 全体ソートに戻り、速度が劣化する点に注意。
--
-- 等価性の根拠:
--   * array_remove(array_agg(x ORDER BY upd_dat DESC NULLS LAST), NULL))[1] は
--     「その並び順での最初の非NULL値」であり、旧定義の
--     first_value(x) OVER (ORDER BY (x IS NULL), upd_dat DESC NULLS LAST) と同値。
--     非NULL行を先頭に寄せてから最新順に並べた先頭＝最新の非NULL値、という意味が一致する。
--     全行NULLなら array_remove の結果が空配列となり [1] は NULL を返すため、この点も一致。
--   * max(upd_dat) は first_value(upd_dat) OVER (ORDER BY upd_dat DESC NULLS LAST) と同値
--     （NULLS LAST により非NULLが先頭に来るため、先頭＝最大値。全行NULLならどちらもNULL）。
--   * upd_user は upd_dat の降順先頭行の値を取るため、旧定義の w_all と一致。
--
-- 検証（2026-08-25）:
--   * 開発環境・本番の両方で、新旧定義を EXCEPT ALL で双方向突合し差分0を確認。
--       開発環境: 103,116行 / only_in_new=0 / only_in_old=0
--       本番    : 103,509行 / only_in_new=0 / only_in_old=0（読み取りのみ、本番は未変更）
--   * マテビュー v_rfid の実体（全11列）でも新旧突合し差分0を確認（開発環境 102,868行）。
--   * 同一 rfid_tag_id・同一 upd_dat で upd_user / rfid_kizai_sts が割れる「タイ」は
--     開発環境・本番とも0件。よって first_value と array_agg の
--     タイ時の非決定性による差異は発生しない（＝上記の一致は偶然ではない）。
--   * 列名・型・型修飾子・列順が旧定義と完全一致することを pg_attribute で確認済み
--     （CREATE OR REPLACE VIEW が通り、依存する v_rfid にも影響しない）。
--
-- 実測（開発環境、work_memはデフォルト値のまま変更なし）:
--   REFRESH MATERIALIZED VIEW public.v_rfid の実行時間
--     変更前: 約4.9〜6.1秒
--     変更後: 約1.34〜1.37秒
--
--   なお work_mem の引き上げは対策にならない（16MB/32MBで横ばい、64MBでは
--   並列が効かなくなり約7.1秒へ悪化）。ディスクスピルは症状であって原因ではない。
--
-- 依存: v_rfid_sagyo_sts は変更不要（内側の ORDER BY 1 を残したままでも同じ計画になる）。

CREATE OR REPLACE VIEW public.v_rfid_sts AS
SELECT
  rfid_tag_id,
  (array_remove(array_agg(shozoku_id     ORDER BY upd_dat DESC NULLS LAST), NULL))[1] AS shozoku_id,
  (array_remove(array_agg(rfid_kizai_sts ORDER BY upd_dat DESC NULLS LAST), NULL))[1] AS rfid_kizai_sts,
  max(upd_dat) AS upd_dat,
  (array_agg(upd_user ORDER BY upd_dat DESC NULLS LAST))[1]::character varying(50) AS upd_user
FROM v_rfid_sagyo_sts
GROUP BY rfid_tag_id;
