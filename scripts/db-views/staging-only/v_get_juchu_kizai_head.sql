-- 適用状況: ステージング 2026-10-19（del-meisai 分。事前準備の変更は 2026-10-21） / 本番 未適用
-- =====================================================================
-- ★2026-10-21 追加（事前準備、2026-10-21 ステージング適用）: 入出庫種別の CASE に 80/90 → 3（事前）を追加し、
--   GROUP BY に「80/90 なら受注機材ヘッダーid、それ以外は 0」を加える（列は足さない。列構成は不変で CREATE OR REPLACE で当てられる）。
--   事前の行は機材ヘッダーごとに1行になり、juchu_kizai_head_idv はそのヘッダーidの1つだけになる。
--   依存ビュー側（v_nyushuko_den2・_head・_lst）は、種別 3 のとき juchu_kizai_head_idv と機材ヘッダーidを照合して結合する。
--   v_nyushuko_den2_lst_oyako は照合しないので事前の行は二重になり得るが、使っている所は入庫（30）だけを見るので影響しない。
--   2026-10-21 ステージングで検証（一時ビューで読み取りのみ）: 事前の伝票が無い状態で全列・行数（3,559）とも差分0。
-- ★本番に del-meisai だけを先に当てる場合は、このファイルではなく del-meisai ブランチの版（git show del-meisai:<このファイル>）を使う。
--   このファイルは del-meisai と事前準備の両方の変更を含む。
--
-- ---- ここから del-meisai（受注削除）の変更 ----
-- v_get_juchu_kizai_head  ヘッダーのまとめ方を「作業区分ごと」→「入出庫種別（出庫／入庫）ごと」に変更（列構成は不変）
--
-- 背景: このビューは伝票（t_nyushuko_den）から、受注・作業日時・作業場所・入出庫種別ごとに、合体している受注機材
--       ヘッダー（juchu_kizai_head_idv など）を1行にまとめる。ところが GROUP BY が作業区分（sagyo_kbn_id）単位だった
--       ため、ピッキング（10）と最終確認（20）で伝票のあるヘッダーの組み合わせが違うと、出庫（入出庫種別1）で2行になる。
--       v_nyushuko_den2・v_nyushuko_den2_head・v_nyushuko_den2_lst・v_nyushuko_den2_lst_oyako は入出庫種別で結合するので、
--       出庫一覧に同じ出庫が2行（合体したものと一部のヘッダーだけのもの）出たり、明細の行が二重になったりする。
--       受注削除（実績のある機材を削除するとピッキングの行だけ残る場合がある）や、コンテナしか無いヘッダー（コンテナの
--       伝票は最終確認にしか無い）で起きるようになった（2026-10-19 受注 91601 で確認）。
--
-- 変更: GROUP BY の sagyo_kbn_id を、SELECT と同じ入出庫種別の CASE 式に置き換える。SELECT の列・型・順序は変えない。
--       2026-10-19 にステージングで読み取りのみで試算：今の 3,552 行 → 3,551 行。変わるのは受注 91601（ヘッダー 17 と
--       「17,18」の2行 → 「17,18」の1行）だけで、ほかの行は列の値まで同じ。
--
-- reloptions: security_invoker = on（CREATE OR REPLACE で WITH を省くと外れるので必ず付ける）
-- 依存しているビュー: v_nyushuko_den2, v_nyushuko_den2_head, v_nyushuko_den2_lst, v_nyushuko_den2_lst_oyako
--   列構成を変えないので CREATE OR REPLACE で当てられ、依存ビューの作り直しは不要。
-- ロールバック: v_get_juchu_kizai_head.rollback.sql（今の定義）
-- =====================================================================

CREATE OR REPLACE VIEW public.v_get_juchu_kizai_head WITH (security_invoker = on) AS
 SELECT DISTINCT t_nyushuko_den.juchu_head_id,
    t_nyushuko_den.sagyo_den_dat,
    t_nyushuko_den.sagyo_id,
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END AS nyushuko_shubetu_id,
    array_to_string(array_agg(DISTINCT t_nyushuko_den.juchu_kizai_head_id ORDER BY t_nyushuko_den.juchu_kizai_head_id), ','::text) AS juchu_kizai_head_idv,
    array_to_string(array_agg(DISTINCT my_juchu_kizai_head.head_nam), '，'::text) AS head_namv,
    array_to_string(array_agg(DISTINCT my_juchu_kizai_head.juchu_kizai_head_kbn), ','::text) AS juchu_kizai_head_kbnv,
    my_juchu_kizai_head.juchu_kizai_head_kbn,
    array_to_string(array_agg(DISTINCT my_juchu_kizai_head.mem), '，'::text) AS memv
   FROM t_nyushuko_den
     JOIN t_juchu_head ON t_nyushuko_den.juchu_head_id = t_juchu_head.juchu_head_id AND t_juchu_head.del_flg = 0
     LEFT JOIN ( SELECT DISTINCT t_juchu_kizai_head.juchu_head_id,
            t_juchu_kizai_head.juchu_kizai_head_id,
            t_juchu_kizai_head.juchu_kizai_head_kbn,
            t_juchu_kizai_head.juchu_honbanbi_qty,
            t_juchu_kizai_head.nebiki_amt,
            t_juchu_kizai_head.mem,
            t_juchu_kizai_head.head_nam,
            t_juchu_kizai_head.dsp_ord_num,
            t_juchu_kizai_head.oya_juchu_kizai_head_id,
            t_juchu_kizai_head.ht_kbn,
            t_juchu_kizai_head.add_dat,
            t_juchu_kizai_head.add_user,
            t_juchu_kizai_head.upd_dat,
            t_juchu_kizai_head.upd_user,
            t_juchu_kizai_head.nebiki_rat
           FROM t_juchu_kizai_head
          ORDER BY t_juchu_kizai_head.juchu_head_id, t_juchu_kizai_head.dsp_ord_num) my_juchu_kizai_head ON t_juchu_head.juchu_head_id = my_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_head_id = my_juchu_kizai_head.juchu_head_id AND t_nyushuko_den.juchu_kizai_head_id = my_juchu_kizai_head.juchu_kizai_head_id
  GROUP BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END), my_juchu_kizai_head.juchu_kizai_head_kbn, (CASE WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN t_nyushuko_den.juchu_kizai_head_id ELSE 0 END)
  ORDER BY t_nyushuko_den.juchu_head_id, t_nyushuko_den.sagyo_den_dat, t_nyushuko_den.sagyo_id, (
        CASE
            WHEN t_nyushuko_den.sagyo_kbn_id = 10 OR t_nyushuko_den.sagyo_kbn_id = 20 THEN 1
            WHEN t_nyushuko_den.sagyo_kbn_id = 30 THEN 2
            WHEN t_nyushuko_den.sagyo_kbn_id = 80 OR t_nyushuko_den.sagyo_kbn_id = 90 THEN 3
            ELSE NULL::integer
        END);
