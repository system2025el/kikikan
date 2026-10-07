-- 適用状況: ステージング 2026-09-24 / 本番 2026-10-07
--
-- 移動明細画面（Web専用）を機材単位から「受注機材ヘッダー単位」にする。
--
-- 変更内容
--   1行 = 1機材 だったものを 1行 = 1受注機材ヘッダー にする。同じ機材が複数の公演に
--   紐づく場合は行が分かれ、公演名・明細名・移動予定数・移動数・読取数がそれぞれに付く。
--   受注に紐づかない手動追加行は juchu_head_id = 0 の1行だけ（重複なし）。
--
--   列の変更（32列 → 37列）
--     削除: juchu_meisai（jsonb）… 行が分かれるので内訳をJSONで持つ必要がなくなった
--     追加: juchu_head_id, juchu_kizai_head_id, koen_nam, head_nam
--           kizai_grp_cod, dsp_ord_num … 並び順に使う。アプリが .order() で指定するので、
--           ビューの ORDER BY に入れるだけでなく列としても出す必要がある
--     意味が変わる: plan_juchu_qty（機材合計 → その明細の受注予定数）
--                   ido_den_id（定数1/NULL → 実際の伝票id。ido_flg で代用されていて誰も見ていなかった）
--
--   ★ 列構成が変わるので CREATE OR REPLACE では置き換えられない。DROP して作り直す。
--     依存する子ビューは0件（pg_depend で確認済み）。読んでいるのは Web だけ。
--     DROP で権限が落ちるので末尾で GRANT を付け直している。
--
-- 構造を組み替えた理由
--   旧定義は v_ido_den2_union_lst（= v_ido_den2_lst ∪ v_ido_den2_juchu_lst）を集約していたが、
--   この中間ビュー群は DISTINCT と GROUP BY で機材単位に潰す作りで、明細単位の行を取り出せない。
--   また v_ido_den_lst 以降は HT・ゲートが読む系統で、粒度を変えられない（要件6の防波堤）。
--   そこで Web 専用のこのビューだけ t_ido_den と t_ido_den_juchu から直接組み立てる。
--
--   t_ido_den ⟗ t_ido_den_juchu（受注7キーの FULL JOIN）で3通りが出る
--     両方あり   … 通常。保存済みで受注にも紐づいている（ido_flg=1 / juchu_flg=1）
--     伝票のみ   … 手動追加（juchu_head_id=0）または受注削除後（ido_flg=1 / juchu_flg=0）
--     受注のみ   … 未保存。移動画面で一度も保存していない受注予定（ido_flg=0 / juchu_flg=1）
--
-- 在庫数・最低数は現状のまま（機材単位）
--   rfid_yard_qty / rfid_kics_qty / plan_low_qty は機材単位で求めた同じ値を各明細行に繰り返す。
--   在庫は機材単位でプールされており、明細に配分する業務的根拠がないため（配分順で警告先が変わる）。
--   計算式も旧定義と同一（受注予定数の機材合計 − 移動先の所属数、0で丸め）。
--
-- 並び順（§2 の充当順と一致させること）
--   機材まとまり（kizai_grp_cod）→ 機材の表示順（dsp_ord_num）→ 機材id
--   → 受注ヘッダーid → 受注機材ヘッダーid
--   画面・HT・ゲート・DB関数の4箇所でこの順序が一致していないと「どの明細が完了か」が食い違う。
--   タイブレークに受注2列を入れているのは、実行計画次第で順序が変わるのを防ぐため。
--   アプリ側（v-ido-den3-lst.ts）でも同じ並びを明示している（ビューの ORDER BY に依存しきらない）。
--
-- 注意点
--   ★ juchu_kizai_head_id は単独ではユニークではない（受注内の連番）。
--     t_juchu_kizai_head への JOIN は必ず juchu_head_id とのペアで行うこと。
--     片方だけだと巨大なカーテシアン積になる。
--   ★ WHERE NOT (sagyo_kbn_id = 50 AND plan_qty = 0) は NULL セーフにすること。
--     FULL JOIN で「受注のみ」の行を作ると t_ido_den 側が NULL になるため、
--     素朴に書くと NOT (true AND NULL) → NULL となり入庫側の行が黙って消える。
--     下では COALESCE 済みの den.plan_qty を参照しているので NULL にならない。
--   ★ 未保存行（ido_flg = 0）の plan_qty には受注予定数を入れる。
--     旧定義（v_ido_den2_juchu_lst）と同じ挙動で、画面の移動数欄に受注予定数が初期表示される。
--
-- 旧定義との差（ステージング実測。これ以外の差は0）
--   上の除外条件が機材単位から明細単位に変わるため、入庫(50)側で「移動数0の明細」が
--   行ごと消える。該当は30明細行・11機材で、その分だけ機材で足し戻した plan_juchu_qty が
--   旧より小さくなる（44 → 27）。運ばない明細を入庫画面に出さないのは意図どおりで、
--   そもそも入庫画面（NyukoIdoDenTable）は plan_juchu_qty を表示していない。
--   出庫(40)側は機材単位に畳めば旧定義と完全一致する。
--
-- 検証（ステージング）
--   機材単位に畳んで旧定義と比較し、plan_juchu_qty 以外の全列で差分0・機材数不変を確認済み。
--   行数 10,598 → 11,214（明細に分かれた分）。
--
-- 関連: app/_lib/db/tables/v-ido-den3-lst.ts / ido-list の移動明細画面
--       scripts/db-migration/ddl/20260924-ido-juchu-meisai.sql

