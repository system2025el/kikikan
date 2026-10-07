-- 20260924-ido-juchu-meisai.sql のロールバック
--
-- ★ 分割して増えた t_ido_den の行を、元の「1機材1行」に畳み直す。
--   移動数は機材単位で足し戻すので、分割前の値に戻る（適用SQLの検算と対になっている）。
--   読取数・補正数も同様に機材単位で足し戻す。
--
-- ★ ビューと RPC を先に戻しておくこと。
--   v_ido_den3_lst / v_ido_den3_result / v_ido_den2_meisai_lst と
--   ido_send_20260716_1 / rf_ido_send_20251225_1 / el_ido_send_20251225_1 が
--   受注2列を参照している状態でこのSQLを流すと、DROP COLUMN が依存で失敗するか、
--   通っても関数が実行時に落ちる。手順は scripts/db-views/README.md を参照。

\set ON_ERROR_STOP on

BEGIN;

---------------------------------------------------------------------------------------------------
-- 1. 分割した行を機材単位に畳み直す
---------------------------------------------------------------------------------------------------
CREATE TEMPORARY TABLE _rb_ido_den_merge ON COMMIT DROP AS
SELECT
  ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id,
  sum(COALESCE(plan_qty, 0))       AS plan_qty,
  sum(COALESCE(result_qty, 0))     AS result_qty,
  sum(COALESCE(result_adj_qty, 0)) AS result_adj_qty,
  min(juchu_head_id)               AS keep_juchu_head_id,
  min(juchu_kizai_head_id)         AS keep_juchu_kizai_head_id
FROM public.t_ido_den
GROUP BY 1, 2, 3, 4, 5, 6
HAVING count(*) > 1;

-- 残す1行（受注2列が最小のもの）に合計を書き戻す
UPDATE public.t_ido_den d
SET plan_qty       = m.plan_qty,
    result_qty     = m.result_qty,
    result_adj_qty = m.result_adj_qty
FROM _rb_ido_den_merge m
WHERE d.ido_den_id          = m.ido_den_id
  AND d.sagyo_kbn_id        = m.sagyo_kbn_id
  AND d.sagyo_siji_id       = m.sagyo_siji_id
  AND d.sagyo_den_dat       = m.sagyo_den_dat
  AND d.sagyo_id            = m.sagyo_id
  AND d.kizai_id            = m.kizai_id
  AND d.juchu_head_id       = m.keep_juchu_head_id
  AND d.juchu_kizai_head_id = m.keep_juchu_kizai_head_id;

-- 残り（2件目以降）を削除
DELETE FROM public.t_ido_den d
USING _rb_ido_den_merge m
WHERE d.ido_den_id    = m.ido_den_id
  AND d.sagyo_kbn_id  = m.sagyo_kbn_id
  AND d.sagyo_siji_id = m.sagyo_siji_id
  AND d.sagyo_den_dat = m.sagyo_den_dat
  AND d.sagyo_id      = m.sagyo_id
  AND d.kizai_id      = m.kizai_id
  AND (d.juchu_head_id, d.juchu_kizai_head_id)
      IS DISTINCT FROM (m.keep_juchu_head_id, m.keep_juchu_kizai_head_id);

---------------------------------------------------------------------------------------------------
-- 2. 主キーを元に戻す
---------------------------------------------------------------------------------------------------
ALTER TABLE public.t_ido_den DROP CONSTRAINT t_ido_den_pkey;
ALTER TABLE public.t_ido_den ADD CONSTRAINT t_ido_den_pkey PRIMARY KEY (
  ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id
);

---------------------------------------------------------------------------------------------------
-- 3. 列を落とす
---------------------------------------------------------------------------------------------------
ALTER TABLE public.t_ido_den
  DROP COLUMN IF EXISTS juchu_head_id,
  DROP COLUMN IF EXISTS juchu_kizai_head_id;

ALTER TABLE public.t_ido_result
  DROP COLUMN IF EXISTS juchu_head_id,
  DROP COLUMN IF EXISTS juchu_kizai_head_id;

ALTER TABLE public.t_ido_ctn_result
  DROP COLUMN IF EXISTS juchu_head_id,
  DROP COLUMN IF EXISTS juchu_kizai_head_id;

COMMIT;
