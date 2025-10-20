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
export const updateRfidTagStsDB = async (
  data: { rfid_tag_id: string; rfid_kizai_sts: number; shozoku_id: number }[],
  user: string
) => {
  const now = toJapanTimeString(undefined, '-');
  // RFIDタグ管理テーブル側準備
  const placeholders = data
    .map((_, index) => {
      const start = index * 3 + 1;
      return `($${start}, $${start + 1}, $${start + 2})`;
    })
    .join(',');
  const values = data.flatMap((v) => [v.rfid_tag_id, v.rfid_kizai_sts, v.shozoku_id]);
  const query = `
            WITH imported_data (rfid_tag_id, rfid_kizai_sts, shozoku_id) AS (
              VALUES ${placeholders}
            )
            INSERT INTO ${SCHEMA}.t_rfid_status_result (
              rfid_tag_id,
              rfid_kizai_sts,
              shozoku_id,
              upd_dat,
              upd_user
            )
            SELECT
              id.rfid_tag_id::varchar,
              CAST(id.rfid_kizai_sts AS integer),
              CAST(id.shozoku_id AS integer),
              $${values.length + 1}::timestamp, -- upd_dat
              $${values.length + 2}::varchar  -- upd_user
            FROM
              imported_data AS id
          `;

  try {
    await pool.query(query, [...values, now, user]);
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
