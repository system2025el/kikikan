'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';
import { MIsshikiSetDBValues } from '../types/m-issiki-set-type';

/**
 * 一式セット機材を新規挿入する関数
 * @param {MIsshikiSetDBValues[]} data 挿入するデータの配列
 * @param {PoolClient} connection トランザクション
 */
export const insertNewIsshikiSetList = async (data: MIsshikiSetDBValues[], connection: PoolClient) => {
  const cols = Object.keys(data[0]);
  const values = data.flatMap((d) => Object.values(d));
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const query = `
    INSERT INTO
        ${SCHEMA}.m_issiki_set
    (${cols.join(',')})
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
 * 一式セット機材を更新する関数
 * @param {MIsshikiSetDBValues[]} data 更新するデータの配列
 * @param {PoolClient} connection トランザクション
 */
export const updIsshikiSetDB = async (data: MIsshikiSetDBValues[], connection: PoolClient) => {
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
    INSERT INTO ${SCHEMA}.m_issiki_set (${cols.join(',')})
    VALUES ${placeholders}
    ON CONFLICT (issiki_id, kizai_id)
    DO UPDATE SET ${upsetValues};
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const delIsshikiSet = async (idList: { issiki_id: number; kizai_id: number }[], connection: PoolClient) => {
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
