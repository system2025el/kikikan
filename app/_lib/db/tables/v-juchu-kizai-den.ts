import { SCHEMA, supabase } from '../supabase';

export const selectLoanJuchuData = async (kizaiId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_den')
      .select(
        'juchu_head_id, juchu_kizai_head_id, koen_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat'
      )
      .eq('kizai_id', kizaiId);
  } catch (e) {
    throw e;
  }
};
