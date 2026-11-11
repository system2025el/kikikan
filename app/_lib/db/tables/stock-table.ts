'use server';

import pool from '../postgres';
import { SCHEMA } from '../schema';

// /**
//  * 機材明細用在庫データ取得
//  * @param juchuHeadId 受注ヘッダーid
//  * @param juchuKizaiHeadId 受注機材ヘッダーid
//  * @param kizaiId 機材id
//  * @param date 開始日
//  * @returns 機材在庫テーブル用データ
//  */
// export const selectDetailStockList = async (
//   juchuHeadId: number,
//   juchuKizaiHeadId: number,
//   kizaiId: number,
//   date: string
// ) => {
//   try {
//     const query = `
//           select
//         cal.cal_dat as "calDat" --スケジュール日
//         ,coalesce(zaiko_kizai.kizai_id,$1 /*■変数箇所■*/)::integer as "kizaiId"   -- 機材ID
//         ,coalesce(zaiko_kizai.kizai_qty,(select v_kizai_qty.kizai_qty from ${SCHEMA}.v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "kizaiQty"   --機材数（有効数）
//         ,coalesce(zaiko_kizai.juchu_qty,0)::integer as "juchuQty"   --受注数 NULL時0固定    /*貸出状況スケジュール*/

//     --     ,coalesce(zaiko_kizai.yobi_qty,0) as yobi_qty   --予備数 NULL時0固定
//     --     ,coalesce(zaiko_kizai.plan_qty,0) as plan_qty   --合計数 NULL時0固定

//         ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from ${SCHEMA}.v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "zaikoQty"     --在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/
//         ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_id,0) as "juchuHonbanbiShubetuId" --受注本番日種別
//         ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_color,'white') as "juchuHonbanbiColor" --受注本番日種別カラー
//     from
//         (
//             select
//                  v_zaiko_qty.plan_dat    --機材の使用日
//                 ,v_zaiko_qty.kizai_id   --機材ID
//                 ,v_zaiko_qty.kizai_qty  --機材の機材数
//                 ,v_zaiko_qty.juchu_qty   --機材の受注数
//                 ,v_zaiko_qty.yobi_qty   --機材の予備数
//                 ,v_zaiko_qty.plan_qty   --機材の受注合計数
//                 ,v_zaiko_qty.zaiko_qty  --機材の在庫数
//                 ,honbanbi.juchu_honbanbi_shubetu_id --受注本番日種別ID
//                 ,honbanbi.juchu_honbanbi_shubetu_color --受注本番日種別カラー
//             from
//                 ${SCHEMA}.v_zaiko_qty

//             left outer join
//                 ----------------------
//                 ----１．受注機材明細スケジュールビュー
//                 ${SCHEMA}.v_honbanbi_juchu_kizai as honbanbi on
//                 ----------------------

//                 v_zaiko_qty.plan_dat = honbanbi.plan_dat
//                 and
//                 v_zaiko_qty.kizai_id = honbanbi.kizai_id

//                 ----------------------
//     --             ----１．受注機材明細スケジュールビュー
//                  and
//                  honbanbi.juchu_head_id = $2 /*■変数箇所■*/
//                  and
//                  honbanbi.juchu_kizai_head_id = $3 /*■変数箇所■*/
//             -----------
//             where
//                 --指定した１機材
//                 v_zaiko_qty.kizai_id = $1 /*■変数箇所■*/
//         ) as zaiko_kizai
//     right outer join
//         /* スケジュール生成して外部結合 */
//         (
//             -- スケジュールの生成範囲 /*■変数箇所■*/
//             select $4::date + g.i as cal_dat from generate_series(0, 90) as g(i)
//         ) as cal on
//         zaiko_kizai.plan_dat = cal.cal_dat

//     order by cal_dat;

//         `;

//     const values = [kizaiId, juchuHeadId, juchuKizaiHeadId, date];

//     return await pool.query(query, values);
//   } catch (e) {
//     throw e;
//   }
// };

