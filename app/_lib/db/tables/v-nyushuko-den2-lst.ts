'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectShukoDetail = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2_lst')
      .select(
        'juchu_head_id, juchu_kizai_head_idv, head_namv, kizai_id, kizai_nam, koen_nam, koenbasho_nam, kokyaku_nam, nyushuko_basho_id, nyushuko_dat, nyushuko_shubetu_id, plan_qty, result_adj_qty, result_qty, sagyo_kbn_id, ctn_flg'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .order('kizai_id');
  } catch (e) {
    throw e;
  }
};
