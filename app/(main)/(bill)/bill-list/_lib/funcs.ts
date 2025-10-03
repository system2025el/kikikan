'use server';

import { selectActiveSeikyuSts } from '@/app/_lib/db/tables/m-seikyu-sts';
import { selectFilteredBills } from '@/app/_lib/db/tables/v-seikyu-lst';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { BillSearchValues, BillsListTableValues } from './types';

/**
 * 選択肢用請求ステータスを取得する関数
 * @returns 選択肢用の請求ステータスの配列
 */
export const getBillingStsSelection = async (): Promise<SelectTypes[]> => {
  try {
    const { data, error } = await selectActiveSeikyuSts();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({ id: d.sts_id, label: d.sts_nam }));
  } catch (e) {
    throw e;
  }
};

/**
 * 請求一覧に表示するリストを取得・成形する関数
 * @param queries 検索条件
 * @returns
 */
export const getFilteredBills = async (
  queries: BillSearchValues = {
    billId: undefined,
    billingSts: undefined,
    range: {
      str: undefined,
      end: undefined,
    },
    kokyaku: undefined,
    kokyakuTantoNam: undefined,
  }
): Promise<BillsListTableValues[]> => {
  try {
    const { data, error } = await selectFilteredBills(queries);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({
      billHeadId: d.seikyu_head_id,
      billingSts: d.sts_nam,
      billHeadNam: d.seikyu_head_nam,
      kokyaku: d.kokyaku_nam,
      seikyuDat: d.seikyu_dat,
    }));
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};
