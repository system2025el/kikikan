-- 適用状況: ステージング 未適用 / 本番 未適用
--
-- 返却・キープの入庫伝票で dsp_ord_num が NULL になっている行を、親の伝票の値で埋める（データ補正）
--
-- なぜ必要か
--   20260930-ht-nyushuko-send-dsp.sql より前の HT の送信RPC は、返却・キープの入庫チェックで
--   dsp_ord_num を入れていなかった。HT が親機材として読んだタグの伝票行は、明細ID＝親の明細ID、
--   dsp_ord_num＝NULL で作られており、Web の到着・到着解除で親の入庫伝票と紐づかない。
--
-- 対象（すべて満たす行）
--   - 作業区分 30（入庫チェック）で dsp_ord_num が NULL
--   - 受注機材ヘッダーが子（oya_juchu_kizai_head_id あり）
--   - 親の伝票に「同じ明細ID・同じ機材」の行があり、その dsp_ord_num が1つに決まる
--   - **到着していない**（t_nyushuko_fix に入庫確定 sagyo_kbn_id = 70 が無い受注機材ヘッダー・作業場所）
--     到着済みの行は、到着時に親から数量が引かれていない。ここで紐づけると、到着解除のときに
--     引いていない数量が親に戻され、親の入庫予定が増えてしまうため、対象外にする。
--
-- ⚠️ 注意
--   親と「明細ID・機材」が一致することを HT の行の目印にしている。ゲートで作られた行（明細IDは RPC が採番）が
--   たまたま親の同じ機材の明細IDと一致すると、その親の行に紐づく（同じ機材の親の行ではある）。
--   流す前に 1. の SELECT で対象を確認すること。
--
-- 使い方
--   1. 対象の確認（SELECT のみ）を流し、件数と内容を確認する
--   2. 問題なければ 2. の UPDATE を流す。RETURNING の結果（更新した行のキー）を保存しておく（ロールバックに使う）
--
-- ロールバック: 20260930-nyushuko-den-dsp-backfill.rollback.sql（2. の RETURNING で保存したキーを貼って流す）

\set ON_ERROR_STOP on

-- 1. 対象の確認 --------------------------------------------------------------------------------
with target as (
  select
    c.juchu_head_id
    ,c.juchu_kizai_head_id
    ,c.juchu_kizai_meisai_id
    ,c.sagyo_kbn_id
    ,c.sagyo_den_dat
    ,c.sagyo_id
    ,c.kizai_id
    ,h.oya_juchu_kizai_head_id
    ,(
      select
        min(p.dsp_ord_num)
      from
        public.t_nyushuko_den p
      where
        p.juchu_head_id           = c.juchu_head_id
        and p.juchu_kizai_head_id = h.oya_juchu_kizai_head_id
        and p.juchu_kizai_meisai_id = c.juchu_kizai_meisai_id
        and p.kizai_id            = c.kizai_id
        and p.dsp_ord_num is not null
      having
        count(distinct p.dsp_ord_num) = 1
    ) as oya_dsp_ord_num
  from
    public.t_nyushuko_den c
    join public.t_juchu_kizai_head h
      on h.juchu_head_id = c.juchu_head_id
      and h.juchu_kizai_head_id = c.juchu_kizai_head_id
      and h.oya_juchu_kizai_head_id is not null
  where
    c.sagyo_kbn_id = 30
    and c.dsp_ord_num is null
    and not exists (
      select
        1
      from
        public.t_nyushuko_fix f
      where
        f.juchu_head_id           = c.juchu_head_id
        and f.juchu_kizai_head_id = c.juchu_kizai_head_id
        and f.sagyo_kbn_id        = 70
        and f.sagyo_id            = c.sagyo_id
    )
)
select
  *
from
  target
where
  oya_dsp_ord_num is not null
order by
  juchu_head_id
  ,juchu_kizai_head_id
  ,juchu_kizai_meisai_id
  ,kizai_id;

-- 2. 更新 ---------------------------------------------------------------------------------------
BEGIN;

update public.t_nyushuko_den c
set
  dsp_ord_num = t.oya_dsp_ord_num
from (
  select
    c2.juchu_head_id
    ,c2.juchu_kizai_head_id
    ,c2.juchu_kizai_meisai_id
    ,c2.sagyo_kbn_id
    ,c2.sagyo_den_dat
    ,c2.sagyo_id
    ,c2.kizai_id
    ,(
      select
        min(p.dsp_ord_num)
      from
        public.t_nyushuko_den p
      where
        p.juchu_head_id           = c2.juchu_head_id
        and p.juchu_kizai_head_id = h.oya_juchu_kizai_head_id
        and p.juchu_kizai_meisai_id = c2.juchu_kizai_meisai_id
        and p.kizai_id            = c2.kizai_id
        and p.dsp_ord_num is not null
      having
        count(distinct p.dsp_ord_num) = 1
    ) as oya_dsp_ord_num
  from
    public.t_nyushuko_den c2
    join public.t_juchu_kizai_head h
      on h.juchu_head_id = c2.juchu_head_id
      and h.juchu_kizai_head_id = c2.juchu_kizai_head_id
      and h.oya_juchu_kizai_head_id is not null
  where
    c2.sagyo_kbn_id = 30
    and c2.dsp_ord_num is null
    and not exists (
      select
        1
      from
        public.t_nyushuko_fix f
      where
        f.juchu_head_id           = c2.juchu_head_id
        and f.juchu_kizai_head_id = c2.juchu_kizai_head_id
        and f.sagyo_kbn_id        = 70
        and f.sagyo_id            = c2.sagyo_id
    )
) t
where
  t.oya_dsp_ord_num is not null
  and c.juchu_head_id           = t.juchu_head_id
  and c.juchu_kizai_head_id     = t.juchu_kizai_head_id
  and c.juchu_kizai_meisai_id   = t.juchu_kizai_meisai_id
  and c.sagyo_kbn_id            = t.sagyo_kbn_id
  and c.sagyo_den_dat           = t.sagyo_den_dat
  and c.sagyo_id                = t.sagyo_id
  and c.kizai_id                = t.kizai_id
returning
  c.juchu_head_id
  ,c.juchu_kizai_head_id
  ,c.juchu_kizai_meisai_id
  ,c.sagyo_kbn_id
  ,c.sagyo_den_dat
  ,c.sagyo_id
  ,c.kizai_id
  ,c.dsp_ord_num;

COMMIT;
