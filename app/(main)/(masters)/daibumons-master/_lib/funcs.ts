'use server';

import { revalidatePath } from 'next/cache';

import {
  insertNewDaibumon,
  selectFilteredDaibumons,
  selectOneDaibumon,
  updateDaibumonDB,
} from '@/app/_lib/db/tables/m-daibumon';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyDaibumon } from './datas';
import { DaibumonsMasterDialogValues, DaibumonsMasterTableValues } from './types';

/**
 * 大部門マスタのデータを取得する関数、引数無は全取得
 * @param query 大部門名検索キーワード
 * @returns {Promise<DaibumonsMasterTableValues[]>} 大部門マスタテーブルに表示するデータ配列（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredDaibumons = async (query: string = '') => {
  try {
    const { data, error } = await selectFilteredDaibumons(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 大部門マスタ画面のテーブル要に形成
    const filteredDaibumons: DaibumonsMasterTableValues[] = data.map((d, index) => ({
      daibumonId: d.dai_bumon_id,
      daibumonNam: d.dai_bumon_nam,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log('大部門マスタ', filteredDaibumons.length, '件');
    return filteredDaibumons;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された大部門のデータを取得する関数
 * @param id 選択した大部門マスタID
 * @returns {Promise<DaibumonsMasterDialogValues>} - 大部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenDaibumon = async (id: number) => {
  try {
    const { data, error } = await selectOneDaibumon(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyDaibumon;
    }
    // ダイアログ表示用に形成
    const daibumonDetails: DaibumonsMasterDialogValues = {
      daibumonNam: data.dai_bumon_nam,
      delFlg: Boolean(data.del_flg),
      mem: data.mem,
    };
    return daibumonDetails;
  } catch (e) {
    console.error('予期せぬ例外が発生しました:', e);
    throw e;
  }
};

/**
 * 大部門マスタに新規登録する関数
 * @param data フォームで取得した大部門情報
 */
export const addNewDaibumon = async (data: DaibumonsMasterDialogValues, user: string) => {
  try {
    await insertNewDaibumon(data, user);
    console.log('data : ', data);
    await revalidatePath('/bumons-master');
    await revalidatePath('/daibumons-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 大部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する大部門マスタID
 */
export const updateDaibumon = async (rawData: DaibumonsMasterDialogValues, id: number, user: string) => {
  const date = toJapanTimeString();
  const updateData = {
    dai_bumon_id: id,
    dai_bumon_nam: rawData.daibumonNam,
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.dai_bumon_nam);
  try {
    await updateDaibumonDB(updateData);
    await revalidatePath('/bumons-master');
    await revalidatePath('/daibumons-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
