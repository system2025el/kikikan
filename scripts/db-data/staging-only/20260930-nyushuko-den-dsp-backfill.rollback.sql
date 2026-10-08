-- 20260930-nyushuko-den-dsp-backfill.sql のロールバック
--
-- 補正で dsp_ord_num を埋めた行を NULL に戻す。
-- 補正の 2. の UPDATE の RETURNING で保存したキーを、下の values に貼ってから流すこと
-- （補正後は「補正で埋めた行」と「もともと値があった行」を区別できないため、キーの保存が必須）。
--
-- ⚠️ 補正後に到着・到着解除した行を NULL に戻すと、親の入庫予定と合わなくなる。
--    戻す前に、対象の返却・キープが到着していないことを確認すること。

\set ON_ERROR_STOP on

BEGIN;

update public.t_nyushuko_den c
set
  dsp_ord_num = null
from (
  values
    -- (juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, sagyo_kbn_id, sagyo_den_dat, sagyo_id, kizai_id)
    -- 例: (91019, 7, 35, 30, '2026-08-09 15:00:00+00'::timestamptz, 2, 1682)
    (null::int, null::int, null::int, null::int, null::timestamptz, null::int, null::int)
) as k (juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, sagyo_kbn_id, sagyo_den_dat, sagyo_id, kizai_id)
where
  c.juchu_head_id             = k.juchu_head_id
  and c.juchu_kizai_head_id   = k.juchu_kizai_head_id
  and c.juchu_kizai_meisai_id = k.juchu_kizai_meisai_id
  and c.sagyo_kbn_id          = k.sagyo_kbn_id
  and c.sagyo_den_dat         = k.sagyo_den_dat
  and c.sagyo_id              = k.sagyo_id
  and c.kizai_id              = k.kizai_id;

COMMIT;
