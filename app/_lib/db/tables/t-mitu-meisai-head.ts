'use server';
import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { MituMeisaiHead } from '../types/t-mitu-meisai-head-type';

/**
 * 見積明細ヘッダを挿入する関数
 * @param data 明細ヘッド情報
 * @param connection
 */
export const insertQuotMeisaiHead = async (data: MituMeisaiHead[], connection: PoolClient) => {
  console.log('見積明細ヘッド新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('見積明細ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data[0]);
  const quotValues = data.flatMap((d) => Object.values(d).map((value) => value ?? null));
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * quotHeadCols.length + 1;
      const group = Array.from({ length: quotHeadCols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_mitu_meisai_head (${quotHeadCols.join(',')})
      VALUES 
        ${placeholders}
    `;
  try {
    await connection.query(query, quotValues);
  } catch (e) {
    throw e;
  }
};

/**
 * t_mitu_meisai_headのデータを比較して差分を更新する関数
 * @param data 更新するデータ
 * @param connection トランザクション
 * @returns 更新した明細ヘッドのID
 */
export const updateQuoteMeisaiHead = async (data: MituMeisaiHead[], connection: PoolClient) => {
  if (!data || data.length === 0) {
    throw new Error('見積明細ヘッダーが空です。');
  }
  const updateMeisaiHeadCols = Object.keys(data[0]) as Array<keyof (typeof data)[0]>;
  const updateMeisaiHeadValues = data.flatMap((d) => updateMeisaiHeadCols.map((col) => d[col] ?? null));
  const updatePlaceholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * updateMeisaiHeadCols.length + 1;
      const group = Array.from({ length: updateMeisaiHeadCols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const upsetValues = updateMeisaiHeadCols.map((col) => `${col} = EXCLUDED.${col}`).join(', ');
  const updateQuery = `
    INSERT INTO ${SCHEMA}.t_mitu_meisai_head (${updateMeisaiHeadCols.join(',')})
    VALUES ${updatePlaceholders}
    ON CONFLICT (mitu_head_id, mitu_meisai_head_id)
    DO UPDATE SET ${upsetValues}
    RETURNING mitu_meisai_head_id;
  `;
  try {
    await connection.query(updateQuery, updateMeisaiHeadValues);
  } catch (e) {
    throw e;
  }
};

/**
 * 見積ヘッドIDが一致する見積明細ヘッドを取得する
 * @param id 見積ヘッドID
 * @returns 見積明細ヘッドの配列
 */
export const selectQuotMeisaiHead = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_mitu_meisai_head')
      .select(
        'mitu_meisai_head_id, mitu_head_id, mitu_meisai_head_nam, mitu_meisai_head_kbn, head_nam_dsp_flg, nebiki_nam, nebiki_amt, nebiki_aft_nam, shokei_mei, nebiki_aft_amt, biko_1, biko_2, biko_3'
      )
      .eq('mitu_head_id', id)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 明細ID合致するものをt_mitu_meisai_headから削除する関数
 * @param ids 削除する明細ヘッダのIDの組み合わせの配列
 */
export const deleteQuotMeisaiHeads = async (
  ids: {
    mitu_head_id: number;
    mitu_meisai_head_id: number;
  }[],
  connection: PoolClient
) => {
  const placeholders = ids.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
  const values = ids.flatMap((d) => [d.mitu_head_id, d.mitu_meisai_head_id]);

  const query = `DELETE FROM ${SCHEMA}.t_mitu_meisai_head WHERE (mitu_head_id, mitu_meisai_head_id) IN (${placeholders})`;
  console.log('☆☆☆☆☆', query, values);
  try {
    console.log('消したいやつ', ids);
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
