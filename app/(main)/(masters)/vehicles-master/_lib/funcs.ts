'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { insertMasterUpdates } from '@/app/_lib/db/tables/m-master-update';
import { insertNewVeh, SelectFilteredVehs, selectOneVeh, upDateVehDB } from '@/app/_lib/db/tables/m-sharyou';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyVeh } from './datas';
import { VehsMasterDialogValues, VehsMasterTableValues } from './types';

/**
 * 車両マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<VehsMasterTableValues[]>} 車両マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredVehs = async (query: string = '') => {
  try {
    const { data, error } = await SelectFilteredVehs(/*query*/);

    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredVehs: VehsMasterTableValues[] = data.map((d, index) => ({
      sharyoId: d.sharyo_id,
      sharyoNam: d.sharyo_nam,
      mem: d.mem,
      dspFlg: Boolean(d.dsp_flg),
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredVehs.length, '行');
    return filteredVehs;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された車両のデータを取得する関数
 * @param id 車両マスタID
 * @returns {Promise<VehsMasterDialogValues>} - 車両の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenVeh = async (id: number) => {
  try {
    const { data, error } = await selectOneVeh(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyVeh;
    }
    const VehDetails: VehsMasterDialogValues = {
      sharyoNam: data.sharyo_nam,
      mem: data.mem,
      dspFlg: Boolean(data.dsp_flg),
      delFlg: Boolean(data.del_flg),
    };
    console.log(VehDetails.delFlg);
    return VehDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 車両マスタに新規登録する関数
 * @param data フォームで取得した車両情報
 */
export const addNewVeh = async (data: VehsMasterDialogValues) => {
  console.log(data.sharyoNam);
  try {
    await insertNewVeh(data);
    await revalidatePath('/vehicles-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 車両マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する車両マスタID
 */
export const updateVeh = async (data: VehsMasterDialogValues, id: number) => {
  const date = toJapanTimeString();
  const updateData = {
    sharyo_id: id,
    sharyo_nam: data.sharyoNam,
    del_flg: Number(data.delFlg),
    mem: data.mem,
    dsp_flg: Number(data.dspFlg),
    upd_dat: date,
    upd_user: 'test_user',
  };
  try {
    await upDateVehDB(updateData);
    await Promise.all([upDateVehDB(updateData), insertMasterUpdates('m_sharyo')]);
    await revalidatePath('/vehicles-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
