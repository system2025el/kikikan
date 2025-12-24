'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiNyushuko } from '../types/t-juchu-kizai-nyushuko-type';

/**
 * 受注機材入出庫データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材入出庫データ
 */
export const selectJuchuKizaiNyushuko = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_nyushuko')
      .select('nyushuko_shubetu_id, nyushuko_basho_id, nyushuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫データ確認
 * @param confirmData 受注機材入出庫確認データ
 * @returns
 */
export const selectJuchuKizaiNyushukoConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  nyushuko_shubetu_id: number;
  nyushuko_basho_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_nyushuko')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('nyushuko_shubetu_id', data.nyushuko_shubetu_id)
      .eq('nyushuko_basho_id', data.nyushuko_basho_id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫新規追加
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const insertJuchuKizaiNyushuko = async (data: JuchuKizaiNyushuko, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_juchu_kizai_nyushuko (${cols.join(',')})
      VALUES 
        (${placeholders})
    `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材入出庫更新
 * @param juchuKizaiHeadData 受注機材ヘッダーデータ
 * @param userNam ユーザー名
 * @returns
 */
export const updateJuchuKizaiNyushuko = async (data: JuchuKizaiNyushuko, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'nyushuko_shubetu_id', 'nyushuko_basho_id'] as const;

  const allKeys = Object.keys(data) as (keyof typeof data)[];

  const updateKeys = allKeys.filter((key) => !(whereKeys as readonly string[]).includes(key));

  if (updateKeys.length === 0) {
    throw new Error('No columns to update.');
  }

  const allValues: (string | number | null | undefined)[] = [];
  let placeholderIndex = 1;

  const setClause = updateKeys
    .map((key) => {
      allValues.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(', ');

  const whereClause = whereKeys
    .map((key) => {
      allValues.push(data[key]);
      return `${key} = $${placeholderIndex++}`;
    })
    .join(' AND ');

  const query = `
      UPDATE
        ${SCHEMA}.t_juchu_kizai_nyushuko
      SET
        ${setClause}
      WHERE
        ${whereClause}
    `;
  try {
    await connection.query(query, allValues);
  } catch (e) {
    throw e;
  }
};

export const deleteJuchuKizaiNyushuko = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    nyushuko_shubetu_id: number;
    nyushuko_basho_id: number;
  },
  connection: PoolClient
) => {
  const whereKeys = Object.keys(data) as (keyof typeof data)[];

  if (whereKeys.length === 0) {
    throw new Error('DELETE conditions cannot be empty.');
  }

  const whereClause = whereKeys.map((key, index) => `${key} = $${index + 1}`).join(' AND ');

  const values = whereKeys.map((key) => data[key]);

  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_nyushuko
    WHERE
      ${whereClause}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const deleteJuchuKizaiNyushukoFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_nyushuko
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
  `;

  const values = [juchuHeadId, juchuKizaiHeadId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