DROP VIEW IF EXISTS public.v_ido_den3_lst;

CREATE VIEW public.v_ido_den3_lst WITH (security_invoker = on) AS
WITH juchu AS (
  -- 受注側（参考値）。削除済み受注は除く。この条件が juchu_flg の意味を決めている
  SELECT
    idj.sagyo_kbn_id, idj.sagyo_siji_id, idj.sagyo_den_dat, idj.sagyo_id, idj.kizai_id,
    idj.juchu_head_id, idj.juchu_kizai_head_id,
    COALESCE(idj.plan_qty, 0) AS plan_juchu_qty
  FROM public.t_ido_den_juchu idj
    JOIN public.t_juchu_head jh ON jh.juchu_head_id = idj.juchu_head_id AND jh.del_flg = 0
),
kizai_juchu AS (
  -- 最低数の計算に使う「機材単位の受注予定数合計」
  SELECT sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id,
         sum(plan_juchu_qty)::integer AS plan_juchu_total
  FROM juchu
  GROUP BY 1, 2, 3, 4, 5
),
den AS (
  SELECT
    d.ido_den_id,
    CASE WHEN d.kizai_id IS NULL THEN 0 ELSE 1 END AS ido_flg,
    CASE WHEN j.kizai_id IS NULL THEN 0 ELSE 1 END AS juchu_flg,
    COALESCE(d.sagyo_kbn_id,  j.sagyo_kbn_id)  AS sagyo_kbn_id,
    COALESCE(d.sagyo_siji_id, j.sagyo_siji_id) AS sagyo_siji_id,
    COALESCE(d.sagyo_den_dat, j.sagyo_den_dat) AS nyushuko_dat,
    COALESCE(d.sagyo_id,      j.sagyo_id)      AS nyushuko_basho_id,
    COALESCE(d.kizai_id,      j.kizai_id)      AS kizai_id,
    COALESCE(d.juchu_head_id,       j.juchu_head_id)       AS juchu_head_id,
    COALESCE(d.juchu_kizai_head_id, j.juchu_kizai_head_id) AS juchu_kizai_head_id,
    COALESCE(j.plan_juchu_qty, 0) AS plan_juchu_qty,
    -- 未保存（受注のみ）の行は移動数の初期値として受注予定数を出す
    CASE WHEN d.kizai_id IS NULL THEN COALESCE(j.plan_juchu_qty, 0) ELSE COALESCE(d.plan_qty, 0) END AS plan_qty,
    COALESCE(d.result_qty, 0)     AS result_qty,
    COALESCE(d.result_adj_qty, 0) AS result_adj_qty
  FROM public.t_ido_den d
    FULL JOIN juchu j
      ON  j.sagyo_kbn_id        = d.sagyo_kbn_id
      AND j.sagyo_siji_id       = d.sagyo_siji_id
      AND j.sagyo_den_dat       = d.sagyo_den_dat
      AND j.sagyo_id            = d.sagyo_id
      AND j.kizai_id            = d.kizai_id
      AND j.juchu_head_id       = d.juchu_head_id
      AND j.juchu_kizai_head_id = d.juchu_kizai_head_id
)
SELECT
  den.ido_den_id,
  den.ido_flg,
  den.juchu_flg,
  CASE WHEN den.sagyo_kbn_id = 40 THEN 1 WHEN den.sagyo_kbn_id = 50 THEN 2 ELSE NULL::integer END
    AS nyushuko_shubetu_id,
  den.sagyo_kbn_id,
  sk.sagyo_kbn_nam,
  sk.sagyo_kbn_nam_short,
  den.sagyo_siji_id,
  CASE WHEN den.sagyo_siji_id = 1 THEN 'KICS→YARD'::text
       WHEN den.sagyo_siji_id = 2 THEN 'YARD→KICS'::text
       ELSE ''::text END AS sagyo_siji_nam,
  CASE WHEN den.sagyo_siji_id = 1 THEN 'K→Y'::text
       WHEN den.sagyo_siji_id = 2 THEN 'Y→K'::text
       ELSE ''::text END AS sagyo_siji_nam_short,
  den.nyushuko_dat,
  den.nyushuko_basho_id,
  basho.shozoku_nam,
  den.kizai_id,
  k.kizai_nam,
  k.bld_cod,
  k.tana_cod,
  k.eda_cod,
  k.ctn_flg,
  -- 並び順に使う。アプリ側が .order() で指定するのでビューに載せておく必要がある
  k.kizai_grp_cod,
  k.dsp_ord_num,
  k.mem AS kizai_mem,
  kq.shozoku_id AS kizai_shozoku_id,
  ks.shozoku_nam AS kizai_shozoku_nam,
  ks.shozoku_nam_short AS kizai_shozoku_nam_short,
  kq.rfid_yard_qty,
  kq.rfid_kics_qty,
  -- 明細を特定する2列。手動追加行は 0 / 0
  den.juchu_head_id,
  den.juchu_kizai_head_id,
  jh.koen_nam,
  jkh.head_nam,
  -- その明細の受注予定数（旧定義では機材合計だった）
  den.plan_juchu_qty,
  -- 最低数。機材単位のまま（§6-4）。移動先の在庫は siji=1 なら YARD、siji=2 なら KICS
  greatest(0, CASE
    WHEN den.sagyo_siji_id = 1 THEN COALESCE(kj.plan_juchu_total, 0) - COALESCE(kq.rfid_yard_qty, 0)::integer
    WHEN den.sagyo_siji_id = 2 THEN COALESCE(kj.plan_juchu_total, 0) - COALESCE(kq.rfid_kics_qty, 0)::integer
    ELSE 0
  END) AS plan_low_qty,
  den.plan_qty,
  den.result_qty,
  den.result_adj_qty,
  (den.result_qty + den.result_adj_qty - den.plan_qty) AS diff_qty
