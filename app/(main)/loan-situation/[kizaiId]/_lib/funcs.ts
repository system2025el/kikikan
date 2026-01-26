'use server';

import { QueryResult } from 'pg';

import { selectStockList, selectUseListBulk } from '@/app/_lib/db/tables/stock-table';
import { selectLoanJuchuData } from '@/app/_lib/db/tables/v-juchu-kizai-den';
import { selectJuchuHeadIds } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectLoanKizai } from '@/app/_lib/db/tables/v-kizai-list';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getShukoDate } from '@/app/(main)/_lib/date-funcs';

import { LoanConfirmJuchuHeadId, LoanJuchu, LoanKizai, LoanStockTableValues, LoanUseTableValues } from './types';

/**
 * 貸出状況用機材データ取得
 * @param kizaiId 機材id
 * @returns LoanKizai
 */
export const getLoanKizaiData = async (kizaiId: number) => {
  try {
    const { data, error } = await selectLoanKizai(kizaiId);

    if (error) {
      console.error(error.message);
      throw error;
    }

    const kizaiData: LoanKizai = {
      kizaiId: data.kizai_id,
      kizaiNam: data.kizai_nam ?? '',
      regAmt: data.reg_amt ?? 0,
      kizaiQty: (data.kizai_qty ?? 0) + (data.kizai_ng_qty ?? 0),
      ngQty: data.kizai_ng_qty ?? 0,
    };
    return kizaiData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 貸出状況用受注データ取得
 * @param kizaiId 機材id
 * @returns 受注データ
 */
export const getLoanJuchuData = async (kizaiId: number) => {
  try {
    const { data, error } = await selectLoanJuchuData(kizaiId);

    if (error) {
      console.error(error.message);
      throw error;
    }

    const seen = new Set();
    const uniqueData = data.filter((d) => {
      if (seen.has(d.juchu_head_id)) return false;
      seen.add(d.juchu_head_id);
      return true;
    });

    const loanJuchuData: LoanJuchu[] = uniqueData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      kizaiId: kizaiId,
      koenNam: d.koen_nam,
      shukoDat: getShukoDate(
        d.kics_shuko_dat ? new Date(d.kics_shuko_dat) : null,
        d.yard_shuko_dat ? new Date(d.yard_shuko_dat) : null
      ),
      nyukoDat: getNyukoDate(
        d.kics_nyuko_dat ? new Date(d.kics_nyuko_dat) : null,
        d.yard_nyuko_dat ? new Date(d.yard_nyuko_dat) : null
      ),
    }));

    return loanJuchuData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 貸出状況確認用受注ヘッダーidリスト取得
 * @param strDat 日付
 * @returns 貸出状況確認用受注ヘッダーidリスト
 */
export const confirmJuchuHeadId = async (strDat: Date) => {
  const stringStrDat = toJapanYMDString(strDat, '-');
  try {
    const result: QueryResult<LoanConfirmJuchuHeadId> = await selectJuchuHeadIds(stringStrDat);
    if (result.rowCount === 0) {
      return [];
    }

    const data: number[] = result.rows.map((row) => row.juchuHeadId);
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

// /**
//  * 貸出状況用使用データ取得
//  * @param juchuHeadId 受注ヘッダーid
//  * @param kizaiId 機材id
//  * @param date 日付
//  * @returns 貸出状況用使用データ
//  */
// export const getLoanUseData = async (juchuHeadId: number, kizaiId: number, date: Date) => {
//   const stringDate = toJapanYMDString(date, '-');
//   try {
//     const result: QueryResult<LoanUseTableValues> = await selectUseList(juchuHeadId, kizaiId, stringDate);
//     const data: LoanUseTableValues[] = result.rows;
//     return data;
//   } catch (e) {
//     console.error(e);
//     throw e;
//   }
// };

/**
 * 複数貸出状況用使用データ一括取得
 * @param juchuHeadId 受注ヘッダーid
 * @param kizaiId 機材id
 * @param date 日付
 * @returns 貸出状況用使用データ
 */
export const getAllLoanUseData = async (juchuHeadIds: number[], kizaiId: number, date: Date) => {
  const stringDate = toJapanYMDString(date, '-');
  try {
    const result: QueryResult<LoanUseTableValues> = await selectUseListBulk(juchuHeadIds, kizaiId, stringDate);
    const data: LoanUseTableValues[] = result.rows;
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * 貸出状況用在庫データ取得
 * @param kizaiId 機材id
 * @param date 日付
 * @returns 貸出状況用在庫データ
 */
export const getLoanStockData = async (kizaiId: number, date: Date) => {
  const stringDate = toJapanYMDString(date, '-');
  try {
    const result: QueryResult<LoanStockTableValues> = await selectStockList(kizaiId, stringDate);
    const data: LoanStockTableValues[] = result.rows;
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