/**
 * 複数機材明細用在庫データ一括取得
 * @param juchuHeadId
 * @param juchuKizaiHeadId
 * @param kizaiIds
 * @param date
 * @param days 取得する日数（date から）
 * @returns
 */
export const selectDetailStockListBulk = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiIds: number[],
  date: string,
  days: number
) => {
  try {
    const query = `
      WITH target_days AS (
        -- 指定日から指定日数分のカレンダーを作成
        SELECT $4::date + g.i AS cal_dat
        FROM generate_series(0, $5::integer - 1) AS g(i)
      ),
        -- MATERIALIZED：機材の並び順が下に伝わらないようにし、機材と日付の両方で突き合わせる計画にする
        -- （selectStockListBulk と同じ。外すと機材が多いときに遅い計画が選ばれやすい）
        target_kizai AS MATERIALIZED (
            -- 対象の機材の保有数を一度に取得（$1は機材IDの配列 [1, 2, 3...]）
            -- 保有数は v_kizai_qty.kizai_qty と同じ数え方（削除されておらず、状態が100未満か未設定のタグの本数）。
            -- v_kizai_qty は NG数・削除数・KICS/YARD数のために v_rfid を5回全件集計し、機材の絞り込みも
            -- 集計の内側に届かないので、ここでは対象の機材のタグだけを1回で数える。
            -- v_kizai_qty の保有数の条件を変えたら、ここも合わせること
            SELECT m.kizai_id, COALESCE(r.qty, 0::bigint) AS kizai_qty
            FROM ${SCHEMA}.m_kizai m
            LEFT JOIN (
                SELECT kizai_id, count(*) AS qty
                FROM ${SCHEMA}.v_rfid
                WHERE kizai_id = ANY($1)
                  AND del_flg = 0
                  AND (rfid_kizai_sts < 100 OR rfid_kizai_sts IS NULL)
                GROUP BY kizai_id
            ) r ON r.kizai_id = m.kizai_id
            WHERE m.kizai_id = ANY($1)
        ),
        -- 機材・日付ごとの使用数。在庫数（保有数 − 使用数）は下の SELECT で target_kizai の保有数から求める
        -- （v_zaiko_qty を使うと、その中で v_kizai_qty を全機材分もう一度計算することになる）。
        -- v_juchu_kizai_dat_qty / v_honbanbi_juchu_kizai は全受注・全日付を横断する
        -- GROUP BY (kizai_id, plan_dat) の集約ビュー。絞り込みをJOIN条件で渡すと
        -- 「JOIN相手から来る値」になって集約の内側に押し込めず、全受注を集約し切ってから
        -- 捨てることになる（機材1件でも約1.9秒かかっていた）。
        -- kizai_id も plan_dat もGROUP BYのキーなので、ここで定数の述語として先に当てておくと
        -- 集約の内側まで押し込まれる。日付範囲は上の generate_series と一致させること。
        zaiko AS (
            SELECT plan_dat, kizai_id, juchu_qty, plan_qty
            FROM ${SCHEMA}.v_juchu_kizai_dat_qty
            WHERE kizai_id = ANY($1)
              AND plan_dat >= $4::date
              AND plan_dat < $4::date + $5::integer
        ),
        honbanbi AS (
            SELECT plan_dat, kizai_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_shubetu_color
            FROM ${SCHEMA}.v_honbanbi_juchu_kizai
            WHERE kizai_id = ANY($1)
              AND juchu_head_id = $2
              AND juchu_kizai_head_id = $3
              AND plan_dat >= $4::date
              AND plan_dat < $4::date + $5::integer
        )
        SELECT
            d.cal_dat AS "calDat",
            k.kizai_id AS "kizaiId",
            k.kizai_qty AS "kizaiQty",
            COALESCE(v.juchu_qty, 0)::integer AS "juchuQty",
            -- 使用数が無い日は保有数をそのまま在庫数にする
            COALESCE(k.kizai_qty - v.plan_qty, k.kizai_qty)::integer AS "zaikoQty",
            COALESCE(h.juchu_honbanbi_shubetu_id, 0) AS "juchuHonbanbiShubetuId",
            COALESCE(h.juchu_honbanbi_shubetu_color, 'white') AS "juchuHonbanbiColor"
        FROM
            target_days d
        CROSS JOIN
            target_kizai k -- 日付と機材の全組み合わせを作成
        LEFT JOIN
            zaiko v ON v.plan_dat = d.cal_dat AND v.kizai_id = k.kizai_id
        LEFT JOIN
            honbanbi h ON h.plan_dat = d.cal_dat
            AND h.kizai_id = k.kizai_id
        ORDER BY
            k.kizai_id, d.cal_dat;
    `;

    const values = [kizaiIds, juchuHeadId, juchuKizaiHeadId, date, days];

    return await pool.query(query, values);
  } catch (e) {
    throw new Error('[selectDetailStockListBulk] DBエラー:', { cause: e });
  }
};

