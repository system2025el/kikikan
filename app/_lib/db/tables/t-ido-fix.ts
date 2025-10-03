'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { IdoFix } from '../types/t-ido-fix-type';

/**
 * 移動確定新規追加
 * @param data 移動確定データ
 * @returns
 */
export const insertIdoFix = async (data: IdoFix[], connection: PoolClient) => {
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
      ${SCHEMA}.t_ido_fix (${cols.join(',')})
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
 * 移動確定更新
 * @param data 移動確定データ
 * @returns
 */
export const updateIdoFix = async (data: IdoFix, connection: PoolClient) => {
  const whereKeys = ['ido_den_id'] as const;

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
        ${SCHEMA}.t_ido_fix
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
 * 移動確定削除
 * @param idoDenIds 移動確定id
 * @returns
 */
export const deleteIdoFix = async (idoDenIds: number[], connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_ido_fix
    WHERE
      ido_den_id = ANY($1)
  `;

  const values = [idoDenIds];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
