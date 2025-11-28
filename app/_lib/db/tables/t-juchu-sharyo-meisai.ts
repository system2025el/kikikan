'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';
import { JuchuSharyoHeadDBValues } from '../types/t-juchu-sharyo-head-type';
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
        ${SCHEMA}.t_juchu_sharyo_meisai (${cols.join(',')})
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

/**
 * IDが一致する受注車両明細を削除する関数
 * @param {{ juchu_head_id: number; juchu_sharyo_head_id: number; juchu_sharyo_meisai_id: number }[]} ids 削除条件のID達の配列
 * @param {PoolClient} connection トランザクション
 */
export const delJuchuSharyoMeisai = async (
  ids: { juchu_head_id: number; juchu_sharyo_head_id: number; juchu_sharyo_meisai_id: number }[],
  connection: PoolClient
) => {
  const cols = Object.keys(ids[0]);
  const placeholders = ids
    .map((_, i) => `($${i * 3 + 1}::integer, $${i * 3 + 2}::integer, $${i * 3 + 3}::integer)`)
    .join(', ');
  const values = ids.flatMap((d) => Object.values(d));

  const query = `
    DELETE FROM
      ${SCHEMA}.t_juchu_sharyo_meisai
    WHERE
      (${cols.join(',')})
    IN
      (${placeholders})
  `;

  console.log(query);
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注車両明細にあれば更新、なければ挿入する関数
 * @param {JuchuSharyoMeisaiDBValues[]} data 更新・追加する情報
 * @param {PoolClient} connection
 */
export const upsertJuchuSharyoMeisai = async (data: JuchuSharyoMeisaiDBValues[], connection: PoolClient) => {
  const cols = Object.keys(data[0]) as Array<keyof (typeof data)[0]>;
  const values = data.flatMap((d) => cols.map((col) => d[col] ?? null));
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const upsetValues = cols.map((col) => `${col} = EXCLUDED.${col}`).join(', ');
  const query = `
    INSERT INTO ${SCHEMA}.t_juchu_sharyo_meisai (${cols.join(',')})
    VALUES ${placeholders}
    ON CONFLICT (juchu_head_id, juchu_sharyo_head_id, juchu_sharyo_meisai_id)
    DO UPDATE SET ${upsetValues}
    RETURNING *;
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
