'use server';
import { PoolClient } from 'pg';

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
        t_mitu_head (${quotHeadCols.join(',')})
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
    INSERT INTO t_mitu_head (${quotHeadCols.join(',')})
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
