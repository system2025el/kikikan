'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { selectOneEqpt } from '@/app/_lib/db/tables/m-kizai';
import { updateMasterUpdates } from '@/app/_lib/db/tables/m-master-update';
import { insertNewRfid, upDateRfidDB } from '@/app/_lib/db/tables/m-rfid';
import { insertNewRfidSts, updateRfidTagStsDB } from '@/app/_lib/db/tables/t-rfid-status-result';
import { selectOneRfid, selectRfidsOfTheKizai } from '@/app/_lib/db/tables/v-rfid';
import { MRfidDBValues } from '@/app/_lib/db/types/m-rfid-type';
import { RfidStatusResultValues } from '@/app/_lib/db/types/t-rfid-status-result-type';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { fakeToNull, nullToFake } from '../../../_lib/value-converters';
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
      shozokuId: nullToFake(data.shozoku_id),
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
    mem: data.mem,
    del_flg: 0,
    add_dat: toJapanTimeString(),
    add_user: user,
  };
  const insertStsData: RfidStatusResultValues = {
    rfid_tag_id: data.tagId,
    shozoku_id: data.shozokuId,
    rfid_kizai_sts: data.rfidKizaiSts,
    upd_dat: toJapanTimeString(),
    upd_user: user,
  };
  const connection = await pool.connect();
  try {
    connection.query('BEGIN');
    await insertNewRfid(insertData, connection);
    await insertNewRfidSts(insertStsData, connection);
    await updateMasterUpdates('m_rfid', connection);
    await connection.query('COMMIT');
    await revalidatePath('/rfid-master');
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    await connection.query('ROLLBACK');

    throw error;
  } finally {
    // なんにしてもpool解放
    connection.release();
  }
};

/**
 * RFIDマスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新するRFIDマスタID
 */
export const updateRfid = async (
  current: RfidsMasterDialogValues,
  data: RfidsMasterDialogValues,
  kizaiId: number,
  user: string
) => {
  const now = toJapanTimeString();
  const masterChanged =
    JSON.stringify({ tagId: current.tagId, elNum: current.elNum, mem: current.mem, delFlg: current.delFlg }) !==
    JSON.stringify({
      tagId: data.tagId,
      elNum: data.elNum,
      mem: data.mem,
      delFlg: data.delFlg,
    });
  const stsChanged =
    JSON.stringify({ tagId: current.tagId, shozokuId: current.shozokuId, rfidKizaiSts: current.rfidKizaiSts }) !==
    JSON.stringify({
      tagId: data.tagId,
      shozokuId: data.shozokuId,
      rfidKizaiSts: data.rfidKizaiSts,
    });

  const updateData: MRfidDBValues = {
    kizai_id: kizaiId,
    rfid_tag_id: data.tagId,
    del_flg: Number(data.delFlg),
    el_num: data.elNum,
    mem: data.mem,
    upd_dat: now,
    upd_user: user,
  };

  const updateStsData: RfidStatusResultValues = {
    rfid_tag_id: data.tagId,
    shozoku_id: data.shozokuId,
    rfid_kizai_sts: data.rfidKizaiSts,
    upd_dat: now,
    upd_user: user,
  };
  console.log(updateData);
  const connection = await pool.connect();
  try {
    connection.query('BEGIN');
    if (masterChanged) {
      await upDateRfidDB(updateData, connection);
      await updateMasterUpdates('m_rfid', connection);
    }
    if (stsChanged) {
      await insertNewRfidSts(updateStsData, connection);
    }
    await connection.query('COMMIT');

    await revalidatePath(`/rfid-master/${kizaiId}`);
    await revalidatePath('/eqpt-master');
  } catch (error) {
    console.log('例外が発生しました', error);
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    // なんにしてもpool解放
    connection.release();
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
