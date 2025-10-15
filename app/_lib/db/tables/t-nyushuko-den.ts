'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { NyushukoDen } from '../types/t-nyushuko-den-type';

/**
 * 入出庫伝票新規追加
 * @param data 入出庫伝票データ
 * @returns
 */
export const insertNyushukoDen = async (data: NyushukoDen[], connection: PoolClient) => {
  if (!data || data.length === 0) {
    console.log('入出庫伝票データがありません。');
    return;
  }

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
      ${SCHEMA}.t_nyushuko_den (${cols.join(',')})
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
 * 入出庫伝票更新
 * @param data 入出庫伝票データ
 * @returns
 */
export const updateNyushukoDen = async (data: NyushukoDen, connection: PoolClient) => {
  const whereKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'sagyo_kbn_id',
    'sagyo_den_dat',
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
        ${SCHEMA}.t_nyushuko_den
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
 * 入出庫伝票削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuKizaiMeisaiIds 受注機材ヘッダーid
 * @returns
 */
export const deleteNyushukoDen = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_nyushuko_den
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND kizai_id = ANY($3)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, kizaiId];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票確認
 * @param data コンテナ入出庫伝票確認データ
 * @returns
 */
export const selectContainerNyushukoDenConfirm = async (data: {
  juchu_head_id: number;
  juchu_kizai_head_id: number;
  juchu_kizai_meisai_id: number;
  kizai_id: number;
  sagyo_id: number;
}) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .select('*')
      .eq('juchu_head_id', data.juchu_head_id)
      .eq('juchu_kizai_head_id', data.juchu_kizai_head_id)
      .eq('juchu_kizai_meisai_id', data.juchu_kizai_meisai_id)
      .eq('kizai_id', data.kizai_id)
      .eq('sagyo_id', data.sagyo_id);
  } catch (e) {
    throw e;
  }
};

/**
 * コンテナ入出庫伝票削除
 * @param data コンテナ入出庫伝票削除データ
 * @returns
 */
export const deleteContainerNyushukoDen = async (
  data: {
    juchu_head_id: number;
    juchu_kizai_head_id: number;
    juchu_kizai_meisai_id: number;
    kizai_id: number;
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
      ${SCHEMA}.t_nyushuko_den
    WHERE
      ${whereClause}
  `;

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 入出庫伝票補正数更新
 * @param data 補正数更新データ
 * @returns
 */
export const updateResultAdjQty = async (data: NyushukoDen, connection: PoolClient) => {
  const whereKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'sagyo_kbn_id',
    'sagyo_den_dat',
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
        ${SCHEMA}.t_nyushuko_den
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

export const selectKizaiDetail = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  sagyoDenDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_nyushuko_den')
      .select('juchu_kizai_head_id, plan_qty, result_qty, result_adj_qty')
      .eq('juchu_head_id', juchuHeadId)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_den_dat', sagyoDenDat)
      .eq('sagyo_id', nyushukoBashoId)
      .eq('kizai_id', kizaiId);
  } catch (e) {
    throw e;
  }
};
