'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { IdoDen } from '../types/t-ido-den-type';

/**
 * 移動伝票id最大値取得
 * @returns
 */
export const selectIdoDenMaxId = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_den')
      .select('ido_den_id')
      .order('ido_den_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 移動伝票新規追加
 * @param data 移動伝票データ
 * @param connection
 */
export const insertIdoDen = async (data: IdoDen[], connection: PoolClient) => {
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
      ${SCHEMA}.t_ido_den (${cols.join(',')})
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
 * 移動伝票更新
 * @param data 移動伝票データ
 * @param connection
 */
export const updateIdoDen = async (data: IdoDen, connection: PoolClient) => {
  const whereKeys = ['ido_den_id', 'sagyo_kbn_id', 'sagyo_siji_id', 'sagyo_den_dat', 'sagyo_id', 'kizai_id'] as const;

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
        ${SCHEMA}.t_ido_den
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
 * 移動伝票削除
 * @param deleteIds 移動伝票削除対象id
 * @param connection
 */
export const deleteIdoDen = async (deleteIds: number[], connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_ido_den
    WHERE
      ido_den_id = ANY($1)
  `;

  const values = [deleteIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
