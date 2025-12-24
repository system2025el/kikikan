'use server';

import { QueryResult } from 'pg';

import { selectActiveBumons } from '@/app/_lib/db/tables/m-bumon';
import { selectStockList } from '@/app/_lib/db/tables/stock-table';
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
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }

    const bumons: Bumon[] = data.map((d) => ({
      bumonId: d.bumon_id,
      bumonNam: d.bumon_nam,
    }));

    return bumons;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 部門idと一致する機材情報取得
 * @param bumonId 部門id
 * @returns 機材データ
 */
export const getEqData = async (bumonId: number) => {
  try {
    const { data, error } = await selectStockKizai(bumonId);

    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
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
    console.error(e);
    return [];
  }
};

/**
 * 機材在庫情報取得
 * @param kizaiId 機材id
 * @param date 日付
 * @returns 在庫データ
 */
export const getEqStockData = async (kizaiId: number, date: Date) => {
  const stringDate = toJapanYMDString(date, '-');
  try {
    const result: QueryResult<StockTableValues> = await selectStockList(kizaiId, stringDate);
    const data: StockTableValues[] = result.rows;
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};
