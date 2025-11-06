'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiMeisai } from '../types/t-juchu-kizai-meisai-type';

/**
 * 受注機材明細id最大値取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材明細id最大値
 */
export const selectJuchuKizaiMeisaiMaxId = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
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
 * 機材単価取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuKizaiMeisaiKizaiTanka = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_meisai')
      .select('kizai_id, kizai_tanka_amt')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材明細新規追加
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertJuchuKizaiMeisai = async (data: JuchuKizaiMeisai[], connection: PoolClient) => {
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
      ${SCHEMA}.t_juchu_kizai_meisai (${cols.join(',')})
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
 * 受注機材明細更新
 * @param juchuKizaiMeisaiData 受注機材明細データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateJuchuKizaiMeisai = async (data: JuchuKizaiMeisai, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'juchu_kizai_meisai_id', 'kizai_id'] as const;

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
        ${SCHEMA}.t_juchu_kizai_meisai
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
 * 受注機材明細削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param kizaiId 機材id
 */
export const deleteJuchuKizaiMeisai = async (
  data: { juchu_head_id: number; juchu_kizai_head_id: number; juchu_kizai_meisai_id: number; kizai_id: number },
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_meisai
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_kizai_meisai_id = $3
      AND kizai_id = $4
  `;

  const values = [data.juchu_head_id, data.juchu_kizai_head_id, data.juchu_kizai_meisai_id, data.kizai_id];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
