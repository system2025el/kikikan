'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';
import { JuchuSharyoMeisaiDBValues } from '../types/t-juchu-sharyo-meisai-type';

/**
 * 受注車両明細を挿入する関数
 * @param {JuchuSharyoMeisaiDBValues[]} data DBの型のobject
 * @param {PoolClient} connection トランザクション用
 * @returns {number} 新規挿入した車両明細ヘッダID
 */
export const insertJuchuSharyoMeisai = async (data: JuchuSharyoMeisaiDBValues[], connection: PoolClient) => {
  const cols = Object.keys(data[0]);
  const values = data.flatMap((d) => Object.values(d));
  const placeholders = data
    .map((_, index) => {
      const start = index * cols.length + 1;
      return `(${cols.map((_, i) => `$${start + i}`).join(',')})`;
    })
    .join(',');
  const query = `
    INSERT INTO
        ${SCHEMA}.t_juchu_sharyo_meisai (${cols})
    VALUES ${placeholders}
    RETURNING *;
`;
  try {
    console.log(query);
    return await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
