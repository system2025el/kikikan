'use server';

import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  insertReturnJuchuKizaiHead,
  selectJuchuHonbanbiQty,
  selectReturnJuchuKizaiHead,
  updateReturnJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteContainerNyushukoDen,
  deleteNyushukoDen,
  insertNyushukoDen,
  selectContainerNyushukoDenConfirm,
  updateNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import {
  deleteNyushukoFix,
  insertNyushukoFix,
  selectNyushukoFixConfirm,
  updateNyushukoFix,
} from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectOyaJuchuKizaiMeisai, selectReturnJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { NyushukoFix } from '@/app/_lib/db/types/t-nyushuko-fix-type';
import { toISOString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { getJuchuKizaiNyushuko } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { ReturnJuchuContainerMeisaiValues, ReturnJuchuKizaiHeadValues, ReturnJuchuKizaiMeisaiValues } from './types';

export const getJuchuHonbanbiQty = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectJuchuHonbanbiQty(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('getJuchuHonbanbiQty error : ', error);
      return null;
    }

    return data.juchu_honbanbi_qty;
  } catch (e) {
    console.error(e);
    return null;
  }
};

/**
 * 返却受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getReturnJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectReturnJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    if (error || data?.oya_juchu_kizai_head_id === null) {
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      return null;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const returnJucuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      juchuHonbanbiQty: data.juchu_honbanbi_qty,
      nebikiAmt: data.nebiki_amt,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam ?? '',
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };

    console.log('returnJucuKizaiHeadData', returnJucuKizaiHeadData);
    return returnJucuKizaiHeadData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注機材ヘッダー新規追加
 * @param returnJuchuKizaiHeadId 受注機材ヘッダーid
 * @param returnJuchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnJuchuKizaiHead = async (
  returnJuchuKizaiHeadId: number,
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  userNam: string
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: returnJuchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: returnJuchuKizaiHeadId,
    juchu_kizai_head_kbn: 2,
    juchu_honbanbi_qty: returnJuchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: returnJuchuKizaiHeadData.nebikiAmt,
    mem: returnJuchuKizaiHeadData.mem,
    head_nam: returnJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    const { error } = await insertReturnJuchuKizaiHead(newData);

    if (error) {
      console.error('Error adding new juchuKizaiHead:', error.message);
      return false;
    } else {
      console.log('New juchuKizaiHead added successfully:', newData);
      return true;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 返却受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnJuchuKizaiHead = async (juchuKizaiHeadData: ReturnJuchuKizaiHeadValues, userNam: string) => {
  const updateData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    juchu_honbanbi_qty: juchuKizaiHeadData.juchuHonbanbiQty,
    nebiki_amt: juchuKizaiHeadData.nebikiAmt,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: juchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    const { error } = await updateReturnJuchuKizaiHead(updateData);

    if (error) {
      console.error('Error updating juchu kizai head:', error.message);
      return false;
    }
    console.log('juchu kizai head updated successfully:', updateData);
    return true;
  } catch (e) {
    console.error('Exception while updating juchu kizai head:', e);
    return false;
  }
};

/**
 * 返却受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 返却受注機材明細
 */
