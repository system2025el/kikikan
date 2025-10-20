'use server';

import { PoolClient } from 'pg';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { RfidStatusResultValues } from '../types/t-rfid-status-result-type';

/**
 * 変更があるRFIDマスタの更新をする関数
 * @param data ステータスが変わったRFIDタグリスト
 */
export const updateRfidTagStsDB = async (data: { rfid_tag_id: string; rfid_kizai_sts: number }[], user: string) => {
  const updDat = toJapanTimeString(undefined, '-');
  const updatePlaceholders = data
    .map((_, index) => {
      const start = index * 2 + 1;
      return `($${start}, $${start + 1})`;
    })
    .join(',');
  const updateValues = data.flatMap((v) => [v.rfid_tag_id, v.rfid_kizai_sts]);
  const query = `
          UPDATE ${SCHEMA}.t_rfid_status_result AS mr
          SET
            rfid_kizai_sts = d.rfid_kizai_sts::integer,
            upd_dat = $${updateValues.length + 1}::timestamp,
            upd_user = $${updateValues.length + 2}
          FROM (
            VALUES ${updatePlaceholders}
          ) AS d(rfid_tag_id, rfid_kizai_sts)
          WHERE mr.rfid_tag_id = d.rfid_tag_id;
        `;

  try {
    await pool.query(query, [...updateValues, updDat, user]);
  } catch (e) {
    throw e;
  }
};

/**
 * 新規登録したRFIDマスタタグの状態を登録する関数
 * @param {RfidStatusResultValues} data
 * @param connection トランザクション用クライアント
 */
export const insertNewRfidSts = async (data: RfidStatusResultValues, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const query = `INSERT INTO ${SCHEMA}.t_rfid_status_result (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * タグIDが一致するRFIDタグの情報を取得する関数
 * @param id RFIDタグID
 * @returns {{}}
 */
export const selectOneRfidStatusResult = async (id: string) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_rfid_status_result')
      .select('shozoku_id, rfid_kizai_sts')
      .eq('rfid_tag_id', id)
      .maybeSingle();
  } catch (e) {
    throw e;
  }
};