// /**
//  * 貸出状況用使用データ取得
//  * @param juchuHeadId 受注ヘッダーid
//  * @param kizaiId 機材id
//  * @param date 開始日
//  * @returns 貸出状況用使用データ
//  */
// export const selectUseList = async (juchuHeadId: number, kizaiId: number, date: string) => {
//   try {
//     const query = `
//       select
//     cal.cal_dat as "calDat" --スケジュール日
//     ,coalesce(zaiko_kizai.kizai_id,$1 /*■変数箇所■*/)::integer as "kizaiId"   -- 機材ID
//     ,coalesce(zaiko_kizai.kizai_qty,(select v_kizai_qty.kizai_qty from ${SCHEMA}.v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "kizaiQty"   --機材数（保有数）

// --    ,coalesce(zaiko_kizai.juchu_qty,0) as juchuQty   --全体受注数 NULL時0固定
// --    ,coalesce(zaiko_kizai.yobi_qty,0) as yobiQty   --全体予備数 NULL時0固定
//     ,coalesce(zaiko_kizai.plan_qty,0)::integer as "planQty"   --全体合計数 NULL時0固定
//     ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from ${SCHEMA}.v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/))::integer as "zaikoQty"     --全体在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/

// --     -- 自受注合計数を全体在庫から引いておいて、画面側で自受注合計数を加算しても制御は可能
// --     ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from ${SCHEMA}.v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/)) as zaiko_qty_jogai     --全体在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/

// --    ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_id,0) as juchu_honbanbi_shubetu_id --受注本番日種別
//     ,coalesce(zaiko_kizai.juchu_honbanbi_shubetu_color,'white') as "juchuHonbanbiColor" --受注本番日種別カラー
// from
//     (
//         select
//              v_zaiko_qty_kasi.plan_dat    --機材の使用日
//             ,v_zaiko_qty_kasi.kizai_id   --機材ID
//             ,v_zaiko_qty_kasi.kizai_qty  --機材の機材数
//             ,v_zaiko_qty_kasi.juchu_qty   --機材の受注数
//             ,v_zaiko_qty_kasi.yobi_qty   --機材の予備数
//             ,v_zaiko_qty_kasi.plan_qty   --機材の受注合計数
//             ,v_zaiko_qty_kasi.zaiko_qty  --機材の在庫数
//             ,honbanbi.juchu_honbanbi_shubetu_id --受注本番日種別ID
//             ,honbanbi.juchu_honbanbi_shubetu_color --受注本番日種別カラー
//         from
//             ${SCHEMA}.v_zaiko_qty_kasi

//         left outer join
//             ----------------------
//              --２．貸出状況スケジュールビュー
//               ${SCHEMA}.v_honbanbi_kasi_jokyo as honbanbi on
//             ----------------------

//             v_zaiko_qty_kasi.plan_dat = honbanbi.plan_dat
//             and
//             v_zaiko_qty_kasi.kizai_id = honbanbi.kizai_id

//             ----------------------

