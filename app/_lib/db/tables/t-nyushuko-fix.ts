'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { NyushukoFix } from '../types/t-nyushuko-fix-type';

/**
 * 入出庫確定確認
 * @param data 入出庫確定確認データ
 * @returns
 */
export const selectNyushukoFixConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_fix')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫確定新規追加
 * @param data 入出庫確定データ
 * @returns
 */
export const insertNyushukoFix = async (data: NyushukoFix[], connection: PoolClient) => {
  const cols = Object.keys(data[0]) as (keyof (typeof data)[0])[];
  const values = data.flatMap((obj) => cols.map((col) => obj[col] ?? null));
  let placeholderIndex = 1;
  const placeholders = data
    .map(() => {
      const rowPlaceholders = cols.map(() => `$${placeholderIndex++}`);
      return `(${rowPlaceholders.join(', ')})`;
    })
    .join(', ');

  const query = `
    INSERT INTO
      ${SCHEMA}.t_nyushuko_fix (${cols.join(',')})
    VALUES 
      ${placeholders}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫確定更新
 * @param data 入出庫確定データ
 * @returns
 */
export const updateNyushukoFix = async (data: NyushukoFix, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'sagyo_kbn_id', 'sagyo_den_dat', 'sagyo_id'] as const;

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
        ${SCHEMA}.t_nyushuko_fix
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

/**
 * 入出庫確定削除
 * @param data 入出庫確定削除データ
 * @returns
 */
export const deleteNyushukoFix = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    sagyo_id: number;
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
      ${SCHEMA}.t_nyushuko_fix
    WHERE
      ${whereClause}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
