'use server';
import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { SeikyuMeisai } from '../types/t-seikyu-meisai-type';

export const insertBillMeisai = async (data: SeikyuMeisai[], connection: PoolClient) => {
  console.log('請求明細新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('請求明細が空です。');
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
        ${SCHEMA}.t_seikyu_meisai (${billHeadCols.join(',')})
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
 * t_seikyu_meisaiのデータを比較して差分を更新する関数
 * @param data 更新するデータ
 * @param connection トランザクション
 * @returns 更新した明細のID
 */
export const updateBillMeisai = async (data: SeikyuMeisai[], connection: PoolClient) => {
  if (!data || data.length === 0) {
    throw new Error('請求明細ヘッダーが空です。');
  }
  const updateMeisaiCols = Object.keys(data[0]) as Array<keyof (typeof data)[0]>;
  const updateMeisaiValues = data.flatMap((d) => updateMeisaiCols.map((col) => d[col] ?? null));
  const updatePlaceholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * updateMeisaiCols.length + 1;
      const group = Array.from({ length: updateMeisaiCols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const upsetValues = updateMeisaiCols.map((col) => `${col} = EXCLUDED.${col}`).join(', ');
  const updateQuery = `
    INSERT INTO ${SCHEMA}.t_seikyu_meisai (${updateMeisaiCols.join(',')})
    VALUES ${updatePlaceholders}
    ON CONFLICT (seikyu_head_id, seikyu_meisai_head_id, seikyu_meisai_id)
    DO UPDATE SET ${upsetValues}
    RETURNING seikyu_meisai_id;
  `;
  try {
    // 更新処理実行
    await connection.query(updateQuery, updateMeisaiValues);
  } catch (e) {
    throw e;
  }
};
/**
 * 請求ヘッドIDが一致する請求明細を取得する
 * @param id 請求ヘッドID
 * @returns 請求明細の配列
 */
export const selectBillMeisai = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_seikyu_meisai')
      .select(
        'seikyu_meisai_id, seikyu_meisai_head_id, seikyu_head_id, seikyu_meisai_nam, meisai_qty, meisai_honbanbi_qty, meisai_tanka_amt'
      )
      .eq('seikyu_head_id', id)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 明細ID合致するものをt_seikyu_meisaiから削除する関数
 * @param ids 削除する明細のIDの組み合わせの配列
 */
export const deleteBillMeisai = async (
  ids: {
    seikyu_head_id: number;
    seikyu_meisai_head_id: number;
    seikyu_meisai_id: number;
  }[],
  connection: PoolClient
) => {
  const placeholders = ids.map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`).join(', ');
  const values = ids.flatMap((d) => [d.seikyu_head_id, d.seikyu_meisai_head_id, d.seikyu_meisai_id]);

  const query = `DELETE FROM ${SCHEMA}.t_seikyu_meisai WHERE (seikyu_head_id, seikyu_meisai_head_id, seikyu_meisai_id) IN (${placeholders})`;
  console.log('☆☆☆☆☆', query, values);
  try {
    console.log('消したいやつ', ids);
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