//              --２．貸出状況スケジュールビュー
//              and
//              honbanbi.juchu_head_id = $2 /*■変数箇所■*/
//              and
//              v_zaiko_qty_kasi.juchu_head_id = $2 /*■変数箇所■*/
//         -----------
//         where
//             --指定した１機材
//             v_zaiko_qty_kasi.kizai_id = $1 /*■変数箇所■*/
//             and
//             v_zaiko_qty_kasi.juchu_head_id = $2 /*■変数箇所■*/
//     ) as zaiko_kizai
// right outer join
//     /* スケジュール生成して外部結合 */
//     (
//         -- スケジュールの生成範囲 /*■変数箇所■*/
//         select $3::date + g.i as cal_dat from generate_series(0, 90) as g(i)
//     ) as cal on
//     zaiko_kizai.plan_dat = cal.cal_dat

// order by cal_dat;
//       `;

//     const values = [kizaiId, juchuHeadId, date];

//     return await pool.query(query, values);
//   } catch (e) {
//     throw e;
//   }
// };

/**
 * 複数貸出状況用使用データ一括取得
 * @param juchuHeadIds
 * @param kizaiId
 * @param date
 * @returns
 */
export const selectUseListBulk = async (
  //   juchuHeadIds: number[],
  //   juchuKizaiHeadIds: number[],
  targetIds: { juchuHeadId: number; juchuKizaiHeadId: number }[],
  kizaiId: number,
  date: string
) => {
  try {
    // const query = `
    //   WITH target_days AS (
    //     -- スケジュール範囲の生成
    //     SELECT $4::date + g.i AS cal_dat
    //     FROM generate_series(0, 90) AS g(i)
    //   ),
    //   target_juchu AS (
    //     -- 受注IDのリスト
    //     SELECT
    //         unnest($2::integer[]) AS juchu_head_id
    //   ),
    //   kizai_master AS (
    //     -- 機材マスタ情報の取得 ($1 は単一の機材ID)
    //     SELECT kizai_id, kizai_qty
    //     FROM ${SCHEMA}.v_kizai_qty
    //     WHERE kizai_id = $1
    //   )
    //   SELECT
    //     cal.cal_dat AS "calDat",
    //     tj.juchu_head_id AS "juchuHeadId", -- 追加：どの受注のデータか識別用
    //     km.kizai_id AS "kizaiId",
    //     km.kizai_qty AS "kizaiQty",
    //     COALESCE(v.plan_qty, 0)::integer AS "planQty",
    //     COALESCE(v.zaiko_qty, km.kizai_qty)::integer AS "zaikoQty",
    //     COALESCE(h.juchu_honbanbi_shubetu_color, 'white') AS "juchuHonbanbiColor"
    //   FROM
    //     target_days cal
    //   CROSS JOIN
    //     target_juchu tj -- 日付 × 全受注ID の組み合わせを作成
    //   CROSS JOIN
    //     kizai_master km
    //   LEFT JOIN
    //     ${SCHEMA}.v_zaiko_qty_kasi v ON v.plan_dat = cal.cal_dat
    //     AND v.kizai_id = km.kizai_id
    //     AND v.juchu_head_id = tj.juchu_head_id
    //   LEFT JOIN
    //     ${SCHEMA}.v_honbanbi_kasi_jokyo h ON h.plan_dat = cal.cal_dat
    //     AND h.kizai_id = km.kizai_id
    //     AND h.juchu_head_id = tj.juchu_head_id
    //   ORDER BY
    //     tj.juchu_head_id, cal.cal_dat;
    // `;

    const juchuHeadIds = targetIds.map((d) => d.juchuHeadId);
    const juchuKizaiHeadIds = targetIds.map((d) => d.juchuKizaiHeadId);

    const query = `
      WITH target_days AS (
        SELECT $4::date + g.i AS cal_dat 
        FROM generate_series(0, 90) AS g(i)
      ),
      target_juchu AS (
        -- 2つの配列を同時に unnest してペア（行）を作成
        SELECT 
          unnest($2::integer[]) AS juchu_head_id,
          unnest($3::integer[]) AS juchu_kizai_head_id
      ),
      kizai_master AS (
        SELECT kizai_id, kizai_qty 
        FROM ${SCHEMA}.v_kizai_qty 
        WHERE kizai_id = $1
      )
      SELECT 
        cal.cal_dat AS "calDat",
        tj.juchu_head_id AS "juchuHeadId",
        tj.juchu_kizai_head_id AS "juchuKizaiHeadId",
        km.kizai_id AS "kizaiId",
        km.kizai_qty AS "kizaiQty",
        v.plan_qty AS "planQty",
        COALESCE(h.juchu_honbanbi_shubetu_color, 'white') AS "juchuHonbanbiColor"
      FROM 
        target_days cal
      CROSS JOIN 
        target_juchu tj -- 日付 × (受注ID + 受注機材ID) の組み合わせ
      CROSS JOIN 
        kizai_master km
      LEFT JOIN 
        ${SCHEMA}.v_zaiko_qty_kasi v ON v.plan_dat = cal.cal_dat 
        AND v.kizai_id = km.kizai_id
        -- ペアの両方で結合
        AND v.juchu_head_id = tj.juchu_head_id
        AND v.juchu_kizai_head_id = tj.juchu_kizai_head_id
      LEFT JOIN 
        ${SCHEMA}.v_honbanbi_kasi_jokyo h ON h.plan_dat = cal.cal_dat 
        AND h.kizai_id = km.kizai_id
        -- ペアの両方で結合
        AND h.juchu_head_id = tj.juchu_head_id
        AND h.juchu_kizai_head_id = tj.juchu_kizai_head_id
      ORDER BY 
        tj.juchu_head_id, tj.juchu_kizai_head_id, cal.cal_dat;
    `;

    const values = [kizaiId, juchuHeadIds, juchuKizaiHeadIds, date];

    return await pool.query(query, values);
  } catch (e) {
    throw new Error('[selectUseListBulk] DBエラー:', { cause: e });
  }
};

