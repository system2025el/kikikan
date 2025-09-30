'use server';

import {
  deleteJuchuContainerMeisai,
  insertJuchuContainerMeisai,
  updateJuchuContainerMeisai,
} from '@/app/_lib/db/tables/t-juchu-ctn-meisai';
import {
  insertKeepJuchuKizaiHead,
  selectKeepJuchuKizaiHead,
  updateKeepJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  deleteJuchuKizaiMeisai,
  insertJuchuKizaiMeisai,
  updateJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import {
  deleteContainerNyushukoDen,
  deleteNyushukoDen,
  insertNyushukoDen,
  selectContainerNyushukoDenConfirm,
  updateNyushukoDen,
} from '@/app/_lib/db/tables/t-nyushuko-den';
import { selectJuchuContainerMeisai } from '@/app/_lib/db/tables/v-juchu-ctn-meisai';
import { selectKeepJuchuKizaiMeisai, selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { JuchuCtnMeisai } from '@/app/_lib/db/types/t_juchu_ctn_meisai-type';
import { JuchuKizaiHead } from '@/app/_lib/db/types/t-juchu-kizai-head-type';
import { JuchuKizaiMeisai } from '@/app/_lib/db/types/t-juchu-kizai-meisai-type';
import { NyushukoDen } from '@/app/_lib/db/types/t-nyushuko-den-type';
import { Database } from '@/app/_lib/db/types/types';
import { toISOString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { getJuchuKizaiNyushuko } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { KeepJuchuContainerMeisaiValues, KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './types';

/**
 * キープ受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const getKeepJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await selectKeepJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    if (error || data?.oya_juchu_kizai_head_id === null) {
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      return null;
    }

    const juchuDate = await getJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    if (!juchuDate) throw new Error('受注機材入出庫日が存在しません');

    const keepJucuKizaiHeadData: KeepJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam ?? '',
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsShukoDat: juchuDate.kicsShukoDat ? new Date(juchuDate.kicsShukoDat) : null,
      kicsNyukoDat: juchuDate.kicsNyukoDat ? new Date(juchuDate.kicsNyukoDat) : null,
      yardShukoDat: juchuDate.yardShukoDat ? new Date(juchuDate.yardShukoDat) : null,
      yardNyukoDat: juchuDate.yardNyukoDat ? new Date(juchuDate.yardNyukoDat) : null,
    };

    console.log('keepJucuKizaiHeadData', keepJucuKizaiHeadData);
    return keepJucuKizaiHeadData;
  } catch (e) {
    console.log(e);
  }
};

/**
 * キープ受注機材ヘッダー新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param dspOrdNum 表示順
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepJuchuKizaiHead = async (
  keepJuchuKizaiHeadId: number,
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  userNam: string
) => {
  const newData: JuchuKizaiHead = {
    juchu_head_id: keepJuchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: keepJuchuKizaiHeadId,
    juchu_kizai_head_kbn: 3,
    mem: keepJuchuKizaiHeadData.mem,
    head_nam: keepJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  };
  try {
    const { error } = await insertKeepJuchuKizaiHead(newData);

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
 * キープ受注機材ヘッダー更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepJuchuKizaiHead = async (juchuKizaiHeadData: KeepJuchuKizaiHeadValues, userNam: string) => {
  const updateData: JuchuKizaiHead = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: juchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  };

  try {
    const { error } = await updateKeepJuchuKizaiHead(updateData);

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
 * キープ受注機材明細リスト取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns キープ受注機材明細
 */
export const getKeepJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  oyaJuchuKizaiHeadId: number
) => {
  try {
    const { data: keepData, error: keepError } = await selectKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (keepError) {
      console.error('GetKeeoEqList keep eqList error : ', keepError);
      return [];
    }

    const { data: oyaData, error: oyaError } = await selectOyaJuchuKizaiMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeeoEqList oya eqList error : ', oyaError);
      return [];
    }

    const keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = keepData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam ?? '',
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_kizai_qty ?? 0,
      oyaPlanYobiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.plan_yobi_qty ?? 0,
      keepQty: d.keep_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return keepJuchuKizaiMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * キープ受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepJuchuKizaiMeisai = async (
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const newData: JuchuKizaiMeisai[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    mem: d.mem,
    keep_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    const { error } = await insertJuchuKizaiMeisai(newData);

    if (error) {
      console.error('Error adding keep kizai meisai:', error.message);
      return false;
    } else {
      console.log('keep kizai meisai added successfully:', newData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding keep kizai meisai:', e);
    return false;
  }
};

/**
 * キープ受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepJuchuKizaiMeisai = async (juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData: JuchuKizaiMeisai[] = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    mem: d.mem,
    keep_qty: d.keepQty,
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
 * キープ受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const delKeepJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number, kizaiId: number[]) => {
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
 * キープ受注コンテナ明細取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param oyaJuchuKizaiHeadId 親受注機材ヘッダーid
 * @returns
 */
export const getKeepJuchuContainerMeisai = async (
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
      console.error('GetKeepContainerList keep containerList error : ', containerError);
      return [];
    }

    const { data: oyaData, error: oyaError } = await selectJuchuContainerMeisai(juchuHeadId, oyaJuchuKizaiHeadId);
    if (oyaError) {
      console.error('GetKeepCOntainerList oya containerList error : ', oyaError);
      return [];
    }

    const keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[] = containerData.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam ?? '',
      oyaPlanKicsKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.kics_plan_kizai_qty ?? 0,
      oyaPlanYardKizaiQty: oyaData.find((oya) => oya.kizai_id === d.kizai_id)?.yard_plan_kizai_qty ?? 0,
      kicsKeepQty: d.kics_keep_qty,
      yardKeepQty: d.yard_keep_qty,
      delFlag: false,
      saveFlag: true,
    }));
    return keepJuchuContainerMeisaiData;
  } catch (e) {
    console.error(e);
  }
};

/**
 * キープ受注コンテナ明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepJuchuContainerMeisai = async (
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const newKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.kicsKeepQty,
    shozoku_id: 1,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.yardKeepQty,
    shozoku_id: 2,
    mem: d.mem,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKicsData, ...newYardData];

  try {
    const { error } = await insertJuchuContainerMeisai(mergeData);

    if (error) {
      console.error('Error adding keep container meisai:', error.message);
      return false;
    } else {
      console.log('keep container meisai added successfully:', mergeData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding keep container meisai:', e);
    return false;
  }
};

/**
 * キープ受注コンテナ明細更新
 * @param juchuContainerMeisaiData 受注コンテナ明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepJuchuContainerMeisai = async (
  juchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  userNam: string
) => {
  const updateKicsData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.kicsKeepQty,
    shozoku_id: 1,
    mem: d.mem,
    upd_dat: toJapanTimeString(),
    upd_user: userNam,
  }));

  const updateYardData: JuchuCtnMeisai[] = juchuContainerMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    keep_qty: d.yardKeepQty,
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
        console.error('Error updating keep juchu container meisai:', error.message);
        continue;
      }
      console.log('keep juchu container meisai updated successfully:', data);
    }
    return true;
  } catch (e) {
    console.error('Exception while updating keep juchu container meisai:', e);
    return false;
  }
};

/**
 * キープ受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param deleteJuchuContainerMeisaiIds 受注コンテナ明細id
 */
export const delKeepJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  deleteJuchuContainerMeisaiIds: number[]
) => {
  try {
    const { error } = await deleteJuchuContainerMeisai(juchuHeadId, juchuKizaiHeadId, deleteJuchuContainerMeisaiIds);

    if (error) {
      console.error('Error delete keep container meisai:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

/**
 * キープ入出庫伝票新規追加
 * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const addKeepNyushukoDen = async (
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const newKeepShukoStandbyData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newKeepShukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const newKeepNyukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...newKeepShukoStandbyData, ...newKeepShukoCheckData, ...newKeepNyukoCheckData];

  try {
    const { error } = await insertNyushukoDen(mergeData);

    if (error) {
      console.error('Error adding keep nyushuko den:', error.message);
      return false;
    } else {
      console.log('keep nyushuko den added successfully:', mergeData);
      return true;
    }
  } catch (e) {
    console.error('Exception while adding keep nyushuko den:', e);
    return false;
  }
};

/**
 * キープ入出庫伝票更新
 * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
 * @param keepJuchuKizaiMeisaiData キープ受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updKeepNyushukoDen = async (
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const updateKeepShukoStandbyData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 10,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const updateKeepShukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 20,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const updateKeepNyukoCheckData: NyushukoDen[] = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    sagyo_kbn_id: 30,
    sagyo_den_dat:
      d.shozokuId === 1
        ? toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date)
        : toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
    sagyo_id: d.shozokuId,
    kizai_id: d.kizaiId,
    plan_qty: d.keepQty,
    add_dat: toJapanTimeString(),
    add_user: userNam,
  }));

  const mergeData = [...updateKeepShukoStandbyData, ...updateKeepShukoCheckData, ...updateKeepNyukoCheckData];

  try {
    for (const data of mergeData) {
      const { error } = await updateNyushukoDen(data);

      if (error) {
        console.error('Error updating keep nyushuko den:', error.message);
        continue;
      }
    }
    console.log('keep nyushuko den updated successfully:', mergeData);
    return true;
  } catch (e) {
    console.error('Exception while updating keep nyushuko den:', e);
    return false;
  }
};

// /**
//  * キープコンテナ入出庫伝票新規追加
//  * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
//  * @param keepJuchuContainerMeisaiData キープ受注コンテナ明細データ
//  * @param userNam ユーザー名
//  * @returns
//  */
// export const addKeepContainerNyushukoDen = async (
//   keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
//   keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
//   userNam: string
// ) => {
//   const newKeepKicsShukoStandbyData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 10,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
//     sagyo_id: 1,
//     kizai_id: d.kizaiId,
//     plan_qty: d.kicsKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const newKeepYardShukoStandbyData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 10,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//     sagyo_id: 2,
//     kizai_id: d.kizaiId,
//     plan_qty: d.yardKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const newKeepKicsShukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 20,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
//     sagyo_id: 1,
//     kizai_id: d.kizaiId,
//     plan_qty: d.kicsKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const newKeepYardShukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 20,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//     sagyo_id: 2,
//     kizai_id: d.kizaiId,
//     plan_qty: d.yardKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const newKeepKicsNyukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 30,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date),
//     sagyo_id: 1,
//     kizai_id: d.kizaiId,
//     plan_qty: d.kicsKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const newKeepYardNyukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 30,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
//     sagyo_id: 2,
//     kizai_id: d.kizaiId,
//     plan_qty: d.yardKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const mergeData = [
//     ...newKeepKicsShukoStandbyData,
//     ...newKeepYardShukoStandbyData,
//     ...newKeepKicsShukoCheckData,
//     ...newKeepYardShukoCheckData,
//     ...newKeepKicsNyukoCheckData,
//     ...newKeepYardNyukoCheckData,
//   ];

//   try {
//     const { error } = await insertNyushukoDen(mergeData);

//     if (error) {
//       console.error('Error adding keep container nyushuko den:', error.message);
//       return false;
//     } else {
//       console.log('keep container nyushuko den added successfully:', mergeData);
//       return true;
//     }
//   } catch (e) {
//     console.error('Exception while adding keep container nyushuko den:', e);
//     return false;
//   }
// };

// /**
//  * キープコンテナ入出庫伝票更新
//  * @param keepJuchuKizaiHeadData キープ受注機材ヘッダーデータ
//  * @param keepJuchuContainerMeisaiData キープ受注コンテナ明細データ
//  * @param userNam ユーザー名
//  * @returns
//  */
// export const updKeepContainerNyushukoDen = async (
//   keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
//   keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
//   userNam: string
// ) => {
//   const updateKeepKicsShukoStandbyData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 10,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
//     sagyo_id: 1,
//     kizai_id: d.kizaiId,
//     plan_qty: d.kicsKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepYardShukoStandbyData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 10,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//     sagyo_id: 2,
//     kizai_id: d.kizaiId,
//     plan_qty: d.yardKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepKicsShukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 20,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
//     sagyo_id: 1,
//     kizai_id: d.kizaiId,
//     plan_qty: d.kicsKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepYardShukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 20,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
//     sagyo_id: 2,
//     kizai_id: d.kizaiId,
//     plan_qty: d.yardKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepKicsNyukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 30,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date),
//     sagyo_id: 1,
//     kizai_id: d.kizaiId,
//     plan_qty: d.kicsKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const updateKeepYardNyukoCheckData: NyushukoDen[] = keepJuchuContainerMeisaiData.map((d) => ({
//     juchu_head_id: d.juchuHeadId,
//     juchu_kizai_head_id: d.juchuKizaiHeadId,
//     juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
//     sagyo_kbn_id: 30,
//     sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
//     sagyo_id: 2,
//     kizai_id: d.kizaiId,
//     plan_qty: d.yardKeepQty,
//     add_dat: toJapanTimeString(),
//     add_user: userNam,
//   }));

//   const mergeData = [
//     ...updateKeepKicsShukoStandbyData,
//     ...updateKeepYardShukoStandbyData,
//     ...updateKeepKicsShukoCheckData,
//     ...updateKeepYardShukoCheckData,
//     ...updateKeepKicsNyukoCheckData,
//     ...updateKeepYardNyukoCheckData,
//   ];

//   try {
//     for (const data of mergeData) {
//       const { error } = await updateNyushukoDen(data);

//       if (error) {
//         console.error('Error updating keep container nyushuko den:', error.message);
//         continue;
//       }
//     }
//     console.log('keep container nyushuko den updated successfully:', mergeData);
//     return true;
//   } catch (e) {
//     console.error('Exception while updating keep container nyushuko den:', e);
//     return false;
//   }
// };

/**
 * キープ入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const delKeepNyushukoDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    const { error } = await deleteNyushukoDen(juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiIds);

    if (error) {
      console.error('Error delete keep nyushuko den:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};

export const updKeepContainerNyushukoDen = async (
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[],
  userNam: string
) => {
  for (const data of keepJuchuContainerMeisaiData) {
    const kicsData =
      !data.delFlag && data.kicsKeepQty
        ? [
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 10,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.kicsKeepQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 20,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsShukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.kicsKeepQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 30,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.kicsNyukoDat as Date),
              sagyo_id: 1,
              kizai_id: data.kizaiId,
              plan_qty: data.kicsKeepQty,
            },
          ]
        : null;
    const yardData =
      !data.delFlag && data.yardKeepQty
        ? [
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 10,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.yardKeepQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 20,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardShukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.yardKeepQty,
            },
            {
              juchu_head_id: data.juchuHeadId,
              juchu_kizai_head_id: data.juchuKizaiHeadId,
              juchu_kizai_meisai_id: data.juchuKizaiMeisaiId,
              sagyo_kbn_id: 30,
              sagyo_den_dat: toISOString(keepJuchuKizaiHeadData.yardNyukoDat as Date),
              sagyo_id: 2,
              kizai_id: data.kizaiId,
              plan_qty: data.yardKeepQty,
            },
          ]
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
        for (const data of kicsData) {
          const { error: updateError } = await updateNyushukoDen({
            ...data,
            upd_dat: toJapanTimeString(),
            upd_user: userNam,
          });
          if (updateError) {
            console.error('Error updating kics keep container nyushuko den:', updateError.message);
            continue;
          }
        }
      } else if (kicsConfirmResult.data && kicsConfirmResult.data.length > 0 && !kicsData) {
        const { error: deleteError } = await deleteContainerNyushukoDen(kicsConfirmData);
        if (deleteError) {
          console.error('Error delete kics keep container nyushuko den:', deleteError.message);
          continue;
        }
      } else if (kicsConfirmResult!.data && kicsData) {
        const { error: insertError } = await insertNyushukoDen(
          kicsData.map((d) => ({
            ...d,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          }))
        );
        if (insertError) {
          console.error('Error insert kics keep container nyushuko den:', insertError.message);
          continue;
        }
      }
      if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && yardData) {
        for (const data of yardData) {
          const { error: updateError } = await updateNyushukoDen({
            ...data,
            upd_dat: toJapanTimeString(),
            upd_user: userNam,
          });
          if (updateError) {
            console.error('Error updating yard keep container nyushuko den:', updateError.message);
            continue;
          }
        }
      } else if (yardConfirmResult.data && yardConfirmResult.data.length > 0 && !yardData) {
        const { error: deleteError } = await deleteContainerNyushukoDen(yardConfirmData);
        if (deleteError) {
          console.error('Error delete yard keep container nyushuko den:', deleteError.message);
          continue;
        }
      } else if (yardConfirmResult!.data && yardData) {
        const { error: insertError } = await insertNyushukoDen(
          yardData.map((d) => ({
            ...d,
            add_dat: toJapanTimeString(),
            add_user: userNam,
          }))
        );
        if (insertError) {
          console.error('Error updating yard keep container nyushuko den:', insertError.message);
          continue;
        }
      }
      console.log('keep container nyushuko den updated successfully:', data);
    } catch (e) {
      console.error(e);
    }
  }
};
