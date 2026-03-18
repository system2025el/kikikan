import { SCHEMA, supabase } from '../supabase';

export const selectLoanJuchuData = async (kizaiId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_den')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, koen_nam, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, oya_juchu_kizai_head_id'
      )
      .eq('kizai_id', kizaiId)
      .neq('juchu_kizai_head_kbn', 3);
  } catch (e) {
    throw new Error('[selectLoanJuchuData] DBエラー:', { cause: e });
  }
};
