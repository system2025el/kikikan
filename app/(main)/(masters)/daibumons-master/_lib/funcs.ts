'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import {
  insertNewDaibumon,
  selectActiveDaibumons,
  selectFilteredDaibumons,
  selectOneDaibumon,
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

    if (error || !data || data.length === 0) {
      if (error) {
        console.error('DB情報取得エラー:', error);
      }
      return [];
    }
    const filtereddaibumons: DaibumonsMasterTableValues[] = data.map((d, index) => ({
      daibumonId: d.dai_bumon_id,
      daibumonNam: d.dai_bumon_nam,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log('大部門マスタ', filtereddaibumons.length, '件');
    return filtereddaibumons;
  } catch (e) {
    console.error('例外が発生しました:', e);
    return [];
  }
};

/**
 * 選択された大部門のデータを取得する関数
 * @param id 大部門マスタID
 * @returns {Promise<daibumonsMasterDialogValues>} - 大部門の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneDaibumon = async (id: number) => {
  try {
    const { data, error } = await selectOneDaibumon(id);

    if (error || !data) {
      console.error('DB情報取得エラー、またはデータが見つかりません', error);
      return emptyDaibumon;
    }
    const daibumonDetails: DaibumonsMasterDialogValues = {
      daibumonNam: data.dai_bumon_nam,
      delFlg: Boolean(data.del_flg),
      mem: data.mem,
    };
    return daibumonDetails;
  } catch (e) {
    console.error('予期せぬ例外が発生しました:', e);
    return emptyDaibumon;
  }
};

/**
 * 大部門マスタに新規登録する関数
 * @param data フォームで取得した大部門情報
 */
export const addNewDaibumon = async (data: DaibumonsMasterDialogValues) => {
  try {
    await insertNewDaibumon(data);

    console.log('data : ', data);
    revalidatePath('/daibumons-master');
  } catch (error) {
    console.log('DB接続エラー: insertDaibumon', error);
    throw error;
  }
};

/**
 * 大部門マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する大部門マスタID
 */
export const updateDaibumon = async (data: DaibumonsMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const date = toJapanTimeString();
  const updateData = {
    dai_bumon_nam: data.daibumonNam,
    del_flg: Number(data.delFlg),
    mem: data.mem,
    upd_dat: date,
    upd_user: 'test_user',
  };

  console.log(updateData.dai_bumon_nam);

  try {
    await updateDaibumon(updateData);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('大部門を更新しました : ', theData.del_flg);
    }
    await revalidatePath('/daibumons-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
