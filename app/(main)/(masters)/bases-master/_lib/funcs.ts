'use server';

import { revalidatePath } from 'next/cache';

import {
  insertNewShozoku,
  selectActiveShozokus,
  selectFilteredShozokus,
  selectOneShozoku,
  upDateShozokuDB,
} from '@/app/_lib/db/tables/m-shozoku';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { emptyBase } from './datas';
import { BasesMasterDialogValues, BasesMasterTableValues } from './types';

/**
 * 拠点の選択肢を取得する関数
 * @returns {SelectTypes[]} 所属拠点の選択肢
 */
export const getBasesSelections = async (): Promise<SelectTypes[]> => {
  try {
    const { data, error } = await selectActiveShozokus();

    if (error) {
      console.error(error.message, error.hint, error.cause, error.details);
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({ id: d.shozoku_id, label: d.shozoku_nam }));
  } catch (e) {
    throw e;
  }
};

/**
 * 所属マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<BasesMasterTableValues[]>} 所属マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredBases = async (query: string = '') => {
  try {
    const { data, error } = await selectFilteredShozokus(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredBases: BasesMasterTableValues[] = data.map((d, index) => ({
      shozokuId: d.shozoku_id,
      shozokuNam: d.shozoku_nam,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredBases.length, '行');
    return filteredBases;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された所属のデータを取得する関数
 * @param id 所属マスタID
 * @returns {Promise<BasesMasterDialogValues>} - 所属の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenBase = async (id: number) => {
  try {
    const { data, error } = await selectOneShozoku(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyBase;
    }
    // ダイアログ表示用に形成
    const baseDetails: BasesMasterDialogValues = {
      shozokuNam: data.shozoku_nam,
      mem: data.mem,
      delFlg: Boolean(data.del_flg),
    };
    console.log(baseDetails.delFlg);
    return baseDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 所属マスタに新規登録する関数
 * @param data フォームで取得した所属情報
 */
export const addNewBase = async (data: BasesMasterDialogValues, user: string) => {
  try {
    await insertNewShozoku(data, user);
    await revalidatePath('/bases-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 所属マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する所属マスタID
 */
export const updateBase = async (rawData: BasesMasterDialogValues, id: number, user: string) => {
  const date = new Date().toISOString();
  const updateData = {
    shozoku_id: id,
    shozoku_nam: rawData.shozokuNam,
    shozoku_nam_short: rawData.shozokuNam.slice(0, 1),
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.shozoku_nam);

  try {
    await upDateShozokuDB(updateData);
    await revalidatePath('/bases-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
