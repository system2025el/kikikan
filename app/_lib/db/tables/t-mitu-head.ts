'use server';
import { PoolClient } from 'pg';

import { SCHEMA, supabase } from '../supabase';
import { MituHead } from '../types/t-mitu-head-types';

export const insertQuotHead = async (data: MituHead, connection: PoolClient) => {
  console.log('見積ヘッド新規：', data);
  if (!data || Object.keys(data).length === 0) {
    throw new Error('見積ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data);
  const quotValues = Object.values(data);
  const placeholders = quotValues.map((_, i) => `$${i + 1}`).join(', ');

  const query = `
      INSERT INTO
        ${SCHEMA}.t_mitu_head (${quotHeadCols.join(',')})
      VALUES 
        (${placeholders})
      RETURNING mitu_head_id;
    `;
  try {
    return await connection.query(query, quotValues);
  } catch (e) {
    throw e;
  }
};

export const updateQuotHead = async (data: MituHead, connection: PoolClient) => {
  if (!data || Object.keys(data).length === 0) {
    throw new Error('見積ヘッダーが空です。');
  }
  const quotHeadCols = Object.keys(data);
  console.log(quotHeadCols);
  const quotValues = Object.values(data);
  console.log(quotValues);
  const placeholders = quotValues.map((_, i) => `$${i + 1}`).join(', ');
  const upsetValues = quotHeadCols.filter((i) => i !== 'mitu_head_id').map((col) => `${col} = EXCLUDED.${col}`);

  const updateQuery = `
    INSERT INTO ${SCHEMA}.t_mitu_head (${quotHeadCols.join(',')})
    VALUES (${placeholders})
    ON CONFLICT (mitu_head_id)
    DO UPDATE SET ${upsetValues}
    RETURNING mitu_head_id;
  `;
  try {
    return await connection.query(updateQuery, quotValues);
  } catch (e) {
    throw e;
  }
};

export const selectChosenMitu = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('t_mitu_head')
      .select(
        'mitu_head_id, juchu_head_id, mitu_sts, mitu_dat, mitu_head_nam, kokyaku_nam, nyuryoku_user, mitu_str_dat, mitu_end_dat, kokyaku_tanto_nam, koen_nam, koenbasho_nam, mitu_honbanbi_qty, biko, comment, chukei_mei, toku_nebiki_amt, toku_nebiki_mei, zei_amt, zei_rat, gokei_mei, gokei_amt'
      )
      .eq('mitu_head_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};
