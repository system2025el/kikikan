'use server';

import { PoolClient } from 'pg';

import { SCHEMA } from '../supabase';
import { MIsshikiSetDBValues } from '../types/m-issiki-set-type';

export const insertNewIsshikiSetList = async (data: MIsshikiSetDBValues[], connection: PoolClient) => {
  const cols = Object.keys(data[0]);
  const values = data.flatMap((d) => Object.values(d));
  const placeholders = data
    .map((_, rowIndex) => {
      const start = rowIndex * cols.length + 1;
      const group = Array.from({ length: cols.length }, (_, colIndex) => `$${start + colIndex}`);
      return `(${group.join(',')})`;
    })
    .join(',');
  const query = `
    INSERT INTO
        ${SCHEMA}.m_issiki_set
    (${cols.join(',')})
    VALUES
        ${placeholders}
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};