/**
 * 複数貸出状況用親子合体使用データ一括取得
 * @param juchuHeadIds
 * @param kizaiId
 * @param date
 * @returns
 */
export const selectMergeUseListBulk = async (
  targetIds: { juchuHeadId: number; juchuKizaiHeadId: number }[],
  kizaiId: number,
  date: string
) => {
  try {
    const juchuHeadIds = targetIds.map((d) => d.juchuHeadId);
    const juchuKizaiHeadIds = targetIds.map((d) => d.juchuKizaiHeadId);

    const query = `
      WITH target_days AS (
        SELECT $4::date + g.i AS cal_dat 
        FROM generate_series(0, 90) AS g(i)
      ),
      target_juchu AS (
        -- 2つの配列を同時に unnest してペア（行）を作成
        SELECT 
          unnest($2::integer[]) AS juchu_head_id,
          unnest($3::integer[]) AS juchu_kizai_head_id
      ),
      -- 保有数は v_kizai_qty.kizai_qty と同じ数え方（削除されておらず、状態が100未満か未設定のタグの本数）。
      -- v_kizai_qty は NG数・削除数・KICS/YARD数のために v_rfid を5回全件集計するので、対象の機材のタグだけを数える。
      -- v_kizai_qty の保有数の条件を変えたら、ここも合わせること（selectStockListBulk と同じ）
      -- 1機材だけなので MATERIALIZED にしない（すると「機材は $1 だけ」が下の JOIN に伝わらず、
      -- v_honbanbi_kasi_jokyo などを全機材分読むことになる。selectStockListBulk とは逆）
      kizai_master AS (
        SELECT m.kizai_id, COALESCE(r.qty, 0::bigint) AS kizai_qty
        FROM ${SCHEMA}.m_kizai m
        LEFT JOIN (
          SELECT kizai_id, count(*) AS qty
          FROM ${SCHEMA}.v_rfid
          WHERE kizai_id = $1
            AND del_flg = 0
            AND (rfid_kizai_sts < 100 OR rfid_kizai_sts IS NULL)
          GROUP BY kizai_id
        ) r ON r.kizai_id = m.kizai_id
        WHERE m.kizai_id = $1
      )
      SELECT
        cal.cal_dat AS "calDat",
        tj.juchu_head_id AS "juchuHeadId",
        tj.juchu_kizai_head_id AS "juchuKizaiHeadId",
        km.kizai_id AS "kizaiId",
        km.kizai_qty AS "kizaiQty",
        v.plan_qty AS "planQty",
        COALESCE(h.juchu_honbanbi_shubetu_color, 'white') AS "juchuHonbanbiColor"
      FROM
        target_days cal
      CROSS JOIN
        target_juchu tj -- 日付 × (受注ID + 受注機材ID) の組み合わせ
      CROSS JOIN
        kizai_master km
      LEFT JOIN (
        SELECT
          plan_dat,
          kizai_id,
          juchu_head_id,
          juchu_kizai_head_id,
          SUM(plan_qty) AS plan_qty
        -- 使うのは使用数だけなので、v_zaiko_qty_kasi（v_juchu_kizai_dat_qty_kasi に保有数を LEFT JOIN しただけのビュー）
        -- ではなく元の使用数のビューを読む（v_zaiko_qty_kasi だと読むたびに v_kizai_qty を計算する）
        -- 機材と日付の範囲はここで直接当てる（kizai_id も plan_dat も集計のキーなので、集約の内側まで押し込まれる）
        FROM (
          -- 通常の一致用データ
          SELECT plan_dat, kizai_id, juchu_head_id, juchu_kizai_head_id, plan_qty
          FROM ${SCHEMA}.v_juchu_kizai_dat_qty_kasi
          WHERE kizai_id = $1
            AND plan_dat >= $4::date
            AND plan_dat < $4::date + 91
          UNION ALL
          -- 親一致（oya_juchu_kizai_head_id）を通常のキーに見立てたデータ
          SELECT plan_dat, kizai_id, juchu_head_id, oya_juchu_kizai_head_id AS juchu_kizai_head_id, plan_qty
          FROM ${SCHEMA}.v_juchu_kizai_dat_qty_kasi
          WHERE oya_juchu_kizai_head_id IS NOT NULL
            AND kizai_id = $1
            AND plan_dat >= $4::date
            AND plan_dat < $4::date + 91
        ) sub
        GROUP BY plan_dat, kizai_id, juchu_head_id, juchu_kizai_head_id
      ) v ON v.plan_dat = cal.cal_dat 
        AND v.kizai_id = km.kizai_id
        AND v.juchu_head_id = tj.juchu_head_id
        AND v.juchu_kizai_head_id = tj.juchu_kizai_head_id
      LEFT JOIN 
        ${SCHEMA}.v_honbanbi_kasi_jokyo h ON h.plan_dat = cal.cal_dat 
        AND h.kizai_id = km.kizai_id
        -- ペアの両方で結合
        AND h.juchu_head_id = tj.juchu_head_id
        AND h.juchu_kizai_head_id = tj.juchu_kizai_head_id
      ORDER BY 
        tj.juchu_head_id, tj.juchu_kizai_head_id, cal.cal_dat;
    `;

    const values = [kizaiId, juchuHeadIds, juchuKizaiHeadIds, date];

    return await pool.query(query, values);
  } catch (e) {
    throw new Error('[selectUseListBulk] DBエラー:', { cause: e });
  }
};

