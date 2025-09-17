import { PoolClient } from 'pg';

import { MituMeisaiHead } from '../types/t-mitu-meisai-head-type';

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
        t_mitu_meisai_head (${quotHeadCols.join(',')})
      VALUES 
        ${placeholders}
    `;
  try {
    await connection.query(query, quotValues);
  } catch (e) {
    throw e;
  }
};
