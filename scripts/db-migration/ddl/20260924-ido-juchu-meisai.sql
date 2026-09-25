-- 適用状況: ステージング 2026-09-24 / 本番 YYYY-MM-DD
--
-- 移動を受注機材ヘッダー単位にする（段階1のDB変更）
--
-- 変更内容
--   1. t_ido_den / t_ido_result / t_ido_ctn_result に juchu_head_id / juchu_kizai_head_id を追加
--   2. t_ido_den の主キーに上記2列を含める（1機材1行 → 1機材ヘッダー1行）
--   3. 既存データに受注2列を埋める（複数明細にぶら下がる行は分割）
--
-- ★ ido_den_id は「1機材に1つ」を維持する
--   分割して増えた行は元の行と同じ ido_den_id を共有する。明細ごとに採番しない。
--   ゲート（Models/IdoDen2Lst.cs）が v_ido_den2_lst.ido_den_id を読んで実績送信時に送り返し、
--   RPC がそれで t_ido_den を引き当てているため、機材単位のIDでなければ読取が伝票に反映されない。
--   あわせて v_ido_den_lst が GROUP BY ido_den_id, 5キー… で集約しているので、
--   IDを共有していれば同ビューは無改修のまま機材単位を保てる（HT・ゲートへの防波堤）。
--
-- GRANT について
--   列追加なので不要。t_ido_den / t_ido_result / t_ido_ctn_result はいずれもテーブルレベルの
--   GRANT のみで列レベルACL（pg_attribute.attacl）は0件のため、新しい列にもそのまま効く。
--   RLS は既存どおり無効のまま（ポリシーは休眠状態で存在するが relrowsecurity = false）。
--
-- 対象スキーマ
--   public のみ。dev6 / dev7 / dev7_org / dev8 / public_org0212 にも同名テーブルがあるが、
--   アプリ（app/_lib/db/schema.ts の SCHEMA）は public を向いているので触らない。
--
-- 想定される行数の変化（ステージング実測）
--   t_ido_den 3,832 → 3,996（+164）。内訳は 受注なし1,368 / 明細1件2,314 / 複数150（→314）
--   t_ido_result 12,721 タグ（行数は変わらない。受注なし12,330 / 1件377 / 複数14）
--   t_ido_ctn_result 10 行
--
-- 関連: scripts/db-views/ の v_ido_den3_lst / v_ido_den3_result / v_ido_den2_meisai_lst
--       と RPC ido_send_20260716_1 / rf_ido_send_20251225_1 / el_ido_send_20251225_1

\set ON_ERROR_STOP on

BEGIN;

---------------------------------------------------------------------------------------------------
-- 1. 列追加
---------------------------------------------------------------------------------------------------
-- PG11以降は DEFAULT 付きの列追加もメタデータのみで完了する（全行の書き換えは起きない）
ALTER TABLE public.t_ido_den
  ADD COLUMN IF NOT EXISTS juchu_head_id       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS juchu_kizai_head_id integer NOT NULL DEFAULT 0;

ALTER TABLE public.t_ido_result
  ADD COLUMN IF NOT EXISTS juchu_head_id       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS juchu_kizai_head_id integer NOT NULL DEFAULT 0;

ALTER TABLE public.t_ido_ctn_result
  ADD COLUMN IF NOT EXISTS juchu_head_id       integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS juchu_kizai_head_id integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.t_ido_den.juchu_head_id IS
  '受注ヘッダーid。受注に紐づかない手動追加行は 0（センチネル。主キーにNULLは入れられないため）';
COMMENT ON COLUMN public.t_ido_den.juchu_kizai_head_id IS
  '受注機材ヘッダーid。juchu_head_id とのペアで一意。手動追加行は 0';
COMMENT ON COLUMN public.t_ido_result.juchu_head_id IS
  'そのタグがどの公演のものかを表す受注ヘッダーid。予定外に読まれたタグは 0';
COMMENT ON COLUMN public.t_ido_result.juchu_kizai_head_id IS
  'そのタグがどの明細のものかを表す受注機材ヘッダーid。予定外に読まれたタグは 0';
