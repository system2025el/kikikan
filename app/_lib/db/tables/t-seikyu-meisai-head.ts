'use server';
import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { SeikyuMeisaiHead } from '../types/t-seikyu-meisai-head-type';

/**
 * 請求明細ヘッダを挿入する関数
 * @param data 明細ヘッド情報
 * @param connection
 */
export const insertBillMeisaiHead = async (data: SeikyuMeisaiHead[], connection: PoolClient) => {
  console.log('請求明細ヘッド新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('請求明細ヘッダーが空です。');
  }
  const billHeadCols = Object.keys(data[0]);
  const billValues = data.flatMap((d) => Object.values(d).map((value) => value ?? null));
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * billHeadCols.length + 1;
      const group = Array.from({ length: billHeadCols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_seikyu_meisai_head (${billHeadCols.join(',')})
      VALUES 
        ${placeholders}
    `;
  try {
    await connection.query(query, billValues);
  } catch (e) {
    throw e;
  }
};

/**
 * t_seikyu_meisai_headのデータを比較して差分を更新する関数
 * @param data 更新するデータ
 * @param connection トランザクション
 * @returns 更新した明細ヘッドのID
 */
export const updateBillMeisaiHead = async (data: SeikyuMeisaiHead[], connection: PoolClient) => {
  if (!data || data.length === 0) {
    throw new Error('請求明細ヘッダーが空です。');
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
    INSERT INTO ${SCHEMA}.t_seikyu_meisai_head (${updateMeisaiHeadCols.join(',')})
    VALUES ${updatePlaceholders}
    ON CONFLICT (seikyu_head_id, seikyu_meisai_head_id)
    DO UPDATE SET ${upsetValues}
    RETURNING seikyu_meisai_head_id;
  `;
  try {
    await connection.query(updateQuery, updateMeisaiHeadValues);
  } catch (e) {
    throw e;
  }
};

/**
 * 請求ヘッドIDが一致する請求明細ヘッドを取得する
 * @param id 請求ヘッドID
 * @returns 請求明細ヘッドの配列
 */
export const selectBillMeisaiHead = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_seikyu_meisai_head')
      .select(
        `
         seikyu_meisai_head_id, seikyu_head_id, juchu_head_id, juchu_kizai_head_id,
         seikyu_meisai_head_nam, seikyu_str_dat, seikyu_end_dat, kokyaku_tanto_nam, 
         koen_nam, koenbasho_nam, nebiki_amt, zei_flg
        `
      )
      .eq('seikyu_head_id', id)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 明細ID合致するものをt_seikyu_meisai_headから削除する関数
 * @param ids 削除する明細ヘッダのIDの組み合わせの配列
 */
export const deleteBillMeisaiHeads = async (
  ids: {
    seikyu_head_id: number;
    seikyu_meisai_head_id: number;
  }[],
  connection: PoolClient
) => {
  const placeholders = ids.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
  const values = ids.flatMap((d) => [d.seikyu_head_id, d.seikyu_meisai_head_id]);

  const query = `DELETE FROM ${SCHEMA}.t_seikyu_meisai_head WHERE (seikyu_head_id, seikyu_meisai_head_id) IN (${placeholders})`;
  console.log('☆☆☆☆☆', query, values);
  try {
    console.log('消したいやつ', ids);
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
