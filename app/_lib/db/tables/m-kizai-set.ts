'use server';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 選択された機材のセット機材のIDリストを取得する関数
 * @param idList 選択された機材のIDリスト
 * @returns 選択された機材のセット機材のIDリスト
 */
export const selectBundledEqptIds = async (idList: number[]) => {
  try {
    return await supabase.schema(SCHEMA).from('m_kizai_set').select('kizai_id, set_kizai_id').in('kizai_id', idList);
  } catch (e) {
    throw e;
  }
};

/**
 * 機材IDに一致するセット機材を取得する関数
 * @param kizaiId kizai_id
 * @returns m_kizai_setのDB型の配列
 */
export const selectSetOptions = async (kizaiId: number) => {
  const query = `
  SELECT
    s.set_kizai_id, v.kizai_nam, v.shozoku_nam, v.bumon_id, v.kizai_grp_cod, v.ctn_flg
  FROM
    ${SCHEMA}.m_kizai_set as s
  LEFT JOIN
    ${SCHEMA}.v_kizai_lst as v
  ON
    s.set_kizai_id = v.kizai_id
  WHERE
    s.kizai_id = $1
  AND
    v.del_flg <> 1`;
  try {
    return await pool.query(query, [kizaiId]);
  } catch (e) {
    throw e;
  }
};
