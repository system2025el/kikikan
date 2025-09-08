'use server';

import { QueryResult } from 'pg';

import { selectLoanStockList, selectUseList } from '@/app/_lib/db/tables/stock-table';
import { selectLoanJuchuData } from '@/app/_lib/db/tables/v-juchu-kizai-den';
import { selectJuchuHeadIds } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectLoanKizai } from '@/app/_lib/db/tables/v-kizai-list';
import { toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { GetNyukoDate, GetShukoDate } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';

import { LoanConfirmJuchuHeadId, LoanJuchu, LoanKizai, LoanStockTableValues, LoanUseTableValues } from './types';

/**
 * 貸出状況用機材情報取得
 * @param kizaiId 機材id
 * @returns LoanKizai
 */
export const getLoanKizaiData = async (kizaiId: number) => {
  try {
    const { data, error } = await selectLoanKizai(kizaiId);

    if (error) {
      console.error(error.message);
      throw new Error('選択機材が存在しません');
    }

    const kizaiData: LoanKizai = {
      kizaiId: data.kizai_id,
      kizaiNam: data.kizai_nam ?? '',
      regAmt: data.reg_amt ?? 0,
      kizaiQty: data.kizai_qty ?? 0,
    };
    return kizaiData;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const getLoanJuchuData = async (kizaiId: number) => {
  try {
    const { data, error } = await selectLoanJuchuData(kizaiId);

    if (error) {
      console.error(error.message);
      return [];
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
      shukoDat: GetShukoDate(
        d.kics_shuko_dat ? new Date(d.kics_shuko_dat) : null,
        d.yard_shuko_dat ? new Date(d.yard_shuko_dat) : null
      ),
      nyukoDat: GetNyukoDate(
        d.kics_nyuko_dat ? new Date(d.kics_nyuko_dat) : null,
        d.yard_nyuko_dat ? new Date(d.yard_nyuko_dat) : null
      ),
    }));

    return loanJuchuData;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const confirmJuchuHeadId = async (strDat: Date) => {
  const stringStrDat = toISOStringYearMonthDay(strDat);
  try {
    const result: QueryResult<LoanConfirmJuchuHeadId> = await selectJuchuHeadIds(stringStrDat);
    if (result.rowCount === 0) {
      return [];
    }

    const data: number[] = result.rows.map((row) => row.juchuHeadId);
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getLoanUseData = async (juchuHeadId: number, kizaiId: number, date: Date) => {
  const stringDate = toISOStringYearMonthDay(date);
  try {
    //console.log('DB Connected');
    const result: QueryResult<LoanUseTableValues> = await selectUseList(juchuHeadId, kizaiId, stringDate);
    const data: LoanUseTableValues[] = result.rows;
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getLoanStockData = async (kizaiId: number, date: Date) => {
  const stringDate = toISOStringYearMonthDay(date);
  try {
    const result: QueryResult<LoanStockTableValues> = await selectLoanStockList(kizaiId, stringDate);
    const data: LoanStockTableValues[] = result.rows;
    return data;
  } catch (e) {
    console.error(e);
    return [];
  }
};
