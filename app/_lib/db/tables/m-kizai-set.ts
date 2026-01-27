'use server';

import { PoolClient } from 'pg';

import { escapeLikeString } from '@/app/(main)/_lib/escape-string';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MKizaiSetDBValues } from '../types/m-kizai-set-type';

/**
 * 選択された機材のセット機材のIDリストを取得する関数
 * @param idList 選択された機材のIDリスト
 * @returns 選択された機材のセット機材のIDリスト
 */
export const selectBundledEqptIds = async (idList: number[]) => {
  const query = `
  SELECT kizai_id, set_kizai_id
  FROM "${SCHEMA}"."m_kizai_set"
  WHERE kizai_id = ANY($1)
`;
  try {
    // return await supabase.schema(SCHEMA).from('m_kizai_set').select('kizai_id, set_kizai_id').in('kizai_id', idList);

    return await pool.query(query, [idList]);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材IDに一致するセット機材を取得する関数
 * @param kizaiId kizai_id
 * @returns m_kizai_setのDB型の配列
 */
export const selectSetOptions = async (kizaiId: number) => {
  const query = `
  SELECT
    s.set_kizai_id, v.kizai_nam, v.shozoku_nam, v.bumon_id, v.kizai_grp_cod, v.ctn_flg
  FROM
    ${SCHEMA}.m_kizai_set as s
  LEFT JOIN
    ${SCHEMA}.v_kizai_lst as v
  ON
    s.set_kizai_id = v.kizai_id
  WHERE
    s.kizai_id = $1
  AND
    v.del_flg <> 1`;
  try {
    return await pool.query(query, [kizaiId]);
  } catch (e) {
    throw e;
  }
};

/**
 * kizai_namが一致する機材セットを取得する関数
 * @param {string} query 機材セット名
 * @returns kizai_nameで検索された機材セットマスタの配列 検索無しなら全件
 */
export const selectFilteredEqptSets = async (query: string) => {
  let queryString = `
    SELECT
      s.kizai_id, k.kizai_nam, s.del_flg, k.kizai_grp_cod, k.dsp_ord_num
    FROM
      ${SCHEMA}.m_kizai_set as s
    LEFT JOIN
      ${SCHEMA}.m_kizai as k
    ON s.kizai_id = k.kizai_id
  `;
  const values = [];

  if (query && query.trim() !== '') {
    queryString += ` WHERE k.kizai_nam ILIKE $1`;
    const escapedQuery = escapeLikeString(query);
    values.push(`%${escapedQuery}%`);
  }
  queryString += `
    GROUP BY s.kizai_id, k.kizai_nam, s.del_flg,k.kizai_grp_cod, k.dsp_ord_num
    ORDER BY k.kizai_grp_cod, k.dsp_ord_num;
  `;

  try {
    return await pool.query(queryString, values);
  } catch (e) {
    throw e;
  }
};

/**
 * set_kizai_idが一致する機材セットを取得する関数
 * @param id 探すset_kizai_id
 * @returns set_kizai_idが一致する機材セット
 */
export const selectOneEqptSet = async (id: number) => {
  const query = `
    SELECT
      set.kizai_id, set.set_kizai_id, k.kizai_nam as set_kizai_nam, set.del_flg, set.mem
    FROM
      ${SCHEMA}.m_kizai_set as set
    LEFT JOIN
      ${SCHEMA}.m_kizai as k
    ON
      k.kizai_id = set.set_kizai_id
    WHERE
      set.kizai_id = $1
  `;
  try {
    return await pool.query(query, [id]);
    // return await supabase
    //   .schema(SCHEMA)
    //   .from('m_kizai_set')
    //   .select('set_kizai_id, del_flg, mem')
    //   .eq('set_kizai_id', id)
    //   .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 機材セットマスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewEqptSet = async (data: MKizaiSetDBValues[], connection: PoolClient) => {
  const cols = Object.keys(data[0]);
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const values = data.flatMap((d) => Object.values(d));
  const query = `
          INSERT INTO ${SCHEMA}.m_kizai_set (${cols.join(',')})
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
 * 機材セットマスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する機材セットのset_kizai_id
 */
export const updateEqptSetDB = async (data: MKizaiSetDBValues[], connection: PoolClient) => {
  const cols = Object.keys(data[0]);
  const values = data.flatMap((d) => Object.values(d));
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const upsetValues = cols.map((col) => `${col} = EXCLUDED.${col}`).join(', ');
  const query = `
    INSERT INTO ${SCHEMA}.m_kizai_set (${cols.join(',')})
    VALUES ${placeholders}
    ON CONFLICT (kizai_id, set_kizai_id)
    DO UPDATE SET ${upsetValues};
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 親機材が一致するセット機材全てを削除する関数
 * @param {number} kizaiId 削除対象の親機材ID
 */
export const deleteEqptSets = async (kizaiId: number) => {
  console.log('削除削除削除');
  try {
    await supabase.schema(SCHEMA).from('m_kizai_set').delete().eq('kizai_id', kizaiId).select('*');
  } catch (e) {
    throw e;
  }
};

/**
 * 親機材とセット機材のIDが一致する機材セットマスタを削除する関数
 * @param {{ kizai_id: number; set_kizai_id: number }[]} idList
 * @param {PoolClient} connection
 */
export const delEqptSetListPg = async (
  idList: { kizai_id: number; set_kizai_id: number }[],
  connection: PoolClient
) => {
  const cols = Object.keys(idList[0]);
  const values = idList.flatMap((d) => Object.values(d));
  const placeholders = idList
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}::int`);
      return `(${group.join(',')})`;
    })
    .join(',');

  const query = `
      DELETE FROM
        ${SCHEMA}.m_kizai_set
      WHERE
        (${cols.join(',')})
      IN
      (${placeholders})
    `;

  console.log('delete query', query);

  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
