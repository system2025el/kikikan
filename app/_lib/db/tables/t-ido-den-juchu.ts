'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { IdoDenJuchu } from '../types/t-ido-den-juchu-type';

/**
 * 移動伝票受注id最大値取得
 * @returns 移動伝票受注id最大値
 */
export const selectIdoDenJuchuMaxId = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_ido_den_juchu')
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
 * 移動伝票受注新規追加
 * @param newIdoDenId 新規移動伝票受注id
 * @param idoKizaiData 移動伝票受注データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertIdoDenJuchu = async (data: IdoDenJuchu[], connection: PoolClient) => {
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
      ${SCHEMA}.t_ido_den_juchu (${cols.join(',')})
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
 * 移動伝票受注更新
 * @param idoKizaiData 移動伝票受注データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateIdoDenJuchu = async (data: IdoDenJuchu, connection: PoolClient) => {
  const whereKeys = [
    'ido_den_id',
    'juchu_head_id',
    'juchu_kizai_head_id',
    'juchu_kizai_meisai_id',
    'sagyo_kbn_id',
    'sagyo_siji_id',
    'sagyo_id',
    'kizai_id',
  ] as const;

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
        ${SCHEMA}.t_ido_den_juchu
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
 * 移動伝票受注削除
 * @param idoDenIds 移動伝票受注id
 */
export const deleteIdoDenJuchu = async (idoDenIds: number[], connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_ido_den_juchu
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
