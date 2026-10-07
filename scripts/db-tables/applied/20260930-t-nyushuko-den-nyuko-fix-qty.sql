-- 適用状況: ステージング 2026-09-30 / 本番 2026-10-07
--
-- t_nyushuko_den に nyuko_fix_qty（到着で親の入庫伝票から引いたときの読取数）を追加し、既存データを同期する
--
-- なぜ必要か
--   返却の入庫明細で「到着」すると、読取数（読取＋補正）を親（メイン）の入庫伝票の予定数から引き、
--   「到着解除」で戻す。これまでは解除時点の読取数を戻していたため、到着後に追加で読む
--   （予定超過、HT・ゲートが親機材として読む）と、引いていない分まで親に戻り、親の入庫予定が増えていた。
--   また、合体した明細（同じ日時・場所の複数ヘッダー）の一部だけが到着済みのとき、到着し直すと
--   到着済みの分が二重に引かれる。
--   → 到着で実際に引いた基準の読取数を行ごとに記録し、到着は「今回 − 前回」、到着解除は「前回」だけ戻す。
--
-- 使い方（アプリ: app/(main)/nyuko-list/nyuko-detail/.../_lib/funcs.ts）
--   - 到着: 親から (読取＋補正) − coalesce(nyuko_fix_qty, 0) を引き、nyuko_fix_qty = 読取＋補正 にする
--   - 到着解除: 親に nyuko_fix_qty を戻し、nyuko_fix_qty = NULL にする
--   - 返却（受注機材ヘッダー区分 2）の入庫チェック（作業区分 30）の行だけで使う。それ以外は常に NULL
--
-- 影響確認（2026-09-30、ステージング・本番とも）
--   t_nyushuko_den の行型をそのまま使う関数（%rowtype、::t_nyushuko_den）・t_nyushuko_den.* を選ぶビューは無い。
--   HT・ゲートの送信RPCは INSERT で列名を明示しているので影響しない。既存テーブルへの列追加なので GRANT は不要。
--
-- ★ 本番は作業（Web の到着・到着解除、HT・ゲートの送信）を止めた状態で、このファイルを1回だけ流す。
--   止めておけば DDL →（ビュー）→ デプロイの間に旧コードで到着・解除される分がないので、流し直しは要らない。
-- ★ 新コードで到着したあとに 2. の同期SQLを流し直してはいけない。新コードの到着は到着済みヘッダーの行の
--   add_dat も上書きするので「到着後に作られた行」と誤判定され、正しい nyuko_fix_qty が NULL に消える
--   （その後に到着解除しても、その分が親に戻らなくなる）。
--
-- ロールバック: 20260930-t-nyushuko-den-nyuko-fix-qty.rollback.sql

\set ON_ERROR_STOP on

BEGIN;

-- 1. 列の追加 ------------------------------------------------------------------------------------
ALTER TABLE public.t_nyushuko_den ADD COLUMN IF NOT EXISTS nyuko_fix_qty integer;

COMMENT ON COLUMN public.t_nyushuko_den.nyuko_fix_qty IS
  '到着で親の入庫伝票から引いたときの読取数（読取＋補正）。返却の入庫チェックの行のみ。未反映は NULL';

-- 2. 既存データの同期 ------------------------------------------------------------------------------
-- 返却の入庫チェックの行について、
--   到着済み（入庫確定あり）かつ親と紐づいている（dsp_ord_num あり）かつ到着時点で存在していた行
--     → 到着処理で予定数＝読取数に上書きされ、その数が親から引かれているので nyuko_fix_qty = plan_qty
--   それ以外 → NULL
-- 「到着時点で存在していた」は、到着処理が伝票の add_dat を上書きした時刻が確定行の upd_dat 以前であることで判定する
-- （到着後に HT・ゲートの RPC が作った行は add_dat が確定より後になる）。
-- ※この判定は「旧コードで到着したデータ」が前提。新コードで到着したあとに流し直さないこと（冒頭の★）。
update public.t_nyushuko_den d
set
  nyuko_fix_qty = s.new_qty
from (
  select
    d2.juchu_head_id
    ,d2.juchu_kizai_head_id
    ,d2.juchu_kizai_meisai_id
    ,d2.sagyo_kbn_id
    ,d2.sagyo_den_dat
    ,d2.sagyo_id
    ,d2.kizai_id
    ,case
      when d2.dsp_ord_num is not null
        and exists (
          select
            1
          from
            public.t_nyushuko_fix f
          where
            f.juchu_head_id           = d2.juchu_head_id
            and f.juchu_kizai_head_id = d2.juchu_kizai_head_id
            and f.sagyo_kbn_id        = 70
            and f.sagyo_id            = d2.sagyo_id
            and f.sagyo_fix_flg       = 1
            and coalesce(d2.add_dat, '-infinity'::timestamptz) <= coalesce(f.upd_dat, f.add_dat, 'infinity'::timestamptz)
        )
      then d2.plan_qty
      else null
    end as new_qty
  from
    public.t_nyushuko_den d2
    join public.t_juchu_kizai_head h
      on h.juchu_head_id = d2.juchu_head_id
      and h.juchu_kizai_head_id = d2.juchu_kizai_head_id
      and h.juchu_kizai_head_kbn = 2
  where
    d2.sagyo_kbn_id = 30
) s
where
  d.juchu_head_id             = s.juchu_head_id
  and d.juchu_kizai_head_id   = s.juchu_kizai_head_id
  and d.juchu_kizai_meisai_id = s.juchu_kizai_meisai_id
  and d.sagyo_kbn_id          = s.sagyo_kbn_id
  and d.sagyo_den_dat         = s.sagyo_den_dat
  and d.sagyo_id              = s.sagyo_id
  and d.kizai_id              = s.kizai_id
  and d.nyuko_fix_qty is distinct from s.new_qty;

COMMIT;
