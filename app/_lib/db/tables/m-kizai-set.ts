'use server';

import pool from '../postgres';
import { SCHEMA } from '../supabase';

/**
 * 選択された機材のセット機材のIDリストを取得する関数
 * @param idList 選択された機材のIDリスト
 * @returns 選択された機材のセット機材のIDリスト
 */
export const selectBundledEqptIds = async (idList: number[]) => {
  const placeholders = idList.map((_, i) => `$${i + 1}`).join(',');
  const query = `
    SELECT DISTINCT
      kizai_id
    FROM
      dev6.m_kizai_set
    WHERE
      set_kizai_id IN (${placeholders})
  `;
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    return await pool.query(query, idList);
  } catch (e) {
    throw e;
  }
};