/**
 * 機材在庫データ取得
 * @param kizaiId 機材id
 * @param date 日付
 * @returns 機材在庫データ
 */
export const selectStockList = async (kizaiId: number, date: string) => {
  try {
    // const query = `
    //   select
    //     cal.cal_dat as "calDat" --スケジュール日
    //     ,coalesce(zaiko_kizai.kizai_id,$1 /*■変数箇所■*/) as "kizaiId"   -- 機材ID
    //     ,coalesce(zaiko_kizai.zaiko_qty,(select v_kizai_qty.kizai_qty from ${SCHEMA}.v_kizai_qty where v_kizai_qty.kizai_id = $1 /*■変数箇所■*/)) as "zaikoQty"     --在庫数   /*受注機材明細スケジュール、在庫状況スケジュール*/
    //   from
    //   (
    //     select
    //         v_zaiko_qty.plan_dat   --機材の使用日
    //         ,v_zaiko_qty.kizai_id   --機材ID
    //         ,v_zaiko_qty.zaiko_qty  --機材の在庫数
    //     from
    //         ${SCHEMA}.v_zaiko_qty
    //     where
    //         --指定した１機材
    //         v_zaiko_qty.kizai_id = $1 /*■変数箇所■*/
    //   ) as zaiko_kizai
    //   right outer join
    //     /* スケジュール生成して外部結合 */
    //     (
    //         -- スケジュールの生成範囲 /*■変数箇所■*/
    //         select $2::date + g.i as cal_dat from generate_series(0, 90) as g(i)
    //     ) as cal on
    //     zaiko_kizai.plan_dat = cal.cal_dat

    //   order by cal_dat;

    // `;

    const query = `
      WITH target_days AS (
    -- 91日分のカレンダーを作成
    SELECT $2::date + g.i AS cal_dat 
    FROM generate_series(0, 90) AS g(i)
),
-- 1機材だけなので MATERIALIZED にしない（selectMergeUseListBulk と同じ）
kizai_info AS (
    -- 機材の保有数を1回だけ取得
    -- 保有数は v_kizai_qty.kizai_qty と同じ数え方（削除されておらず、状態が100未満か未設定のタグの本数）。
    -- v_kizai_qty は NG数・削除数・KICS/YARD数のために v_rfid を5回全件集計するので、対象の機材のタグだけを数える。
    -- v_kizai_qty の保有数の条件を変えたら、ここも合わせること（selectStockListBulk と同じ）
    SELECT m.kizai_id, COALESCE(r.qty, 0::bigint) AS kizai_qty
    FROM ${SCHEMA}.m_kizai m
    LEFT JOIN (
        SELECT kizai_id, count(*) AS qty
        FROM ${SCHEMA}.v_rfid
        WHERE kizai_id = $1
          AND del_flg = 0
          AND (rfid_kizai_sts < 100 OR rfid_kizai_sts IS NULL)
        GROUP BY kizai_id
    ) r ON r.kizai_id = m.kizai_id
    WHERE m.kizai_id = $1
),
-- 日付ごとの使用数。在庫数（保有数 − 使用数）は下の SELECT で kizai_info の保有数から求める
-- （v_zaiko_qty を使うと、その中で v_kizai_qty をもう一度計算することになる）。
-- 機材と日付の範囲は GROUP BY のキーなので、ここで当てると集約の内側まで押し込まれる
zaiko AS (
    SELECT plan_dat, kizai_id, plan_qty
    FROM ${SCHEMA}.v_juchu_kizai_dat_qty
    WHERE kizai_id = $1
      AND plan_dat >= $2::date
      AND plan_dat < $2::date + 91
)
SELECT
    d.cal_dat AS "calDat",
    k.kizai_id AS "kizaiId",
    -- 使用数が無い日は保有数をそのまま在庫数にする
    COALESCE(k.kizai_qty - v.plan_qty, k.kizai_qty)::integer AS "zaikoQty"
FROM
    target_days d
CROSS JOIN
    kizai_info k
LEFT JOIN
    zaiko v ON v.plan_dat = d.cal_dat
    AND v.kizai_id = k.kizai_id
ORDER BY 
    d.cal_dat;
    `;

    const values = [kizaiId, date];

    return await pool.query(query, values);
  } catch (e) {
    throw new Error('[selectStockList] DBエラー:', { cause: e });
  }
};

