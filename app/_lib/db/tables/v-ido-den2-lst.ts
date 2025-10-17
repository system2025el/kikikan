'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectIdoDetail = async (sagyoKbnId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den2_lst')
      .select('ido_den_id, sagyo_kbn_id, juchu_flg, , , , , , , , , , , , , , ')
      .eq('sagyo_kbn_id', sagyoKbnId)
      .order('kizai_id');
  } catch (e) {
    throw e;
  }
};
