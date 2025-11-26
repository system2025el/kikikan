'use server';

import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { JuchuKizaiHonbanbi } from '../types/t-juchu-kizai-honbanbi-type';

/**
 * 受注機材本番日取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @returns 受注機材本番日
 */
export const selectHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem, juchu_honbanbi_add_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .in('juchu_honbanbi_shubetu_id', [10, 20, 30, 40])
      .order('juchu_honbanbi_dat');
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日データの存在確認
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @returns あり：true　なし：false
 */
export const selectHonbanbiConfirm = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: string
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_juchu_kizai_honbanbi')
      .select('juchu_head_id, juchu_kizai_head_id, juchu_honbanbi_shubetu_id, juchu_honbanbi_dat, mem')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_honbanbi_shubetu_id', juchuHonbanbiShubetuId)
      .eq('juchu_honbanbi_dat', juchuHonbanbiDat)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日新規追加(1件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertHonbanbi = async (data: JuchuKizaiHonbanbi, connection: PoolClient) => {
  const cols = Object.keys(data);
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_juchu_kizai_honbanbi (${cols.join(',')})
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
 * 受注機材本番日新規追加(複数件)
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const insertAllHonbanbi = async (data: JuchuKizaiHonbanbi[], connection: PoolClient) => {
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
      ${SCHEMA}.t_juchu_kizai_honbanbi (${cols.join(',')})
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
 * 受注機材入出庫本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateNyushukoHonbanbi = async (data: JuchuKizaiHonbanbi, connection: PoolClient) => {
  const whereKeys = ['juchu_head_id', 'juchu_kizai_head_id', 'juchu_honbanbi_shubetu_id'] as const;

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
        ${SCHEMA}.t_juchu_kizai_honbanbi
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
 * 受注機材本番日更新
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 * @param userNam ユーザー名
 * @returns
 */
export const updateHonbanbi = async (data: JuchuKizaiHonbanbi, connection: PoolClient) => {
  const whereKeys = [
    'juchu_head_id',
    'juchu_kizai_head_id',
    'juchu_honbanbi_shubetu_id',
    'juchu_honbanbi_dat',
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
        ${SCHEMA}.t_juchu_kizai_honbanbi
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
 * 受注機材本番日削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const deleteHonbanbi = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuHonbanbiShubetuId: number,
  juchuHonbanbiDat: string,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_honbanbi
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_honbanbi_shubetu_id = $3
      AND juchu_honbanbi_dat = $4
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, juchuHonbanbiShubetuId, juchuHonbanbiDat];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材本番日(使用中)削除
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param juchuHonbanbiData 受注機材本番日データ
 */
export const deleteSiyouHonbanbi = async (juchuHeadId: number, juchuKizaiHeadId: number, connection: PoolClient) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_honbanbi
    WHERE
      juchu_head_id = $1
      AND juchu_kizai_head_id = $2
      AND juchu_honbanbi_shubetu_id = $3
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, 1];

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const deleteJuchuKizaiHonbanbiFromOrder = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  connection: PoolClient
) => {
  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_kizai_honbanbi
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
