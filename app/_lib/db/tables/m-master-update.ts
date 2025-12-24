'use server';

import { PoolClient } from 'pg';

import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { SCHEMA, supabase } from '../supabase';

/**
 * マスタ更新テーブルにレコード追加する関数
 * @param masterNam 更新するマスタテーブル名
 */
export const updateMasterUpdates = async (masterNam: string, connection: PoolClient) => {
  const date = toJapanTimeStampString();
  try {
    await supabase.schema(SCHEMA).from('m_master_update').update({ upd_dat: date }).eq('master_nam', masterNam);
  } catch (e) {
    throw e;
  }
};
