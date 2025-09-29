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
  deleteReturnJuchuKizaiMeisai,
  insertReturnJuchuKizaiMeisai,
  selectJuchuKizaiMeisaiKizaiTanka,
  updateReturnJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { deleteNyushukoDen, insertNyushukoDen, updateNyushukoDen } from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectOyaJuchuKizaiMeisai, selectReturnJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
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
      const { error } = await insertReturnJuchuKizaiMeisai(newData);

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
      const { error } = await updateReturnJuchuKizaiMeisai(data);

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
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const delReturnJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    const { error } = await deleteReturnJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiIds);

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
  deleteJuchuContainerMeisaiIds: number[]
) => {
  try {
    const { error } = await deleteJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, deleteJuchuContainerMeisaiIds);

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
 * 返却コンテナ入出庫伝票新規追加
 * @param returnJuchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addReturnContainerNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const newKicsNyukoCheckData: NyushukoDen[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date),
    sagyo_id: 1,
    kizai_id: d.kizaiId,
    plan_qty: d.planKicsKizaiQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newYardNyukoCheckData: NyushukoDen[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: 2,
    kizai_id: d.kizaiId,
    plan_qty: d.planYardKizaiQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsNyukoCheckData, ...newYardNyukoCheckData];

  try {
    const { error } = await insertNyushukoDen(mergeData);

    if (error) {
      console.error('Error adding return container nyushuko den:', error.message);
      return false;
    } else {
      console.log('return container nyushuko den added successfully:', mergeData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding return container nyushuko den:', e);
    return false;
  }
};

/**
 * 返却コンテナ入出庫伝票更新
 * @param returnJuchuKizaiHeadData 返却受注機材ヘッダーデータ
 * @param returnJuchuContainerMeisaiData 返却受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updReturnContainerNyushukoDen = async (
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues,
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const updateKicsNyukoCheckData: NyushukoDen[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.kicsNyukoDat as Date),
    sagyo_id: 1,
    kizai_id: d.kizaiId,
    plan_qty: d.planKicsKizaiQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const updateYardNyukoCheckData: NyushukoDen[] = returnJuchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat: toISOString(returnJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: 2,
    kizai_id: d.kizaiId,
    plan_qty: d.planYardKizaiQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...updateKicsNyukoCheckData, ...updateYardNyukoCheckData];

  try {
    for (const data of mergeData) {
      const { error } = await updateNyushukoDen(data);

      if (error) {
        console.error('Error updating return container nyushuko den:', error.message);
        continue;
      }
    }
    console.log('return container nyushuko den updated successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating return container nyushuko den:', e);
    return false;
  }
};

/**
 * 返却入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const delReturnNyushukoDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    const { error } = await deleteNyushukoDen(juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiIds);

    if (error) {
      console.error('Error delete return nyushuko den:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};
