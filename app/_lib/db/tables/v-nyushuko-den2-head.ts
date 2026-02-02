'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectNyushukoOne = async (
  juchuHeadId: number,
  juchuKizaiHeadKbn: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  nyushukoShubetuId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2_head')
      .select('koen_nam, juchu_kizai_head_idv, head_namv, koenbasho_nam, kokyaku_nam')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_kbnv', juchuKizaiHeadKbn.toString())
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('nyushuko_shubetu_id', nyushukoShubetuId)
      .single();
  } catch (e) {
    throw e;
  }
};
