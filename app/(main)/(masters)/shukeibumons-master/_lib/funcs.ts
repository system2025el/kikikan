'use server';

import { revalidatePath } from 'next/cache';

import {
  insertNewShukeibumon,
  selectFilteredShukeibumons,
  selectOneShukeibumon,
  upDateShukeibumonDB,
} from '@/app/_lib/db/tables/m-shukeibumon';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyShukeibumon } from './datas';
import { ShukeibumonsMasterDialogValues, ShukeibumonsMasterTableValues } from './types';

/**
 * 集計部門マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<ShukeibumonsMasterTableValues[]>} 集計部門マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredShukeibumons = async (query: string = '') => {
  try {
    const { data, error } = await selectFilteredShukeibumons(query);
    if (error) {
      console.error('DB情報取得エラー:', error);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 集計部門マスタ画面テーブル用に成型
    const filteredShukeibumons: ShukeibumonsMasterTableValues[] = data.map((d, index) => ({
      shukeibumonId: d.shukei_bumon_id,
      shukeibumonNam: d.shukei_bumon_nam,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredShukeibumons.length);
    return filteredShukeibumons;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された集計部門のデータを取得する関数
 * @param id 集計部門マスタID
 * @returns {Promise<ShukeibumonsMasterDialogValues>} - 集計部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenShukeibumon = async (id: number) => {
  try {
    const { data, error } = await selectOneShukeibumon(id);
    if (error) {
      console.error('DB情報取得エラー:', error);
      throw error;
    }
    if (!data) {
      return emptyShukeibumon;
    }

    const ShukeibumonDetails: ShukeibumonsMasterDialogValues = {
      shukeibumonNam: data.shukei_bumon_nam,
      delFlg: Boolean(data.del_flg),
      mem: data.mem,
    };
    return ShukeibumonDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 集計部門マスタに新規登録する関数
 * @param data フォームで取得した集計部門情報
 */
export const addNewShukeibumon = async (data: ShukeibumonsMasterDialogValues) => {
  try {
    await insertNewShukeibumon(data);
    console.log('data : ', data);
    await revalidatePath('/bumons-master');
    await revalidatePath('/shukeibumons-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 集計部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する集計部門マスタID
 */
export const updateShukeibumon = async (rawData: ShukeibumonsMasterDialogValues, id: number) => {
  const date = toJapanTimeString();
  const updateData = {
    shukei_bumon_id: id,
    shukei_bumon_nam: rawData.shukeibumonNam,
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(updateData.shukei_bumon_nam);
  try {
    await upDateShukeibumonDB(updateData);
    await revalidatePath('/bumons-master');
    await revalidatePath('/shukeibumons-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
