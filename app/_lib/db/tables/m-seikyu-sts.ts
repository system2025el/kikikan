'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 有効な請求ステータスを取得する関数
 * @returns 有効な請求ステータスのIDと名前の配列
 */
export const selectActiveSeikyuSts = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_seikyu_sts')
      .select('sts_id, sts_nam')
      .neq('del_flg', 1)
      .order('sts_id');
  } catch (e) {
    throw e;
  }
};
