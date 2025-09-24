'use server';
import { PoolClient } from 'pg';

import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { SCHEMA, supabase } from '../supabase';
import { MituMeisai } from '../types/t-mitu-meisai-type';

export const insertQuotMeisai = async (data: MituMeisai[], connection: PoolClient) => {
  console.log('見積明細新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('見積明細が空です。');
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
        ${SCHEMA}.t_mitu_meisai (${quotHeadCols.join(',')})
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
 * t_mitu_meisaiのデータを比較して差分を更新する関数
 * @param data 更新するデータ
 * @param connection トランザクション
 * @returns 更新した明細のID
 */
export const updateQuotMeisai = async (data: MituMeisai[], connection: PoolClient) => {
  if (!data || data.length === 0) {
    throw new Error('見積明細ヘッダーが空です。');
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
    INSERT INTO ${SCHEMA}.t_mitu_meisai (${updateMeisaiCols.join(',')})
    VALUES ${updatePlaceholders}
    ON CONFLICT (mitu_head_id, mitu_meisai_head_id, mitu_meisai_id)
    DO UPDATE SET ${upsetValues}
    RETURNING mitu_meisai_id;
  `;
  try {
    // 更新処理実行
    await connection.query(updateQuery, updateMeisaiValues);
  } catch (e) {
    throw e;
  }
};
/**
 * 見積ヘッドIDが一致する見積明細を取得する
 * @param id 見積ヘッドID
 * @returns 見積明細の配列
 */
export const selectQuotMeisai = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_mitu_meisai')
      .select(
        'mitu_meisai_id, mitu_meisai_head_id, mitu_head_id, mitu_meisai_nam, meisai_qty, meisai_honbanbi_qty, meisai_tanka_amt, shokei_amt'
      )
      .eq('mitu_head_id', id)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};
