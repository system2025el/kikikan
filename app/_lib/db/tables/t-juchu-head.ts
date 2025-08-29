import { supabase } from '../supabase';

export const SelectJuchuHead = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema('dev2')
      .from('t_juchu_head')
      .select(
        'juchu_head_id, del_flg, juchu_sts, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_tanto_nam, mem, nebiki_amt, zei_kbn'
      )
      .eq('juchu_head_id', juchuHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};
