-- 適用状況: ステージング（del-meisai 分・事前準備の変更とも適用済み。数量変更の列は 2026-10-28 適用） / 本番 del-meisai 分のみ 2026-10-26 適用（事前準備・数量変更の変更は未適用）
-- =====================================================================
-- ★2026-10-28 追加（数量変更。末尾に plan_chg_flg を追加して 32→33列）。2026-10-28 ステージング適用:
--   ・t_nyushuko_den.plan_chg_flg（トリガーが更新する。scripts/db-tables/staging-only/20261028-t-nyushuko-den-plan-chg-flg.sql）を、
--     伝票の主キーで1行引いて出す。v_nyushuko_den_lst は依存ビューが3本あるので列を通さない（このビューの行は伝票1行に対応する）。
--   ・予定数（合計）が 0 の行は 0 にする（受注削除の表示を優先する。受注削除は予定0が前提なので重ならない）。
--   ・Web 出庫明細・HT・ゲートの出庫読取画面で、機材名を強調するのに使う（今は受注削除と同じ赤。色はお客さんに確認中）。
--   ・列の追加なので CREATE OR REPLACE で当てられる。戻すときは列が減るので DROP して作り直す（.rollback.sql）。
--   ・テーブルの列とトリガーを先に当てること（このビューが列を参照する）。
-- ★2026-10-21 追加（事前準備、2026-10-21 ステージング適用。列構成は不変）:
--   ・v_get_juchu_kizai_head との結合に「種別 3（事前）なら juchu_kizai_head_idv = juchu_kizai_head_id」を加える（事前は機材ヘッダーごと）。
--   ・受注削除の判定（juchu_meisai_del_flg）：事前（80/90）は「事前準備の行（t_juchu_kizai_jizen）が無い」で判定する
--     （2026-10-21 変更・同日ステージング適用）。準備日を消したとき、事前の実績ある伝票は明細idを変えずに予定0で残す
--     （受注明細は同じ場所に残るので、受注機材明細では判定できない）。明細idが本番と同じまま残るので、事前でのタグ削除・
--     補正を本番の同じ明細に反映できる。10/20 の出庫場所の照合は ARRAY[10, 20] に戻した（80/90 は上の分岐で判定する）。
--     ※2026-10-21 のステージング適用時は、80/90 も受注機材明細（出庫場所を照合）で判定し、準備日を消した伝票は
--       未使用の明細idに付け替えていた。付け替え済みの伝票は事前準備の行も無いので、新しい判定でも受注削除のまま
--     2026-10-23 変更: 事前準備の行があっても、明細の今の出庫場所（t_juchu_kizai_meisai.shozoku_id）が伝票の場所と
--     違えば受注削除とする（10/20 と同じ場所の照合）。準備日を消して K に残した伝票が、出庫場所を Y に変えて準備日を
--     付け直したときに通常の行へ戻ってしまうのを防ぐ。Web の deleteEmptyNyushukoDen も同じ判定。
--   ・予定・読取・補正がすべて 0 の行を出さない条件（今は入庫 30 だけ）に 80/90 を加える。
--   2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で全列・行数（123,266）とも差分0。
--   テストの受注で、事前の明細行が機材ヘッダーごとに1行ずつ（二重にならず）出ることを確認。
-- ★del-meisai 分は 2026-10-26 に本番へ適用済み（その定義は applied/v_nyushuko_den2_lst.sql）。このファイルは del-meisai と事前準備の両方を
--   含む「本番に当てる最終形」で、本番に当てるのは事前準備の分の差だけになる。.rollback.sql は本番の今の定義（applied の版）。
--
-- ---- ここから del-meisai（受注削除）の変更 ----
-- v_nyushuko_den2_lst  末尾に juchu_meisai_del_flg（受注削除）の1列を追加（31→32列）
--
-- 2026-10-15 追加: 機材の判定で、出庫（sagyo_kbn_id 10/20）のときは受注明細の出庫場所（shozoku_id）が伝票の場所
--   （nyushuko_basho_id）と同じものだけを「受注明細あり」とする。Web で出庫場所が変わった機材は、元の場所の実績ある
--   伝票を受注削除として残す（Web は新しい明細idに付け替えるのでこの照合が無くても判定に乗るが、HT・ゲートの読取画面を
--   開いたまま場所が変わって送信された行は、元の明細idのまま元の場所にできるため）。送信RPC nyushuko_send_20261009_1 の
--   変更点7と同じ照合。入庫（30）は入庫場所と明細の場所が違うので対象外。列構成は変えない（CREATE OR REPLACE で当てられる）。
--   2026-10-15 時点のステージングで、場所が違う出庫伝票は 2026-05 の受注 90953 の18行だけ（古いデータ）。
--
-- 背景: メイン受注機材明細で、出庫の実績・補正がある機材を削除すると、出庫伝票を予定数0で残す
--       （出庫明細に「受注削除」として表示し、現物を取り除いてもらうため）。これまで Web だけが自前の
--       SQL で判定していたが、HT・ゲートでも同じ表示をするため、判定をビューに持たせる。
--
-- 判定（1 = 受注から削除されたのに実績・補正が残っている行）:
--   ・予定数（合計）が 0 で、かつ受注明細が無い
--   ・受注明細は、機材は t_juchu_kizai_meisai、コンテナ（ctn_flg = 1）は t_juchu_ctn_meisai の
--     その場所（shozoku_id = nyushuko_basho_id）の行で探す（コンテナを機材の明細で探すと、すべて「明細無し」になるため）
--   ・ハンディの予定外の行も受注明細を持たないが、予定数に読取数が入るので 0 にはならない（予定数0を条件にして区別する）
--
-- 変更は SELECT 列の末尾への追加だけ。結合・WHERE・GROUP BY・ORDER BY は変えていないので、既存31列と行数は変わらない。
-- 判定に使う列（受注・機材ヘッダー・明細・機材・場所・コンテナフラグ）はすべて GROUP BY に含まれる。
-- このビューに依存するビューは無い（2026-10-06 ステージングで確認）。
--
-- 参照: Web 出庫明細（v-nyushuko-den2-lst.ts の selectNyushukoDetail）、HT・ゲートの出庫読取画面
-- reloptions: security_invoker = on（開発環境・本番とも同じ）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_nyushuko_den2_lst WITH (security_invoker = on) AS
 SELECT DISTINCT v_nyushuko_den_lst.nyushuko_shubetu_id,
    v_nyushuko_den_lst.sagyo_kbn_id,
    v_nyushuko_den_lst.sagyo_kbn_nam,
    v_nyushuko_den_lst.sagyo_kbn_nam_short,
    v_nyushuko_den_lst.juchu_head_id,
    v_nyushuko_den_lst.juchu_kizai_head_id,
    v_nyushuko_den_lst.juchu_kizai_meisai_id,
    v_nyushuko_den_lst.nyushuko_dat,
    v_nyushuko_den_lst.nyushuko_basho_id,
    v_nyushuko_den_lst.shozoku_nam,
    v_nyushuko_den_lst.koen_nam,
    v_nyushuko_den_lst.koenbasho_nam,
    v_nyushuko_den_lst.kokyaku_nam,
    v_get_juchu_kizai_head.juchu_kizai_head_idv,
    v_get_juchu_kizai_head.head_namv,
    v_get_juchu_kizai_head.juchu_kizai_head_kbnv,
    v_nyushuko_den_lst.kizai_id,
    v_nyushuko_den_lst.kizai_nam,
    v_nyushuko_den_lst.bld_cod,
    v_nyushuko_den_lst.tana_cod,
    v_nyushuko_den_lst.eda_cod,
    COALESCE(v_nyushuko_den_lst.ctn_flg, 0) AS ctn_flg,
    v_nyushuko_den_lst.mem AS kizai_mem,
    sum(COALESCE(v_nyushuko_den_lst.plan_qty, 0::bigint)) AS plan_qty,
    sum(COALESCE(v_nyushuko_den_lst.result_qty, 0::bigint)) AS result_qty,
    sum(COALESCE(v_nyushuko_den_lst.result_adj_qty, 0::bigint)) AS result_adj_qty,
    v_nyushuko_den_lst.dsp_ord_num_meisai,
    v_nyushuko_den_lst.indent_num,
    v_nyushuko_den_lst.mem2,
    v_nyushuko_den_lst.add_user,
    v_nyushuko_den_lst.upd_user,
        CASE
            WHEN sum(COALESCE(v_nyushuko_den_lst.plan_qty, 0::bigint)) <> 0::numeric THEN 0
            WHEN v_nyushuko_den_lst.sagyo_kbn_id = ANY (ARRAY[80, 90]) THEN (NOT (EXISTS ( SELECT 1
               FROM t_juchu_kizai_jizen j
                 JOIN t_juchu_kizai_meisai m ON m.juchu_head_id = j.juchu_head_id AND m.juchu_kizai_head_id = j.juchu_kizai_head_id AND m.juchu_kizai_meisai_id = j.juchu_kizai_meisai_id AND m.kizai_id = j.kizai_id
              WHERE j.juchu_head_id = v_nyushuko_den_lst.juchu_head_id AND j.juchu_kizai_head_id = v_nyushuko_den_lst.juchu_kizai_head_id AND j.juchu_kizai_meisai_id = v_nyushuko_den_lst.juchu_kizai_meisai_id AND j.kizai_id = v_nyushuko_den_lst.kizai_id AND m.shozoku_id = v_nyushuko_den_lst.nyushuko_basho_id)))::integer
            WHEN COALESCE(v_nyushuko_den_lst.ctn_flg, 0) = 1 THEN (NOT (EXISTS ( SELECT 1
               FROM t_juchu_ctn_meisai c
              WHERE c.juchu_head_id = v_nyushuko_den_lst.juchu_head_id AND c.juchu_kizai_head_id = v_nyushuko_den_lst.juchu_kizai_head_id AND c.juchu_kizai_meisai_id = v_nyushuko_den_lst.juchu_kizai_meisai_id AND c.kizai_id = v_nyushuko_den_lst.kizai_id AND c.shozoku_id = v_nyushuko_den_lst.nyushuko_basho_id)))::integer
            ELSE (NOT (EXISTS ( SELECT 1
               FROM t_juchu_kizai_meisai m
              WHERE m.juchu_head_id = v_nyushuko_den_lst.juchu_head_id AND m.juchu_kizai_head_id = v_nyushuko_den_lst.juchu_kizai_head_id AND m.juchu_kizai_meisai_id = v_nyushuko_den_lst.juchu_kizai_meisai_id AND m.kizai_id = v_nyushuko_den_lst.kizai_id AND ((v_nyushuko_den_lst.sagyo_kbn_id <> ALL (ARRAY[10, 20])) OR m.shozoku_id = v_nyushuko_den_lst.nyushuko_basho_id))))::integer
        END AS juchu_meisai_del_flg,
        CASE
            WHEN sum(COALESCE(v_nyushuko_den_lst.plan_qty, 0::bigint)) = 0::numeric THEN 0
            ELSE COALESCE(( SELECT max(d.plan_chg_flg) AS max
               FROM t_nyushuko_den d
              WHERE d.juchu_head_id = v_nyushuko_den_lst.juchu_head_id AND d.juchu_kizai_head_id = v_nyushuko_den_lst.juchu_kizai_head_id AND d.juchu_kizai_meisai_id = v_nyushuko_den_lst.juchu_kizai_meisai_id AND d.sagyo_kbn_id = v_nyushuko_den_lst.sagyo_kbn_id AND d.sagyo_den_dat = v_nyushuko_den_lst.nyushuko_dat AND d.sagyo_id = v_nyushuko_den_lst.nyushuko_basho_id AND d.kizai_id = v_nyushuko_den_lst.kizai_id), 0::smallint)::integer
        END AS plan_chg_flg
   FROM v_nyushuko_den_lst
     LEFT JOIN v_get_juchu_kizai_head ON v_nyushuko_den_lst.juchu_head_id = v_get_juchu_kizai_head.juchu_head_id AND v_nyushuko_den_lst.nyushuko_dat = v_get_juchu_kizai_head.sagyo_den_dat AND v_nyushuko_den_lst.nyushuko_basho_id = v_get_juchu_kizai_head.sagyo_id AND v_nyushuko_den_lst.nyushuko_shubetu_id = v_get_juchu_kizai_head.nyushuko_shubetu_id AND v_nyushuko_den_lst.juchu_kizai_head_kbn = v_get_juchu_kizai_head.juchu_kizai_head_kbnv::bigint AND (v_nyushuko_den_lst.nyushuko_shubetu_id IS DISTINCT FROM 3 OR v_get_juchu_kizai_head.juchu_kizai_head_idv = v_nyushuko_den_lst.juchu_kizai_head_id::text)
  WHERE v_nyushuko_den_lst.juchu_kizai_meisai_id <> 0 AND v_nyushuko_den_lst.kizai_id <> 0 AND NOT ((v_nyushuko_den_lst.sagyo_kbn_id = 30 OR v_nyushuko_den_lst.sagyo_kbn_id = 80 OR v_nyushuko_den_lst.sagyo_kbn_id = 90) AND v_nyushuko_den_lst.plan_qty = 0 AND v_nyushuko_den_lst.result_qty = 0 AND v_nyushuko_den_lst.result_adj_qty = 0)
  GROUP BY v_nyushuko_den_lst.nyushuko_shubetu_id, v_nyushuko_den_lst.sagyo_kbn_id, v_nyushuko_den_lst.sagyo_kbn_nam, v_nyushuko_den_lst.sagyo_kbn_nam_short, v_nyushuko_den_lst.juchu_head_id, v_nyushuko_den_lst.juchu_kizai_head_id, v_nyushuko_den_lst.juchu_kizai_meisai_id, v_nyushuko_den_lst.nyushuko_dat, v_nyushuko_den_lst.nyushuko_basho_id, v_nyushuko_den_lst.shozoku_nam, v_nyushuko_den_lst.koen_nam, v_nyushuko_den_lst.koenbasho_nam, v_nyushuko_den_lst.kokyaku_nam, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.head_namv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, v_nyushuko_den_lst.kizai_id, v_nyushuko_den_lst.kizai_nam, v_nyushuko_den_lst.bld_cod, v_nyushuko_den_lst.tana_cod, v_nyushuko_den_lst.eda_cod, (COALESCE(v_nyushuko_den_lst.ctn_flg, 0)), v_nyushuko_den_lst.mem, v_nyushuko_den_lst.dsp_ord_num_meisai, v_nyushuko_den_lst.indent_num, v_nyushuko_den_lst.mem2, v_nyushuko_den_lst.add_user, v_nyushuko_den_lst.upd_user
  ORDER BY v_nyushuko_den_lst.nyushuko_dat, v_nyushuko_den_lst.sagyo_kbn_id, v_nyushuko_den_lst.nyushuko_basho_id, v_nyushuko_den_lst.juchu_head_id, v_nyushuko_den_lst.juchu_kizai_head_id, v_get_juchu_kizai_head.juchu_kizai_head_idv, v_get_juchu_kizai_head.juchu_kizai_head_kbnv, (COALESCE(v_nyushuko_den_lst.ctn_flg, 0)), v_nyushuko_den_lst.dsp_ord_num_meisai, v_nyushuko_den_lst.bld_cod, v_nyushuko_den_lst.tana_cod, v_nyushuko_den_lst.eda_cod, v_nyushuko_den_lst.kizai_id;
