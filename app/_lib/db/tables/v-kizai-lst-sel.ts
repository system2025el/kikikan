'use server';

import { escapeLikeString } from '@/app/(main)/_lib/escape-string';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 有効な機材を取得する関数
 * @param query kizai_nam
 * @returns 有効な機材の配列（機材選択用）
 */
export const selectActiveEqpts = async (query: string) => {
  let sqlQuery = `
    SELECT
      kizai_id as "kizaiId",
      kizai_nam as "kizaiNam",
      shozoku_nam as "shozokuNam",
      bumon_id as "bumonId",
      kizai_grp_cod as "kizaiGrpCod",
      ctn_flg as "ctnFlg"
    FROM
      ${SCHEMA}.v_kizai_lst_sel
    WHERE
      del_flg <> 1
      AND dsp_flg <> 0
  `;
  const values = [];
  // queryチェック
  if (query && query.trim() !== '') {
    sqlQuery += ` AND kizai_nam ILIKE $${values.length + 1}`;
    const escapedQuery = escapeLikeString(query);
    values.push(`%${escapedQuery}%`);
  }
  // ORDER BY
  sqlQuery += `
    ORDER BY
      kizai_grp_cod,
      dsp_ord_num;
  `;
  try {
    return await pool.query(sqlQuery, values);
  } catch (e) {
    throw new Error('[selectActiveEqpts] DBエラー:', { cause: e });
  }
};
