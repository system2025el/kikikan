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
      .eq('mitu_head_id', id);
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
      .eq('mitu_head_id', id);
  } catch (e) {
    throw e;
  }
};
