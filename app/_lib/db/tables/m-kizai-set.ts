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