export const getReturnJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const { data: returnData, error: returnError } = await selectReturnJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (returnError) {
      console.error('GetKeeoEqList keep eqList error : ', returnError);
      return [];
    }

    const { data: eqTanka, error: eqTankaError } = await selectJuchuKizaiMeisaiKizaiTanka(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (eqTankaError) {
      console.error('GetEqHeader eqTanka error : ', eqTankaError);
      return [];
    }

    const { data: oyaData, error: oyaError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeeoEqList oya eqList error : ', oyaError);
      return [];
    }

    const returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = returnData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiTankaAmt: eqTanka.find((t) => t.kizai_id === d.kizai_id)?.kizai_tanka_amt || 0,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_yobi_qty ?? 0,
      planKizaiQty: d.plan_kizai_qty ? -1 * d.plan_kizai_qty : d.plan_kizai_qty,
      planYobiQty: d.plan_yobi_qty ? -1 * d.plan_yobi_qty : d.plan_yobi_qty,
      planQty: d.plan_qty ? -1 * d.plan_qty : d.plan_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注機材明細新規追加
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnJuchuKizaiMeisai = async (
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const newData: JuchuKizaiMeisai[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty ? -1 * d.planKizaiQty : d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty ? -1 * d.planYobiQty : d.planYobiQty,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));
  try {
    try {
      const { error } = await insertJuchuKizaiMeisai(newData);

      if (error) {
        console.error('Error adding return kizai meisai:', error.message);
        return false;
      } else {
        console.log('return kizai meisai added successfully:', newData);
        return true;
      }
    } catch (e) {
      console.error('Exception while adding return kizai meisai:', e);
      return false;
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注機材明細更新
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnJuchuKizaiMeisai = async (
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const updateData: JuchuKizaiMeisai[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    kizai_tanka_amt: d.kizaiTankaAmt,
    plan_kizai_qty: d.planKizaiQty ? -1 * d.planKizaiQty : d.planKizaiQty,
    plan_yobi_qty: d.planYobiQty ? -1 * d.planYobiQty : d.planYobiQty,
    mem: d.mem,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      const { error } = await updateJuchuKizaiMeisai(data);

      if (error) {
        console.error('Error updating keep juchu kizai meisai:', error.message);
        continue;
      }
      console.log('keep juchu kizai meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating keep juchu kizai meisai:', e);
    return false;
  }
};

/**
 * 返却受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delReturnJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number[]) => {
  try {
    const { error } = await deleteJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, kizaiId);

    if (error) {
      console.error('Error delete keep kizai meisai:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注コンテナ明細データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @returns 返却受注コンテナ明細データ
 */
export const getReturnJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const { data: containerData, error: containerError } = await selectJuchuContainerMeisai(
      juchuHeadId,
      juchuKizaiHeadId
    );
    if (containerError) {
      console.error('GetReturnContainerList return containerList error : ', containerError);
      return [];
    }

    const { data: oyaData, error: oyaError } = await selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetReturnCOntainerList oya containerList error : ', oyaError);
      return [];
    }

    const returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKicsKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.kics_plan_kizai_qty ?? 0,
      oyaPlanYardKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.yard_plan_kizai_qty ?? 0,
      planKicsKizaiQty: d.kics_plan_kizai_qty ? -1 * d.kics_plan_kizai_qty : d.kics_plan_kizai_qty,
      planYardKizaiQty: d.yard_plan_kizai_qty ? -1 * d.yard_plan_kizai_qty : d.yard_plan_kizai_qty,
      planQty: -1 * (d.kics_plan_kizai_qty + d.yard_plan_kizai_qty),
      delFlag: false,
      saveFlag: true,
    }));
    return returnJuchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却受注コンテナ明細新規追加
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnJuchuContainerMeisai = async (
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const newKicsData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty ? -1 * d.planKicsKizaiQty : d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty ? -1 * d.planYardKizaiQty : d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    const { error } = await insertJuchuContainerMeisai(mergeData);

    if (error) {
      console.error('Error adding return container meisai:', error.message);
      return false;
    } else {
      console.log('return container meisai added successfully:', mergeData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding return container meisai:', e);
    return false;
  }
};

/**
 * 返却受注コンテナ明細更新
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnJuchuContainerMeisai = async (
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const updateKicsData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planKicsKizaiQty ? -1 * d.planKicsKizaiQty : d.planKicsKizaiQty,
    shozoku_id: 1,
    mem: d.mem,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateYardData: JuchuCtnMeisai[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    plan_kizai_qty: d.planYardKizaiQty ? -1 * d.planYardKizaiQty : d.planYardKizaiQty,
    shozoku_id: 2,
    mem: d.mem,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const mergeData = [...updateKicsData, ...updateYardData];

  try {
    for (const data of mergeData) {
      const { error } = await updateJuchuContainerMeisai(data);

      if (error) {
        console.error('Error updating return juchu container meisai:', error.message);
        continue;
      }
      console.log('return juchu container meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating return juchu container meisai:', e);
    return false;
  }
};

/**
 * 返却受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param deleteJuchuContainerMeisaiIds 受注コンテナ明細id
 */
export const delReturnJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[]
) => {
  try {
    const { error } = await deleteJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, kizaiId);

    if (error) {
      console.error('Error delete return container meisai:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却入出庫伝票新規追加
 * @param juchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param juchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const newReturnNyukoCheckData: NyushukoDen[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    const { error } = await insertNyushukoDen(newReturnNyukoCheckData);

    if (error) {
      console.error('Error adding return nyushuko den:', error.message);
      return false;
    } else {
      console.log('return nyushuko den added successfully:', newReturnNyukoCheckData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding return nyushuko den:', e);
    return false;
  }
};

/**
 * 返却入出庫伝票更新
 * @param returnJuchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param returnJuchuKizaiMeisaiData 返却受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const updateReturnNyukoCheckData: NyushukoDen[] = returnJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.planQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  try {
    for (const data of updateReturnNyukoCheckData) {
      const { error } = await updateNyushukoDen(data);

      if (error) {
        console.error('Error updating return nyushuko den:', error.message);
        continue;
      }
    }
    console.log('return nyushuko den updated successfully:', updateReturnNyukoCheckData);
    return true;
  } catch (e) {
    console.error('Exception while updating return nyushuko den:', e);
    return false;
  }
};

/**
 * 返却入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delReturnNyushukoDen = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number[]) => {
  try {
    const { error } = await deleteNyushukoDen(juchuHeadId, juchuKizaiHeadId, kizaiId);

    if (error) {
      console.error('Error delete return nyushuko den:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * 返却コンテナ入出庫伝票更新
 * @param returnJuchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 */
export const updReturnContainerNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  for (const data of returnJuchuContainerMeisaiData) {
    const kicsData =
      !data.delFlag && data.planKicsKizaiQty
        ? {
            juchu_head_id: data.juchuHeadId,
            juchu_kizai_head_id: data.juchuKizaiHeadId,
            juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
            sagyo_kbn_id: 30,
            sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date),
            sagyo_id: 1,
            kizai_id: data.kizaiId,
            plan_qty: data.planKicsKizaiQty,
          }
        : null;
    const yardData =
      !data.delFlag && data.planYardKizaiQty
        ? {
            juchu_head_id: data.juchuHeadId,
            juchu_kizai_head_id: data.juchuKizaiHeadId,
            juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
            sagyo_kbn_id: 30,
            sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
            sagyo_id: 2,
            kizai_id: data.kizaiId,
            plan_qty: data.planYardKizaiQty,
          }
        : null;
    const kicsConfirmData = {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
      kizai_id: data.kizaiId,
      sagyo_id: 1,
    };
    const yardConfirmData = {
      juchu_head_id: data.juchuHeadId,
      juchu_kizai_head_id: data.juchuKizaiHeadId,
      juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
      kizai_id: data.kizaiId,
      sagyo_id: 2,
    };

    try {
      const kicsConfirmResult = await selectContainerNyushukoDenConfirm(kicsConfirmData);
      const yardConfirmResult = await selectContainerNyushukoDenConfirm(yardConfirmData);

      if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && kicsData) {
        const { error: updateError } = await updateNyushukoDen({
          ...kicsData,
          upd_dat: toJapanTimeString(),
          upd_user: userNam,
        });
        if (updateError) {
          console.error('Error updating kics return container nyushuko den:', updateError.message);
          continue;
        }
      } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kicsData) {
        const { error: deleteError } = await deleteContainerNyushukoDen(kicsConfirmData);
        if (deleteError) {
          console.error('Error delete kics return container nyushuko den:', deleteError.message);
          continue;
        }
      } else if (kicsConfirmResult!.data && kicsData) {
        const { error: insertError } = await insertNyushukoDen([
          {
            ...kicsData,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          },
        ]);
        if (insertError) {
          console.error('Error insert kics return container nyushuko den:', insertError.message);
          continue;
        }
      }
      if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yardData) {
        const { error: updateError } = await updateNyushukoDen({
          ...yardData,
          upd_dat: toJapanTimeString(),
          upd_user: userNam,
        });
        if (updateError) {
          console.error('Error updating yard return container nyushuko den:', updateError.message);
          continue;
        }
      } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yardData) {
        const { error: deleteError } = await deleteContainerNyushukoDen(yardConfirmData);
        if (deleteError) {
          console.error('Error delete yard return container nyushuko den:', deleteError.message);
          continue;
        }
      } else if (yardConfirmResult!.data && yardData) {
        const { error: insertError } = await insertNyushukoDen([
          {
            ...yardData,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          },
        ]);
        if (insertError) {
          console.error('Error updating yard return container nyushuko den:', insertError.message);
          continue;
        }
      }
      console.log('return container nyushuko den updated successfully:', data);
    } catch (e) {
      console.error(e);
    }
  }
};

