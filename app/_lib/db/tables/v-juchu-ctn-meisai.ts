import { SCHEMA, supabase } from '../supabase';

export const selectJuchuContainerMeisai = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_ctn_meisai')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, mem, kizai_id, kizai_nam, kics_plan_kizai_qty, yard_plan_kizai_qty, kics_keep_qty, yard_keep_qty'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .not('kizai_id', 'is', null);
  } catch (e) {
    throw e;
  }
};
