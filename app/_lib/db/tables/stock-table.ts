'use server';

import pool from '../postgres';
import { SCHEMA } from '../supabase';

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
 * @returns
 */
export const selectDetailStockListBulk = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiIds: number[],
  date: string
) => {
  try {
    const query = `
      WITH target_days AS (
    -- 指定日から90日分のカレンダーを作成
    SELECT $4::date + g.i AS cal_dat 
    FROM generate_series(0, 90) AS g(i)
),
target_kizai AS (
    -- 対象の機材情報を一度に取得（$1は機材IDの配列 [1, 2, 3...]）
    SELECT kizai_id, kizai_qty 
    FROM ${SCHEMA}.v_kizai_qty 
    WHERE kizai_id = ANY($1) 
)
SELECT 
    d.cal_dat AS "calDat",
    k.kizai_id AS "kizaiId",
    k.kizai_qty AS "kizaiQty",
    COALESCE(v.juchu_qty, 0)::integer AS "juchuQty",
    COALESCE(v.zaiko_qty, k.kizai_qty)::integer AS "zaikoQty",
    COALESCE(h.juchu_honbanbi_shubetu_id, 0) AS "juchuHonbanbiShubetuId",
    COALESCE(h.juchu_honbanbi_shubetu_color, 'white') AS "juchuHonbanbiColor"
FROM 
    target_days d
CROSS JOIN 
    target_kizai k -- 日付と機材の全組み合わせを作成
LEFT JOIN 
    ${SCHEMA}.v_zaiko_qty v ON v.plan_dat = d.cal_dat AND v.kizai_id = k.kizai_id
LEFT JOIN 
    ${SCHEMA}.v_honbanbi_juchu_kizai h ON h.plan_dat = d.cal_dat 
    AND h.kizai_id = k.kizai_id
    AND h.juchu_head_id = $2 
    AND h.juchu_kizai_head_id = $3
ORDER BY 
    k.kizai_id, d.cal_dat;
    `;

    const values = [kizaiIds, juchuHeadId, juchuKizaiHeadId, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
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
export const selectUseListBulk = async (juchuHeadIds: number[], kizaiId: number, date: string) => {
  try {
    const query = `
      WITH target_days AS (
    -- スケジュール範囲の生成
    SELECT $3::date + g.i AS cal_dat 
    FROM generate_series(0, 90) AS g(i)
),
target_juchu AS (
    -- 受注IDのリスト
    SELECT unnest($2::integer[]) AS juchu_head_id
),
kizai_master AS (
    -- 機材マスタ情報の取得 ($1 は単一の機材ID)
    SELECT kizai_id, kizai_qty 
    FROM ${SCHEMA}.v_kizai_qty 
    WHERE kizai_id = $1
)
SELECT 
    cal.cal_dat AS "calDat",
    tj.juchu_head_id AS "juchuHeadId", -- 追加：どの受注のデータか識別用
    km.kizai_id AS "kizaiId",
    km.kizai_qty AS "kizaiQty",
    COALESCE(v.plan_qty, 0)::integer AS "planQty",
    COALESCE(v.zaiko_qty, km.kizai_qty)::integer AS "zaikoQty",
    COALESCE(h.juchu_honbanbi_shubetu_color, 'white') AS "juchuHonbanbiColor"
FROM 
    target_days cal
CROSS JOIN 
    target_juchu tj -- 日付 × 全受注ID の組み合わせを作成
CROSS JOIN 
    kizai_master km
LEFT JOIN 
    ${SCHEMA}.v_zaiko_qty_kasi v ON v.plan_dat = cal.cal_dat 
    AND v.kizai_id = km.kizai_id
    AND v.juchu_head_id = tj.juchu_head_id
LEFT JOIN 
    ${SCHEMA}.v_honbanbi_kasi_jokyo h ON h.plan_dat = cal.cal_dat 
    AND h.kizai_id = km.kizai_id
    AND h.juchu_head_id = tj.juchu_head_id
ORDER BY 
    tj.juchu_head_id, cal.cal_dat;
    `;

    const values = [kizaiId, juchuHeadIds, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
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
kizai_info AS (
    -- 機材の基本情報を1回だけ取得
    SELECT kizai_id, kizai_qty 
    FROM ${SCHEMA}.v_kizai_qty 
    WHERE kizai_id = $1
)
SELECT 
    d.cal_dat AS "calDat",
    k.kizai_id AS "kizaiId",
    COALESCE(v.zaiko_qty, k.kizai_qty)::integer AS "zaikoQty"
FROM 
    target_days d
CROSS JOIN 
    kizai_info k  -- ここで1回だけ結合
LEFT JOIN 
    ${SCHEMA}.v_zaiko_qty v ON v.plan_dat = d.cal_dat 
    AND v.kizai_id = k.kizai_id
ORDER BY 
    d.cal_dat;
    `;

    const values = [kizaiId, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
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
target_kizai AS (
    -- 対象機材のリストとマスターの保有数を一括取得
    -- $1 は [101, 102, 103...] という機材IDの配列
    SELECT kizai_id, kizai_qty 
    FROM ${SCHEMA}.v_kizai_qty 
    WHERE kizai_id = ANY($1) 
)
SELECT 
    d.cal_dat AS "calDat",
    k.kizai_id AS "kizaiId",
    -- 在庫データがあればそれを使用、なければマスターの保有数を使用
    COALESCE(v.zaiko_qty, k.kizai_qty)::integer AS "zaikoQty"
FROM 
    target_days d
CROSS JOIN 
    target_kizai k -- 日付 × 全機材 のマトリクスを作成
LEFT JOIN 
    ${SCHEMA}.v_zaiko_qty v ON v.plan_dat = d.cal_dat 
    AND v.kizai_id = k.kizai_id
ORDER BY 
    k.kizai_id, d.cal_dat;
    `;

    const values = [kizaiIds, date];

    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};
