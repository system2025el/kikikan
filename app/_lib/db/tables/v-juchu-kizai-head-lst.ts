'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuKizaiHeadList = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select(
        'juchu_head_id, juchu_kizai_head_id, head_nam, sagyo_sts_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, sikomibi, rihabi, genebi, honbanbi, juchu_honbanbi_calc_qty, shokei, nebiki_amt, oya_juchu_kizai_head_id, ht_kbn, juchu_kizai_head_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};
