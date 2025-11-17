'use server';
import { selectMinusZaikoList, selectshukoTimeList, selectVehiclesList } from '@/app/_lib/db/tables/dashboard';

import { DashboardTableValues, MinusZaikoValues } from './types';

/**
 * スケジュールと出庫時間未設定データを取得する (Server Action)
 * @param startDate スケジュール開始日
 * @param totalDays 取得する合計日数
 * @returns
 */
export const getShukoList = async (startDate: string, totalDays: number) => {
  try {
    const result = await selectshukoTimeList(startDate, totalDays);

    const data = result.rows;

    if (!data || data.length === 0) {
      return [];
    }
    const EqTableData: DashboardTableValues[] = data.map((d) => ({
      calDat: d.cal_dat,
      kizaiHeadId: d.juchu_kizai_head_id ?? null,
      juchuHeadId: d.juchu_head_id ?? null,
      headNam: d.head_nam ?? null,
      koenNam: d.koen_nam ?? null,
      koenbashoNam: d.koenbasho_nam ?? null,
      kokyakuNam: d.kokyaku_nam ?? null,
      yardShukoDat: d.yard_shuko_dat ?? null,
      kicsShukoDat: d.kics_shuko_dat ?? null,
      yardNyukoDat: d.yard_nyuko_dat ?? null,
      kicsNyukoDat: d.kics_nyuko_dat ?? null,
    }));

    return EqTableData;
  } catch (e) {
    throw e;
  }
};

/**
 * 車両未設定データを取得する
 * @param startDate スケジュール開始日
 * @param totalDays 取得する合計日数
 * @returns
 */
export const getVehiclesList = async (startDate: string, totalDays: number) => {
  try {
    const result = await selectVehiclesList(startDate, totalDays);

    const data = result.rows;

    if (!data || data.length === 0) {
      return [];
    }
    const EqTableData: DashboardTableValues[] = data.map((d) => ({
      calDat: d.cal_dat,
      kizaiHeadId: d.juchu_kizai_head_id ?? null,
      juchuHeadId: d.juchu_head_id ?? null,
      headNam: d.head_nam ?? null,
      koenNam: d.koen_nam ?? null,
      koenbashoNam: d.koenbasho_nam ?? null,
      kokyakuNam: d.kokyaku_nam ?? null,
      yardShukoDat: d.yard_shuko_dat ?? null,
      kicsShukoDat: d.kics_shuko_dat ?? null,
      yardNyukoDat: d.yard_nyuko_dat ?? null,
      kicsNyukoDat: d.kics_nyuko_dat ?? null,
    }));

    return EqTableData;
  } catch (e) {
    console.error('Exception while selecting dashboard eqlist:', e);
    throw e;
  }
};

/**
 * スケジュール期間内にマイナス在庫となる機材リストを取得する (Server Action)
 * @param startDate スケジュール開始日
 * @param totalDays 取得する合計日数
 * @returns
 */

export const getMinusZaikoList = async (startDate: string, totalDays: number): Promise<MinusZaikoValues[]> => {
  try {
    const result = await selectMinusZaikoList(startDate, totalDays);
    const data = result.rows;

    if (!data || data.length === 0) {
      return [];
    }
    const MinusZikoData: MinusZaikoValues[] = data.map((d) => ({
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? null,
      kizaiQty: null,
      kizaiNgQty: null,
      bumonNam: null,
      daibumonNam: null,
      delFlg: null,
      dspFlg: null,
      mem: null,
      regAmt: null,
      shozokuNam: null,
      shukeibumonNam: null,
    }));

    return MinusZikoData;
  } catch (e) {
    console.error('Exception while selecting minus zaiko list:', e);
    throw e;
  }
};
