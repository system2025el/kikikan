'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
import { updateMasterUpdates } from '@/app/_lib/db/tables/m-master-update';
import {
  insertNewRfid,
  selectOneRfid,
  selectRfidsOfTheKizai,
  upDateRfidDB,
  updateRfidTagStsDB,
} from '@/app/_lib/db/tables/m-rfid';
import { MRfidDBValues } from '@/app/_lib/db/types/m-rfid-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { nullToZero, zeroToNull } from '../../../_lib/value-converters';
import { emptyRfid } from './datas';
import { RfidsMasterDialogValues, RfidsMasterTableValues } from './types';

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
 * 選択されたRFIDのデータを取得する関数
 * @param id RFIDマスタID
 * @returns {Promise<RfidsMasterDialogValues | undefined>} RFID情報
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
      elNum: data.el_num ?? 0,
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

/**
 * RFIDマスタに新規登録する関数
 * @param data フォームで取得したRFID情報
 */
export const addNewRfid = async (data: RfidsMasterDialogValues, kizaiId: number, user: string) => {
  console.log('RFIDマスタを追加する');
  const insertData: MRfidDBValues = {
    kizai_id: kizaiId,
    rfid_tag_id: data.tagId,
    el_num: data.elNum,
    shozoku_id: data.shozokuId,
    mem: data.mem,
    rfid_kizai_sts: data.rfidKizaiSts,
    del_flg: 0,
    add_dat: toJapanTimeString(),
    add_user: user,
  };

  try {
    await Promise.all([insertNewRfid(insertData), updateMasterUpdates('m_rfid')]);
    await revalidatePath('/rfid-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * RFIDマスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新するRFIDマスタID
 */
export const updateRfid = async (data: RfidsMasterDialogValues, kizaiId: number, user: string) => {
  const date = toJapanTimeString();
  const updateData: MRfidDBValues = {
    kizai_id: kizaiId,
    rfid_tag_id: data.tagId,
    del_flg: Number(data.delFlg),
    el_num: data.elNum,
    shozoku_id: Number(data.shozokuId),
    mem: data.mem,
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData);
  try {
    await Promise.all([upDateRfidDB(updateData), updateMasterUpdates('m_rfid')]);
    await revalidatePath(`/rfid-master/${kizaiId}`);
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('例外が発生しました', error);
    throw error;
  }
};

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
