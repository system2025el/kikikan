'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 *
 * @param id
 * @returns
 */
export const selectJuchu = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select(
        'juchu_head_id, juchu_sts_nam, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_nam, kokyaku_tanto_nam, mem, nebiki_amt, zei_nam'
      )
      .eq('juchu_head_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};