COMMENT ON COLUMN public.t_ido_ctn_result.juchu_head_id IS
  'そのタグがどの公演のものかを表す受注ヘッダーid。予定外に読まれたタグは 0';
COMMENT ON COLUMN public.t_ido_ctn_result.juchu_kizai_head_id IS
  'そのタグがどの明細のものかを表す受注機材ヘッダーid。予定外に読まれたタグは 0';

---------------------------------------------------------------------------------------------------
-- 2. t_ido_den の主キー張り替え
---------------------------------------------------------------------------------------------------
-- 先に張り替えないと、次の分割INSERTが旧主キー（受注2列なし）に弾かれる
ALTER TABLE public.t_ido_den DROP CONSTRAINT t_ido_den_pkey;
ALTER TABLE public.t_ido_den ADD CONSTRAINT t_ido_den_pkey PRIMARY KEY (
  ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id,
  juchu_head_id, juchu_kizai_head_id
);

-- t_ido_result / t_ido_ctn_result の主キーは変えない。
-- タグ1本は1つの明細にしか属さないので受注2列は非キーでよい
-- （出庫の t_nyushuko_result が juchu_kizai_head_id を非キー列で持っているのと同じ作法）。

---------------------------------------------------------------------------------------------------
-- 3-1. t_ido_den に受注2列を埋める（複数明細の行は分割）
---------------------------------------------------------------------------------------------------
-- 充当順は「受注ヘッダーid → 受注機材ヘッダーid」。同一機材内なので機材の並び順は効かず、
-- この2列だけで決定的に決まる。各明細に「受注予定数」を上限として順に移動数を割り当て、
-- 割り当てきれなかった余り（移動数が受注予定合計を上回る場合）は先頭明細に寄せる。
CREATE TEMPORARY TABLE _mig_ido_den_alloc ON COMMIT DROP AS
WITH base AS (
  SELECT
    d.ido_den_id, d.sagyo_kbn_id, d.sagyo_siji_id, d.sagyo_den_dat, d.sagyo_id, d.kizai_id,
    COALESCE(d.plan_qty, 0) AS den_plan_qty,
    d.add_dat, d.add_user, d.upd_dat, d.upd_user,
    j.juchu_head_id, j.juchu_kizai_head_id,
    COALESCE(j.plan_qty, 0) AS juchu_plan_qty
  FROM public.t_ido_den d
    JOIN public.t_ido_den_juchu j
      ON  j.sagyo_kbn_id  = d.sagyo_kbn_id
      AND j.sagyo_siji_id = d.sagyo_siji_id
      AND j.sagyo_den_dat = d.sagyo_den_dat
      AND j.sagyo_id      = d.sagyo_id
      AND j.kizai_id      = d.kizai_id
    -- 削除済み受注は紐づけない。v_ido_den_juchu_lst / juchu_flg と同じ条件
    JOIN public.t_juchu_head h ON h.juchu_head_id = j.juchu_head_id AND h.del_flg = 0
  WHERE d.juchu_head_id = 0 AND d.juchu_kizai_head_id = 0
),
num AS (
  SELECT b.*,
    row_number() over w AS rn,
    count(*) over (PARTITION BY ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id)
      AS meisai_cnt,
    COALESCE(sum(juchu_plan_qty) over (w ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0)
      AS prev_cum
  FROM base b
  WINDOW w AS (
    PARTITION BY ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id
    ORDER BY juchu_head_id, juchu_kizai_head_id
  )
),
filled AS (
  SELECT n.*,
    greatest(0, least(juchu_plan_qty, den_plan_qty - prev_cum)) AS alloc_plan
  FROM num n
)
SELECT f.*,
  f.alloc_plan
    + CASE WHEN f.rn = 1
           THEN greatest(0, f.den_plan_qty - sum(f.alloc_plan) over (
                  PARTITION BY f.ido_den_id, f.sagyo_kbn_id, f.sagyo_siji_id,
                               f.sagyo_den_dat, f.sagyo_id, f.kizai_id))
           ELSE 0 END AS new_plan_qty
FROM filled f;

-- 先頭明細は既存行を書き換える（実績・監査列はそのまま残す）
UPDATE public.t_ido_den d
SET juchu_head_id       = a.juchu_head_id,
    juchu_kizai_head_id = a.juchu_kizai_head_id,
    plan_qty            = a.new_plan_qty
FROM _mig_ido_den_alloc a
WHERE a.rn = 1
  AND d.ido_den_id    = a.ido_den_id
  AND d.sagyo_kbn_id  = a.sagyo_kbn_id
  AND d.sagyo_siji_id = a.sagyo_siji_id
  AND d.sagyo_den_dat = a.sagyo_den_dat
  AND d.sagyo_id      = a.sagyo_id
  AND d.kizai_id      = a.kizai_id
  AND d.juchu_head_id = 0
  AND d.juchu_kizai_head_id = 0;

-- 2件目以降は行を足す。実績は下の 3-3 でタグから数え直すのでここでは 0 で作る
INSERT INTO public.t_ido_den (
  ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id,
  juchu_head_id, juchu_kizai_head_id, plan_qty, result_qty, result_adj_qty,
  add_dat, add_user, upd_dat, upd_user
)
SELECT
  a.ido_den_id, a.sagyo_kbn_id, a.sagyo_siji_id, a.sagyo_den_dat, a.sagyo_id, a.kizai_id,
  a.juchu_head_id, a.juchu_kizai_head_id, a.new_plan_qty, 0, 0,
  a.add_dat, a.add_user, a.upd_dat, a.upd_user
FROM _mig_ido_den_alloc a
WHERE a.rn > 1;

---------------------------------------------------------------------------------------------------
-- 3-2. t_ido_result / t_ido_ctn_result のタグに受注2列を埋める
---------------------------------------------------------------------------------------------------
-- 明細が1件しかない機材は、そのタグは全部その明細のもの。容量（移動数）は見ない
--   → 既存の読取数・差異の表示が変わらない
-- 明細が複数ある機材は、読んだ順（upd_dat → タグid）に移動数の枠へ順に詰める。
--   枠からあふれたタグは 0/0（予定外）のまま。これは §3 の実行時の充当ルールと同じ
CREATE TEMPORARY TABLE _mig_den_slot ON COMMIT DROP AS
SELECT
  ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id,
  juchu_head_id, juchu_kizai_head_id,
  COALESCE(plan_qty, 0) AS plan_qty,
  count(*) over (PARTITION BY ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id)
    AS meisai_cnt,
  COALESCE(sum(COALESCE(plan_qty, 0)) over (w ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING), 0)
    AS prev_cum
FROM public.t_ido_den
WHERE juchu_head_id <> 0
WINDOW w AS (
  PARTITION BY ido_den_id, sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id
  ORDER BY juchu_head_id, juchu_kizai_head_id
);

UPDATE public.t_ido_result r
SET juchu_head_id = s.juchu_head_id, juchu_kizai_head_id = s.juchu_kizai_head_id
FROM (
  SELECT t.rfid_tag_id, t.ido_den_id, t.sagyo_kbn_id, t.sagyo_siji_id, t.sagyo_den_dat,
         t.sagyo_id, t.kizai_id, d.juchu_head_id, d.juchu_kizai_head_id
  FROM (
    SELECT x.*,
      row_number() over (
        PARTITION BY x.ido_den_id, x.sagyo_kbn_id, x.sagyo_siji_id, x.sagyo_den_dat, x.sagyo_id, x.kizai_id
        ORDER BY x.upd_dat, x.rfid_tag_id
      ) AS seq
    FROM public.t_ido_result x
  ) t
    JOIN _mig_den_slot d
      ON  d.ido_den_id    = t.ido_den_id
      AND d.sagyo_kbn_id  = t.sagyo_kbn_id
      AND d.sagyo_siji_id = t.sagyo_siji_id
      AND d.sagyo_den_dat = t.sagyo_den_dat
      AND d.sagyo_id      = t.sagyo_id
      AND d.kizai_id      = t.kizai_id
      AND (
        d.meisai_cnt = 1
        OR (t.seq > d.prev_cum AND t.seq <= d.prev_cum + d.plan_qty)
      )
) s
WHERE r.rfid_tag_id    = s.rfid_tag_id
  AND r.ido_den_id     = s.ido_den_id
  AND r.sagyo_kbn_id   = s.sagyo_kbn_id
  AND r.sagyo_siji_id  = s.sagyo_siji_id
  AND r.sagyo_den_dat  = s.sagyo_den_dat
  AND r.sagyo_id       = s.sagyo_id
  AND r.kizai_id       = s.kizai_id;

UPDATE public.t_ido_ctn_result r
SET juchu_head_id = s.juchu_head_id, juchu_kizai_head_id = s.juchu_kizai_head_id
FROM (
  SELECT t.rfid_tag_id, t.ido_den_id, t.sagyo_kbn_id, t.sagyo_siji_id, t.sagyo_den_dat,
         t.sagyo_id, t.kizai_id, d.juchu_head_id, d.juchu_kizai_head_id
  FROM (
    SELECT x.*,
      row_number() over (
        PARTITION BY x.ido_den_id, x.sagyo_kbn_id, x.sagyo_siji_id, x.sagyo_den_dat, x.sagyo_id, x.kizai_id
        ORDER BY x.upd_dat, x.rfid_tag_id
      ) AS seq
    FROM public.t_ido_ctn_result x
  ) t
    JOIN _mig_den_slot d
      ON  d.ido_den_id    = t.ido_den_id
      AND d.sagyo_kbn_id  = t.sagyo_kbn_id
      AND d.sagyo_siji_id = t.sagyo_siji_id
      AND d.sagyo_den_dat = t.sagyo_den_dat
      AND d.sagyo_id      = t.sagyo_id
      AND d.kizai_id      = t.kizai_id
      AND (
        d.meisai_cnt = 1
        OR (t.seq > d.prev_cum AND t.seq <= d.prev_cum + d.plan_qty)
      )
) s
WHERE r.rfid_tag_id    = s.rfid_tag_id
  AND r.ido_den_id     = s.ido_den_id
  AND r.sagyo_kbn_id   = s.sagyo_kbn_id
  AND r.sagyo_siji_id  = s.sagyo_siji_id
  AND r.sagyo_den_dat  = s.sagyo_den_dat
  AND r.sagyo_id       = s.sagyo_id
  AND r.kizai_id       = s.kizai_id;

---------------------------------------------------------------------------------------------------
-- 3-3. 分割した機材だけ、読取数をタグから数え直す
---------------------------------------------------------------------------------------------------
-- 明細1件の機材は「機材の読取数 = その明細の読取数」なので触らない。
-- 分割した機材だけ、3-2で明細に割り当たったタグ数に置き換える。
-- 補正数（result_adj_qty）は分割対象の150行すべてで0であることを確認済みなので分配しない。
UPDATE public.t_ido_den d
SET result_qty = c.cnt
FROM (
  SELECT s.ido_den_id, s.sagyo_kbn_id, s.sagyo_siji_id, s.sagyo_den_dat, s.sagyo_id, s.kizai_id,
         s.juchu_head_id, s.juchu_kizai_head_id,
         (
           SELECT count(*) FROM public.t_ido_result r
           WHERE r.ido_den_id    = s.ido_den_id
             AND r.sagyo_kbn_id  = s.sagyo_kbn_id
             AND r.sagyo_siji_id = s.sagyo_siji_id
             AND r.sagyo_den_dat = s.sagyo_den_dat
             AND r.sagyo_id      = s.sagyo_id
             AND r.kizai_id      = s.kizai_id
             AND r.juchu_head_id = s.juchu_head_id
             AND r.juchu_kizai_head_id = s.juchu_kizai_head_id
         )
         + (
           SELECT count(*) FROM public.t_ido_ctn_result r
           WHERE r.ido_den_id    = s.ido_den_id
             AND r.sagyo_kbn_id  = s.sagyo_kbn_id
             AND r.sagyo_siji_id = s.sagyo_siji_id
             AND r.sagyo_den_dat = s.sagyo_den_dat
             AND r.sagyo_id      = s.sagyo_id
             AND r.kizai_id      = s.kizai_id
             AND r.juchu_head_id = s.juchu_head_id
             AND r.juchu_kizai_head_id = s.juchu_kizai_head_id
         ) AS cnt
  FROM _mig_den_slot s
  WHERE s.meisai_cnt > 1
) c
WHERE d.ido_den_id          = c.ido_den_id
  AND d.sagyo_kbn_id        = c.sagyo_kbn_id
  AND d.sagyo_siji_id       = c.sagyo_siji_id
  AND d.sagyo_den_dat       = c.sagyo_den_dat
  AND d.sagyo_id            = c.sagyo_id
  AND d.kizai_id            = c.kizai_id
  AND d.juchu_head_id       = c.juchu_head_id
  AND d.juchu_kizai_head_id = c.juchu_kizai_head_id
  AND COALESCE(d.result_qty, 0) IS DISTINCT FROM c.cnt;

---------------------------------------------------------------------------------------------------
-- 4. 検算（合わなければエラーで止める）
---------------------------------------------------------------------------------------------------
DO $$
DECLARE
  bad integer;
BEGIN
  -- 機材単位の移動数合計が分割前と変わっていないこと。
  -- 分割は「元の移動数を明細に配り直す」だけなので、機材で足し戻せば元に戻る。
  SELECT count(*) INTO bad
  FROM (
    SELECT d.sagyo_kbn_id, d.sagyo_siji_id, d.sagyo_den_dat, d.sagyo_id, d.kizai_id,
           sum(COALESCE(d.plan_qty, 0)) AS s
    FROM public.t_ido_den d
    GROUP BY 1, 2, 3, 4, 5
  ) x
  JOIN (
    SELECT a.sagyo_kbn_id, a.sagyo_siji_id, a.sagyo_den_dat, a.sagyo_id, a.kizai_id,
           max(a.den_plan_qty) AS s
    FROM _mig_ido_den_alloc a
    GROUP BY 1, 2, 3, 4, 5
  ) y USING (sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id)
  WHERE x.s <> y.s;
  IF bad > 0 THEN
    RAISE EXCEPTION '移動数の合計が分割前と一致しません（% 機材）', bad;
  END IF;

  -- 1機材に ido_den_id が2つ以上できていないこと（ゲートの引き当てが壊れる）
  SELECT count(*) INTO bad
  FROM (
    SELECT 1 FROM public.t_ido_den
    GROUP BY sagyo_kbn_id, sagyo_siji_id, sagyo_den_dat, sagyo_id, kizai_id
    HAVING count(DISTINCT ido_den_id) > 1
  ) x;
  IF bad > 0 THEN
    RAISE EXCEPTION '1機材に複数の ido_den_id があります（% 機材）', bad;
  END IF;

  -- 受注2列が埋まった伝票行に、対応する t_ido_den_juchu があること
  SELECT count(*) INTO bad
  FROM public.t_ido_den d
  WHERE d.juchu_head_id <> 0
    AND NOT EXISTS (
      SELECT 1 FROM public.t_ido_den_juchu j
      WHERE j.juchu_head_id       = d.juchu_head_id
        AND j.juchu_kizai_head_id = d.juchu_kizai_head_id
        AND j.sagyo_kbn_id        = d.sagyo_kbn_id
        AND j.sagyo_siji_id       = d.sagyo_siji_id
        AND j.sagyo_den_dat       = d.sagyo_den_dat
        AND j.sagyo_id            = d.sagyo_id
        AND j.kizai_id            = d.kizai_id
    );
  IF bad > 0 THEN
    RAISE EXCEPTION '対応する受注明細が無い伝票行があります（% 行）', bad;
  END IF;
END $$;

COMMIT;

-- 適用後の確認用（手で流す）
--   select count(*) from t_ido_den;                                   -- 3,832 -> 3,996
--   select juchu_head_id = 0 as manual, count(*) from t_ido_den group by 1;
--   select juchu_head_id = 0 as unassigned, count(*) from t_ido_result group by 1;
