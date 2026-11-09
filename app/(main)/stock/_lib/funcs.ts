'use server';

import { QueryResult } from 'pg';

import { selectStockListBulk } from '@/app/_lib/db/tables/stock-table';
import { selectActiveBumons } from '@/app/_lib/db/tables/v_bumon_lst';
import { selectStockKizai } from '@/app/_lib/db/tables/v-kizai-list';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { Bumon, EqTableValues, StockTableValues } from './types';

/**
 * 部門情報取得
 * @returns 部門データ
 */
export const getBumonsData = async () => {
  try {
    const { data, error } = await selectActiveBumons();

    if (error) {
      throw new Error('[selectActiveBumons] DBエラー:', { cause: error });
    }
    if (!data || data.length === 0) {
      return [];
    }

    const bumons: Bumon[] = data.map((d) => ({
      bumonId: d.bumon_id!,
      bumonNam: d.bumon_nam!,
    }));

    return bumons;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    return [];
  }
};

/**
 * 部門idと一致する機材情報取得
 * @param bumonId 部門id
 * @returns 機材データ
 */
export const getEqData = async (bumonId: number, keyword: string) => {
  try {
    const { data, error } = await selectStockKizai(bumonId, keyword);

    if (error) {
      throw new Error('[selectStockKizai] DBエラー:', { cause: error });
    }

    const eqList: EqTableValues[] = data.map((d) => ({
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      kizaiQty: (d.kizai_qty ?? 0) - (d.kizai_ng_qty ?? 0),
      bumonId: d.bumon_id,
      bumonNam: d.bumon_nam,
    }));

    return eqList;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

// /**
//  * 機材在庫情報取得
//  * @param kizaiId 機材id
//  * @param date 日付
//  * @returns 在庫データ
//  */
// export const getEqStockData = async (kizaiId: number, date: Date) => {
//   const stringDate = toJapanYMDString(date, '-');
//   try {
//     const result: QueryResult<StockTableValues> = await selectStockList(kizaiId, stringDate);
//     const data: StockTableValues[] = result.rows;
//     return data;
//   } catch (e) {
//     console.error(e);
//     return [];
//   }
// };

/**
 * 検索時の機材一覧と在庫の取得
 * Server Action は1本ずつ順番に処理され、1往復ごとに時間が上乗せされるので、
 * 機材一覧で決まる在庫の取得までサーバー側で続けて行い、画面からは1回の呼び出しで済ませる
 * （エラーの記録は中で呼ぶ各取得関数が行う）
 * @param bumonId 部門id
 * @param keyword 機材名キーワード
 * @param date 在庫の開始日
 * @returns 機材一覧と、その機材の在庫（機材×日付）
 */
export const getStockSearchData = async (bumonId: number, keyword: string, date: Date) => {
  const eqList = await getEqData(bumonId, keyword);
  const uniqueKizaiIds = Array.from(new Set(eqList.map((d) => d.kizaiId)));
  const stockData = await getAllStockData(uniqueKizaiIds, date);
  return { eqList, stockData };
};

/**
 * 複数機材在庫情報一括取得
 * @param kizaiIds
 * @param date
 * @returns
 */
export const getAllStockData = async (kizaiIds: number[], date: Date) => {
  const stringDate = toJapanYMDString(date, '-');
  try {
    const result: QueryResult<StockTableValues> = await selectStockListBulk(kizaiIds, stringDate);
    const data: StockTableValues[] = result.rows;
    return data;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};
