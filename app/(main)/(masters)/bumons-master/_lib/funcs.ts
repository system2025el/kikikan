'use server';

import { revalidatePath } from 'next/cache';

import { insertNewBumon, selectFilteredBumons, selectOneBumon, upDateBumonDB } from '@/app/_lib/db/tables/m-bumon';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { getDaibumonsSelection, getShukeibumonsSelection } from '../../_lib/funcs';
import { emptyBumon } from './datas';
import { BumonsMasterDialogValues, BumonsMasterTableValues } from './types';

/**
 * 部門マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<bumonsMasterTableValues[]>} 部門マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredBumons = async (queries: { q: string; d: number; s: number } = { q: '', d: 0, s: 0 }) => {
  try {
    const [bumons, doptions, soptions] = await Promise.all([
      selectFilteredBumons(queries),
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
    ]);
    const { data, error } = bumons;
    const options = { d: doptions, s: soptions };
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return { data: [], options: options };
    }
    const filteredbumons: BumonsMasterTableValues[] = data.map((d, index) => ({
      bumonId: d.bumon_id,
      bumonNam: d.bumon_nam,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredbumons.length);
    return { data: filteredbumons, options: options };
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された部門のデータを取得する関数
 * @param id 部門マスタID
 * @returns {Promise<bumonsMasterDialogValues>} - 部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenbumon = async (id: number) => {
  try {
    const { data, error } = await selectOneBumon(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyBumon;
    }
    const bumonDetails: BumonsMasterDialogValues = {
      bumonNam: data.bumon_nam,
      delFlg: Boolean(data.del_flg),
      mem: data.mem,
      daibumonId: data.dai_bumon_id,
      shukeibumonId: data.shukei_bumon_id,
    };
    return bumonDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 部門マスタに新規登録する関数
 * @param data フォームで取得した部門情報
 */
export const addNewBumon = async (data: BumonsMasterDialogValues) => {
  try {
    await insertNewBumon(data);
    await revalidatePath('/bumons-master');
    await revalidatePath('/daibumons-master');
    await revalidatePath('/shukeibumons-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する部門マスタID
 */
export const updateBumon = async (rawData: BumonsMasterDialogValues, id: number) => {
  const date = toJapanTimeString();
  const updateDate = {
    bumon_id: id,
    bumon_nam: rawData.bumonNam,
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    dai_bumon_id: rawData.daibumonId,
    shukei_bumon_id: rawData.shukeibumonId,
    upd_dat: date,
    upd_user: 'test_user',
  };

  try {
    await upDateBumonDB(updateDate);
    await revalidatePath('/bumons-master');
    await revalidatePath('/daibumons-master');
    await revalidatePath('/shukeibumons-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('例外が発生しました', error);
    throw error;
  }
};