FROM den
  LEFT JOIN public.m_kizai k ON k.kizai_id = den.kizai_id
  LEFT JOIN public.m_shozoku basho ON basho.shozoku_id = den.nyushuko_basho_id
  LEFT JOIN public.m_sagyo_kbn sk ON sk.sagyo_kbn_id = den.sagyo_kbn_id
  LEFT JOIN public.v_kizai_qty kq ON kq.kizai_id = den.kizai_id
  LEFT JOIN public.m_shozoku ks ON ks.shozoku_id = kq.shozoku_id
  LEFT JOIN public.t_juchu_head jh ON jh.juchu_head_id = den.juchu_head_id AND jh.del_flg = 0
  -- ★ juchu_kizai_head_id は受注内の連番なので、必ず juchu_head_id とのペアで結合する
  LEFT JOIN public.t_juchu_kizai_head jkh
    ON jkh.juchu_head_id = den.juchu_head_id AND jkh.juchu_kizai_head_id = den.juchu_kizai_head_id
  LEFT JOIN kizai_juchu kj
    ON  kj.sagyo_kbn_id  = den.sagyo_kbn_id
    AND kj.sagyo_siji_id = den.sagyo_siji_id
    AND kj.sagyo_den_dat = den.nyushuko_dat
    AND kj.sagyo_id      = den.nyushuko_basho_id
    AND kj.kizai_id      = den.kizai_id
-- 入庫側で予定数0の行は出さない（旧定義と同じ）。den.plan_qty は COALESCE 済みなので NULL にならない
WHERE NOT (den.sagyo_kbn_id = 50 AND den.plan_qty = 0)
ORDER BY
  den.nyushuko_dat,
  den.sagyo_kbn_id,
  den.nyushuko_basho_id,
  k.kizai_grp_cod,
  k.dsp_ord_num,
  den.kizai_id,
  den.juchu_head_id,
  den.juchu_kizai_head_id;

-- DROP で権限が落ちるので付け直す（既存ビューと同じ内容）
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_lst TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.v_ido_den3_lst TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.v_ido_den3_lst TO anon;
