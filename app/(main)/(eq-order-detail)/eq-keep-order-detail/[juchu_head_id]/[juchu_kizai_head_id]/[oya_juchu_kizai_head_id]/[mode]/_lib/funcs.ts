'use server';

import {
  InsertKeepJuchuKizaiHead,
  SelectKeepJuchuKizaiHead,
  UpdateKeepJuchuKizaiHead,
} from '@/app/_lib/db/tables/t-juchu-kizai-head';
import {
  DeleteKeepJuchuKizaiMeisai,
  InsertKeepJuchuKizaiMeisai,
  UpdateKeepJuchuKizaiMeisai,
} from '@/app/_lib/db/tables/t-juchu-kizai-meisai';
import { SelectKeepJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { GetJuchuKizaiNyushuko } from '@/app/(main)/(eq-order-detail)/_lib/funcs';

import { KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from './types';

/**
 * キープ受注機材ヘッダー取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材ヘッダーデータ
 */
export const GetKeepJuchuKizaiHead = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await SelectKeepJuchuKizaiHead(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('GetEqHeader juchuKizaiHead error : ', error);
      return null;
    }

    const juchuDate = await GetJuchuKizaiNyushuko(juchuHeadId, juchuKizaiHeadId);

    const keepJucuKizaiHeadData: KeepJuchuKizaiHeadValues = {
      juchuHeadId: data.juchu_head_id,
      juchuKizaiHeadId: data.juchu_kizai_head_id,
      juchuKizaiHeadKbn: data.juchu_kizai_head_kbn,
      mem: data.mem ? data.mem : '',
      headNam: data.head_nam,
      oyaJuchuKizaiHeadId: data.oya_juchu_kizai_head_id,
      kicsShukoDat: juchuDate && juchuDate.kicsShukoDat,
      kicsNyukoDat: juchuDate && juchuDate.kicsNyukoDat,
      yardShukoDat: juchuDate && juchuDate.yardShukoDat,
      yardNyukoDat: juchuDate && juchuDate.yardNyukoDat,
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
export const AddKeepJuchuKizaiHead = async (
  keepJuchuKizaiHeadId: number,
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues,
  userNam: string
) => {
  const newData = {
    juchu_head_id: keepJuchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: keepJuchuKizaiHeadId,
    juchu_kizai_head_kbn: 3,
    mem: keepJuchuKizaiHeadData.mem,
    head_nam: keepJuchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    add_dat: new Date(),
    add_user: userNam,
  };
  try {
    const { error } = await InsertKeepJuchuKizaiHead(newData);

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
export const UpdKeepJuchuKizaiHead = async (juchuKizaiHeadData: KeepJuchuKizaiHeadValues, userNam: string) => {
  const updateData = {
    juchu_head_id: juchuKizaiHeadData.juchuHeadId,
    juchu_kizai_head_id: juchuKizaiHeadData.juchuKizaiHeadId,
    juchu_kizai_head_kbn: juchuKizaiHeadData.juchuKizaiHeadKbn,
    mem: juchuKizaiHeadData.mem,
    head_nam: juchuKizaiHeadData.headNam,
    oya_juchu_kizai_head_id: juchuKizaiHeadData.oyaJuchuKizaiHeadId,
    ht_kbn: 0,
    upd_dat: new Date(),
    upd_user: userNam,
  };

  try {
    const { error } = await UpdateKeepJuchuKizaiHead(updateData);

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
export const GetKeepJuchuKizaiMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    const { data, error } = await SelectKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId);
    if (error) {
      console.error('GetKeeoEqList keep eqList error : ', error);
      return [];
    }

    const keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      juchuKizaiMeisaiId: d.juchu_kizai_meisai_id,
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      oyaPlanKizaiQty: d.plan_kizai_qty,
      oyaPlanYobiQty: d.plan_yobi_qty,
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
export const AddKeepJuchuKizaiMeisai = async (
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[],
  userNam: string
) => {
  const newData = keepJuchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    mem: d.mem,
    keep_qty: d.keepQty,
    add_dat: new Date(),
    add_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    const { error } = await InsertKeepJuchuKizaiMeisai(newData);

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
export const UpdKeepJuchuKizaiMeisai = async (juchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[], userNam: string) => {
  const updateData = juchuKizaiMeisaiData.map((d) => ({
    juchu_head_id: d.juchuHeadId,
    juchu_kizai_head_id: d.juchuKizaiHeadId,
    juchu_kizai_meisai_id: d.juchuKizaiMeisaiId,
    kizai_id: d.kizaiId,
    mem: d.mem,
    keep_qty: d.keepQty,
    upd_dat: new Date(),
    upd_user: userNam,
    shozoku_id: d.shozokuId,
  }));

  try {
    for (const data of updateData) {
      const { error } = await UpdateKeepJuchuKizaiMeisai(data);

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
 * @param juchuKizaiMeisaiIds 受注機材明細id
 */
export const DelKeepJuchuKizaiMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiIds: number[]
) => {
  try {
    const { error } = await DeleteKeepJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadId, juchuKizaiMeisaiIds);

    if (error) {
      console.error('Error delete keep kizai meisai:', error.message);
    }
  } catch (e) {
    console.error(e);
  }
};
