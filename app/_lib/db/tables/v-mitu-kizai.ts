'use server';
import { SCHEMA, supabase } from '../supabase';

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectKizaiHeadListForMitu = async (juchuHeadId: number, kizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_mitu_kizai')
      .select('juchu_head_id, juchu_kizai_head_id, kizai_nam, plan_kizai_qty, kizai_tanka_amt, juchu_honbanbi_calc_qty')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', kizaiHeadId)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};