/**
 * 返却入出庫確定更新
 * @param data 返却受注機材ヘッダーデータ
 * @param kics KICS機材判定
 * @param yard YARD機材判定
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnNyushukoFix = async (
  data: ReturnJuchuKizaiHeadValues,
  kics: boolean,
  yard: boolean,
  userNam: string
) => {
  const kicsData: NyushukoFix = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_kbn_id: 70,
    sagyo_den_dat: toISOString(data.kicsNyukoDat as Date),
    sagyo_id: 1,
  };
  const yardData: NyushukoFix = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_kbn_id: 70,
    sagyo_den_dat: toISOString(data.yardNyukoDat as Date),
    sagyo_id: 2,
  };
  const kicsConfirmData = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_id: 1,
  };
  const yardConfirmData = {
    juchu_head_id: data.juchuHeadId,
    juchu_kizai_head_id: data.juchuKizaiHeadId,
    sagyo_id: 2,
  };

  try {
    const kicsConfirmResult = await selectNyushukoFixConfirm(kicsConfirmData);
    const yardConfirmResult = await selectNyushukoFixConfirm(yardConfirmData);

    // KICS更新
    if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && kics) {
      const { error: updateError } = await updateNyushukoFix({
        ...kicsData,
        upd_dat: toJapanTimeString(),
        upd_user: userNam,
      });
      if (updateError) {
        console.error('Error updating kics return nyushuko fix:', updateError.message);
        throw new Error();
      }

      // KICS削除
    } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kics) {
      const { error: deleteError } = await deleteNyushukoFix(kicsConfirmData);
      if (deleteError) {
        console.error('Error delete kics return nyushuko fix:', deleteError.message);
        throw new Error();
      }
      // KICS追加
    } else if (kicsConfirmResult!.data && kics) {
      const { error: insertError } = await insertNyushukoFix([
        {
          ...kicsData,
          sagyo_fix_flg: 0,
          add_dat: toJapanTimeString(),
          add_user: userNam,
        },
      ]);
      if (insertError) {
        console.error('Error insert kics return nyushuko fix:', insertError.message);
        throw new Error();
      }
    }

    // YARD更新
    if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yard) {
      const { error: updateError } = await updateNyushukoFix({
        ...yardData,
        upd_dat: toJapanTimeString(),
        upd_user: userNam,
      });
      if (updateError) {
        console.error('Error updating yard return nyushuko fix:', updateError.message);
        throw new Error();
      }

      // YARD削除
    } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yard) {
      const { error: deleteError } = await deleteNyushukoFix(yardConfirmData);
      if (deleteError) {
        console.error('Error delete yard return nyushuko fix:', deleteError.message);
        throw new Error();
      }
      // YARD追加
    } else if (yardConfirmResult!.data && yard) {
      const { error: insertError } = await insertNyushukoFix([
        {
          ...yardData,
          sagyo_fix_flg: 0,
          add_dat: toJapanTimeString(),
          add_user: userNam,
        },
      ]);
      if (insertError) {
        console.error('Error insert yard return nyushuko fix:', insertError.message);
        throw new Error();
      }
    }
    console.log('return nyushuko fix updated successfully:', data);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};
