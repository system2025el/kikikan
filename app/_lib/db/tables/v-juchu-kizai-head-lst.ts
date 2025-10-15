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
        'juchu_head_id, juchu_kizai_head_id, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, sikomibi, rihabi, genebi, honbanbi, juchu_honbanbi_calc_qty, shokei, nebiki_amt, oya_juchu_kizai_head_id, ht_kbn, juchu_kizai_head_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuKizaiHeadNamList = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select('juchu_head_id, juchu_kizai_head_id, head_nam, nebiki_amt')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_kbn', 1)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

export const selectPdfJuchuKizaiHead = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: string,
  nyushukoBashoId: number
) => {
  const ids = juchuKizaiHeadIds.split(',').map(Number);
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select('juchu_honbanbi_calc_qty, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .in('juchu_kizai_head_id', ids);
  } catch (e) {
    throw e;
  }
};