/**
 * 複数機材在庫データ一括取得
 * @param kizaiIds
 * @param date
 * @returns
 */
export const selectStockListBulk = async (kizaiIds: number[], date: string) => {
  try {
    const query = `
      WITH target_days AS (
    -- 91日分のカレンダーを作成
    SELECT $2::date + g.i AS cal_dat 
    FROM generate_series(0, 90) AS g(i)
),
-- MATERIALIZED：外すと、機材が数百件を超えたときに「機材だけで突き合わせて日付は後から絞る」計画が選ばれ、
-- 変更前（v_kizai_qty・v_zaiko_qty を使っていたとき）より遅くなる（1731機材で 約0.76秒→約1.2秒）。
-- 先に確定させると機材の並び順が下に伝わらず、機材と日付の両方で突き合わせる計画になる（同 約0.56秒）
target_kizai AS MATERIALIZED (
    -- 対象機材の保有数を一括取得（$1 は [101, 102, 103...] という機材IDの配列）
    -- 保有数は v_kizai_qty.kizai_qty と同じ数え方（削除されておらず、状態が100未満か未設定のタグの本数）。
    -- v_kizai_qty は NG数・削除数・KICS/YARD数のために v_rfid を5回全件集計し、機材の絞り込みも
    -- 集計の内側に届かないので、ここでは対象の機材のタグだけを1回で数える（selectDetailStockListBulk と同じ）。
    -- v_kizai_qty の保有数の条件を変えたら、ここも合わせること
    SELECT m.kizai_id, COALESCE(r.qty, 0::bigint) AS kizai_qty
    FROM ${SCHEMA}.m_kizai m
    LEFT JOIN (
        SELECT kizai_id, count(*) AS qty
        FROM ${SCHEMA}.v_rfid
        WHERE kizai_id = ANY($1)
          AND del_flg = 0
          AND (rfid_kizai_sts < 100 OR rfid_kizai_sts IS NULL)
        GROUP BY kizai_id
    ) r ON r.kizai_id = m.kizai_id
    WHERE m.kizai_id = ANY($1)
),
-- 機材・日付ごとの使用数。在庫数（保有数 − 使用数）は下の SELECT で target_kizai の保有数から求める
-- （v_zaiko_qty を使うと、その中で v_kizai_qty を全機材分もう一度計算することになる）。
-- v_juchu_kizai_dat_qty は全受注・全日付を横断する GROUP BY (kizai_id, plan_dat) の集約ビュー。
-- 絞り込みをJOIN条件で渡すと「JOIN相手から来る値」になって集約の内側に押し込めず、
-- 全受注を集約し切ってから捨てることになる（50機材でも約1.9秒かかっていた）。
-- kizai_id も plan_dat もGROUP BYのキーなので、ここで定数の述語として先に当てておくと
-- 集約の内側まで押し込まれる。日付範囲は上の generate_series(0, 90) と一致させること。
zaiko AS (
    SELECT plan_dat, kizai_id, plan_qty
    FROM ${SCHEMA}.v_juchu_kizai_dat_qty
    WHERE kizai_id = ANY($1)
      AND plan_dat >= $2::date
      AND plan_dat < $2::date + 91
)
SELECT
    d.cal_dat AS "calDat",
    k.kizai_id AS "kizaiId",
    -- 使用数が無い日は保有数をそのまま在庫数にする
    COALESCE(k.kizai_qty - v.plan_qty, k.kizai_qty)::integer AS "zaikoQty"
FROM
    target_days d
CROSS JOIN
    target_kizai k -- 日付 × 全機材 のマトリクスを作成
LEFT JOIN
    zaiko v ON v.plan_dat = d.cal_dat
    AND v.kizai_id = k.kizai_id
ORDER BY
    k.kizai_id, d.cal_dat;
    `;

    const values = [kizaiIds, date];

    return await pool.query(query, values);
  } catch (e) {
    throw new Error('[selectStockListBulk] DBエラー:', { cause: e });
  }
};
