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
      headKbn: d.juchu_kizai_head_kbn ?? null,
      oyaJuchuKizaiHeadId: d.oya_juchu_kizai_head_id ?? null,
    }));
    return EqTableData;
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
      headKbn: d.juchu_kizai_head_kbn ?? null,
      oyaJuchuKizaiHeadId: d.oya_juchu_kizai_head_id ?? null,
    }));
    return EqTableData;
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

/**
 * ダッシュボードの3つの表（出庫時刻未設定・車両未設定・マイナス在庫）をまとめて取得する (Server Action)
 * Server Action は1本ずつ順番に処理され、1往復ごとに時間が上乗せされるので、
 * 画面からは1回の呼び出しで済ませ、サーバー側で3つを同時に取る
 * （エラーの記録は中で呼ぶ各取得関数が行う）
 * @param startDate スケジュール開始日
 * @param totalDays 取得する合計日数
 * @returns 出庫時刻未設定・車両未設定・マイナス在庫の各リスト
 */
export const getDashboardData = async (startDate: string, totalDays: number) => {
  const [shukoData, vehiclesData, minusZaikoData] = await Promise.all([
    getShukoList(startDate, totalDays),
    getVehiclesList(startDate, totalDays),
    getMinusZaikoList(startDate, totalDays),
  ]);
  return { shukoData, vehiclesData, minusZaikoData };
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
