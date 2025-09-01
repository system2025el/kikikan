'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const SelectJuchuKizaiHeadList = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select('*')
      .eq('juchu_head_id', juchuHeadId)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};
