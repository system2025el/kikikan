'use server';

import { revalidatePath } from 'next/cache';

import { selectActiveEqptsForSet } from '@/app/_lib/db/tables/m-kizai';
import {
  insertNewEqptSet,
  selectFilteredEqptSets,
  selectOneEqptSet,
  updateEqptSetDB,
} from '@/app/_lib/db/tables/m-kizai-set';
import { toJapanTimeStampString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { emptyEqptSet } from './datas';
import { EqptSetsMasterDialogValues, EqptSetsMasterTableValues } from './types';

/**
 * 機材セットマスタのデータを取得する関数、引数無は全取得
 * @param query 機材セット名検索キーワード
 * @returns {Promise<EqptSetsMasterTableValues[]>} 機材セットマスタテーブルに表示するデータ配列（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredEqptSets = async (query: string = '') => {
  try {
    const { rows } = await selectFilteredEqptSets(query);
    // if (error) {
    //   console.error('DB情報取得エラー', error.message, error.cause, error.hint);
    //   throw error;
    // }
    if (!rows || rows.length === 0) {
      return [];
    }
    // 機材セットマスタ画面のテーブル要に形成
    const filteredEqptSets: EqptSetsMasterTableValues[] = rows.map((d, index) => ({
      oyaEqptId: d.kizai_id,
      oyaEqptNam: d.kizai_nam,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log('機材セットマスタ', filteredEqptSets.length, '件');
    return filteredEqptSets;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された機材セットのデータを取得する関数
 * @param id 選択した機材セットマスタID
 * @returns {Promise<EqptSetsMasterDialogValues>} - 機材セットの詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenEqptSet = async (id: number) => {
  try {
    const { rows } = await selectOneEqptSet(id);

    if (!rows) {
      return emptyEqptSet;
    }
    // ダイアログ表示用に形成
    const eqptSetDetails: EqptSetsMasterDialogValues = {
      delFlg: Boolean(rows[0].del_flg),
      mem: rows[0].mem,
      eqptId: rows[0].kizai_id,
      setEqptList: rows[0].set_kizai_id ? rows.map((d) => ({ id: d.set_kizai_id, nam: d.set_kizai_nam })) : [],
    };
    return eqptSetDetails;
  } catch (e) {
    console.error('予期せぬ例外が発生しました:', e);
    throw e;
  }
};

/**
 * 機材セットマスタに新規登録する関数
 * @param data フォームで取得した機材セット情報
 */
export const addNewEqptSet = async (data: EqptSetsMasterDialogValues, user: string) => {
  try {
    await insertNewEqptSet(data, user);
    console.log('data : ', data);
    await revalidatePath('/eqpt-set-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 機材セットマスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する機材セットマスタID
 */
export const updateEqptSet = async (rawData: EqptSetsMasterDialogValues, id: number, user: string) => {
  const date = toJapanTimeStampString();
  const updateData = {
    kizai_id: id,
    set_kizai_id: id,
    del_flg: Number(rawData.delFlg),
    mem: rawData.mem,
    upd_dat: date,
    upd_user: user,
  };
  try {
    await updateEqptSetDB(updateData);
    await revalidatePath('/eqpt-set-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};

/**
 * 機材セットマスタの機材選択肢に表示するための機材リスト
 * @returns {Promise<SelectTypes[]>} 選択肢配列
 */
export const getEqptsForEqptSelection = async (): Promise<SelectTypes[]> => {
  try {
    const data = await selectActiveEqptsForSet();
    if (!data || data.rowCount === 0) {
      return [];
    }
    console.log('=========================================', data.rows);
    return data.rows.map((d) => ({ id: d.kizaiId, label: d.kizaiNam, grpId: d.bumonId, grpNam: d.bumonNam }));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
