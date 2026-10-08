-- 適用状況: ステージング 2026-09-24 / 本番 2026-10-07
--
-- 【新規】HT・ゲート向けの明細単位の移動機材リスト。
--
-- なぜ v_ido_den2_lst を変えずに新規追加するのか
--   1. v_ido_den2_lst の粒度を直接変えると HT とゲートを同時に切り替える必要が出る。
--      新ビューを足せば、各アプリが自分のタイミングで乗り換えられる。
--   2. v_ido_den2_lst は「一度も保存されていない受注予定を読取アプリに出さない」という
--      要件の防波堤でもある。触らずに残す。
--
--        v_ido_den2_lst        → 機材単位のまま（現行アプリが動き続ける）
--        v_ido_den2_meisai_lst → 明細単位（新規。移行先）
--
-- ★ このビューも t_ido_den 由来にすること（要件6）
--   t_ido_den_juchu は LEFT JOIN で公演名・明細名を取りに行くだけで、行はここからは生えない。
--   「受注で作られただけでまだ移動伝票として保存されていない予定」を読取アプリに流さないため。
--   v_ido_den3_lst（Web専用）が FULL JOIN で未保存行も出すのとは対照的。
--
-- 列構成
--   HT（lib/models/ido_kizai_model.dart）とゲート（Models/IdoDen2Lst.cs）が実際に読んでいる列を
--   全列挙して確認したうえで、それらと表示に要る文脈列、そして受注4列を並べている。
--
--   在庫数（rfid_yard_qty / rfid_kics_qty）・最低数（plan_low_qty）・plan_juchu_qty・
--   kizai_shozoku_* は入れていない。どちらのアプリも読んでおらず、
--   入れると v_kizai_qty との結合が増えてビューが重くなるだけのため。
--   必要になったら足す（末尾に足す分には CREATE OR REPLACE で済む）。
--
--   juchu_flg の意味が v_ido_den2_lst と違う点に注意。
--     v_ido_den2_lst  … 常に 0（v_ido_den_lst が定数で埋めている）
--     このビュー       … その明細に生きている受注があるか（0 なら手動追加行か受注削除後）
--
-- 並び順（§2 の充当順と一致させること）
--   機材まとまり（kizai_grp_cod）→ 機材の表示順（dsp_ord_num）→ 機材id
--   → 受注ヘッダーid → 受注機材ヘッダーid
--   画面・HT・ゲート・DB関数の4箇所でこの順序が一致していないと
--   「読んだタグがどの明細に充当されたか」が見る場所によって食い違う。
--
-- ★ juchu_kizai_head_id は受注内の連番で単独ではユニークではない。
--   t_juchu_kizai_head への JOIN は必ず juchu_head_id とのペアで行うこと。
--
-- 関連: scripts/db-tables/applied/20260924-ido-juchu-meisai.sql
--       段階2（HT・ゲート側の改修）の移行先

DROP VIEW IF EXISTS public.v_ido_den2_meisai_lst;

CREATE VIEW public.v_ido_den2_meisai_lst WITH (security_invoker = on) AS
SELECT
  d.ido_den_id,
  CASE WHEN d.sagyo_kbn_id = 40 THEN 1 WHEN d.sagyo_kbn_id = 50 THEN 2 ELSE NULL::integer END
    AS nyushuko_shubetu_id,
  d.sagyo_kbn_id,
  sk.sagyo_kbn_nam,
  sk.sagyo_kbn_nam_short,
  d.sagyo_siji_id,
  CASE WHEN d.sagyo_siji_id = 1 THEN 'KICS→YARD'::text
       WHEN d.sagyo_siji_id = 2 THEN 'YARD→KICS'::text
       ELSE ''::text END AS sagyo_siji_nam,
  CASE WHEN d.sagyo_siji_id = 1 THEN 'K→Y'::text
       WHEN d.sagyo_siji_id = 2 THEN 'Y→K'::text
       ELSE ''::text END AS sagyo_siji_nam_short,
  d.sagyo_den_dat AS nyushuko_dat,
  d.sagyo_id AS nyushuko_basho_id,
  basho.shozoku_nam,
  d.kizai_id,
  k.kizai_nam,
  k.bld_cod,
  k.tana_cod,
  k.eda_cod,
  k.ctn_flg,
  k.kizai_grp_cod,
  k.dsp_ord_num,
  k.mem AS kizai_mem,
  -- 明細を特定する2列。手動追加行は 0 / 0
  d.juchu_head_id,
  d.juchu_kizai_head_id,
  jh.koen_nam,
  jkh.head_nam,
  CASE WHEN j.kizai_id IS NULL THEN 0 ELSE 1 END AS juchu_flg,
  COALESCE(d.plan_qty, 0)       AS plan_qty,
  COALESCE(d.result_qty, 0)     AS result_qty,
  COALESCE(d.result_adj_qty, 0) AS result_adj_qty,
  (COALESCE(d.result_qty, 0) + COALESCE(d.result_adj_qty, 0) - COALESCE(d.plan_qty, 0)) AS diff_qty
FROM public.t_ido_den d
  LEFT JOIN public.m_kizai k ON k.kizai_id = d.kizai_id
  LEFT JOIN public.m_shozoku basho ON basho.shozoku_id = d.sagyo_id
  LEFT JOIN public.m_sagyo_kbn sk ON sk.sagyo_kbn_id = d.sagyo_kbn_id
  -- 生きている受注が紐づいているか。行はここからは生えない（LEFT JOIN かつ7キーで1:0..1）
  LEFT JOIN (
    SELECT idj.sagyo_kbn_id, idj.sagyo_siji_id, idj.sagyo_den_dat, idj.sagyo_id, idj.kizai_id,
           idj.juchu_head_id, idj.juchu_kizai_head_id
    FROM public.t_ido_den_juchu idj
      JOIN public.t_juchu_head jh0 ON jh0.juchu_head_id = idj.juchu_head_id AND jh0.del_flg = 0
  ) j
    ON  j.sagyo_kbn_id        = d.sagyo_kbn_id
    AND j.sagyo_siji_id       = d.sagyo_siji_id
    AND j.sagyo_den_dat       = d.sagyo_den_dat
    AND j.sagyo_id            = d.sagyo_id
    AND j.kizai_id            = d.kizai_id
    AND j.juchu_head_id       = d.juchu_head_id
    AND j.juchu_kizai_head_id = d.juchu_kizai_head_id
  LEFT JOIN public.t_juchu_head jh ON jh.juchu_head_id = d.juchu_head_id AND jh.del_flg = 0
  -- ★ juchu_kizai_head_id は受注内の連番なので、必ず juchu_head_id とのペアで結合する
  LEFT JOIN public.t_juchu_kizai_head jkh
    ON jkh.juchu_head_id = d.juchu_head_id AND jkh.juchu_kizai_head_id = d.juchu_kizai_head_id
-- 入庫側で予定数0の行は出さない（v_ido_den2_lst と同じ）
WHERE NOT (d.sagyo_kbn_id = 50 AND COALESCE(d.plan_qty, 0) = 0)
ORDER BY
  d.sagyo_den_dat,
  d.sagyo_kbn_id,
  d.sagyo_id,
  k.kizai_grp_cod,
  k.dsp_ord_num,
  d.kizai_id,
  d.juchu_head_id,
  d.juchu_kizai_head_id;

-- 新規ビューなので GRANT が要る（既存の移動系ビューと同じ内容）
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den2_meisai_lst TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den2_meisai_lst TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.v_ido_den2_meisai_lst TO anon;
