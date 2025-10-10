'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { updateMasterUpdates } from '@/app/_lib/db/tables/m-master-update';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { nullToZero, zeroToNull } from '../../../_lib/value-converters';
import { emptyRfid } from './datas';
import { RfidsMasterDialogValues, RfidsMasterTableValues } from './types';
import { selectOneRfid, selectRfidsOfTheKizai, updateRfidTagStsDB } from '@/app/_lib/db/tables/m-rfid';
import { selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';

/**
 * 機材マスタで選ばれた機材のRFIDリストを取得、成型する関数
 * @param kizaiId 機材ID
 * @returns {Promise<RfidsMasterTableValues[]>} RFIDマスタテーブルに表示するデータ
 */
export const getRfidsOfTheKizai = async (kizaiId: number) => {
  try {
    const kizai = await selectRfidsOfTheKizai(kizaiId);
    const data = kizai.rows;
    if (!data || data.length === 0) {
      return [];
    }
    const filteredRfids: RfidsMasterTableValues[] = data.map((d, index) => ({
      rfidTagId: d.rfid_tag_id,
      stsId: d.rfid_kizai_sts,
      stsNam: d.sts_nam,
      elNum: d.el_num,
      mem: d.mem,
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log('機材マスタリストを取得した');
    return filteredRfids;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 機材IDから機材名を取得する関数
 * @param id 機材Id
 * @returns {string} 機材名
 */
export const getEqptNam = async (id: number): Promise<string> => {
  try {
    const { data, error } = await selectOneEqpt(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    return data.kizai_nam ?? '';
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された機材のデータを取得する関数
 * @param id 機材マスタID
 * @returns {Promise<RfidsMasterDialogValues | undefined>} 機材情報
 */
export const getChosenRfid = async (id: string) => {
  try {
    const { data, error } = await selectOneRfid(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyRfid;
    }
    const RfidDetails: RfidsMasterDialogValues = {
      elNum: data.el_num,
      delFlg: Boolean(data.del_flg),
      shozokuId: nullToZero(data.shozoku_id),
      mem: data.mem,
      tagId: data.rfid_tag_id,
      rfidKizaiSts: data.rfid_kizai_sts,
    };

    return RfidDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

// /**
//  * 機材マスタに新規登録する関数
//  * @param data フォームで取得した機材情報
//  */
// export const addNewRfid = async (data: RfidsMasterDialogValues) => {
//   console.log('機材マスタを追加する');

//   try {
//     await Promise.all([insertNewRfid(data), updateMasterUpdates('m_kizai')]);
//     await revalidatePath('/rfid-master');
//   } catch (error) {
//     console.log('DB接続エラー', error);
//     throw error;
//   }
// };

// /**
//  * 機材マスタの情報を更新する関数
//  * @param data フォームに入力されている情報
//  * @param id 更新する機材マスタID
//  */
// export const updateRfid = async (rawData: RfidsMasterDialogValues, id: string) => {
//   const date = toJapanTimeString();
//   const updateData = {
//     kizai_id: id,
//     del_flg: Number(rawData.delFlg),
//     shozoku_id: Number(rawData.shozokuId),
//     mem: rawData.mem,
//     upd_dat: date,
//     upd_user: 'test_user',
//   };

//   try {
//     await Promise.all([upDateRfidDB(updateData), updateMasterUpdates('m_kizai')]);
//     await revalidatePath('/rfid-master');
//   } catch (error) {
//     console.log('例外が発生しました', error);
//     throw error;
//   }
// };

/**
 * RFIDマスタで一括変更されたステータスを更新する関数
 * @param data 機材ステータス一括変更されたデータ
 */
export const updateRfidTagSts = async (data: { tagId: string; sts: number }[], user: string) => {
  const updateList = data.map((d) => ({
    rfid_tag_id: d.tagId,
    rfid_kizai_sts: d.sts,
  }));
  try {
    await updateRfidTagStsDB(updateList, user);
    await revalidatePath('/rfid-master');
    await revalidatePath('/eqpt-master');
    console.log(data);
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
