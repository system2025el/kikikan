'use server';

import { PoolClient } from 'pg';

import { JuchuContainerMeisaiValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import { SCHEMA, supabase } from '../supabase';
import { JuchuCtnMeisai } from '../types/t_juchu_ctn_meisai-type';

/**
 * 受注コンテナ明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuContainerMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_ctn_meisai')
      .select('juchu_kizai_meisai_id')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .order('juchu_kizai_meisai_id', {
        ascending: false,
      })
      .limit(1)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注コンテナ明細新規追加
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const insertJuchuContainerMeisai = async (data: JuchuCtnMeisai[], connection: PoolClient) => {
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
      ${SCHEMA}.t_juchu_ctn_meisai (${cols.join(',')})
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
 * 受注コンテナ明細更新
 * @param data 受注コンテナ明細データ
 * @returns
 */
export const updateJuchuContainerMeisai = async (data: JuchuCtnMeisai, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'kizai_id', 'shozoku_id'] as const;

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
        ${SCHEMA}.t_juchu_ctn_meisai
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
 * 受注コンテナ明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 * @returns
 */
export const deleteJuchuContainerMeisai = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  kizaiId: number[],
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_ctn_meisai
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
