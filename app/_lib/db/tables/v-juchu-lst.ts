import 'server-only';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

/**
 *
 * @param id
 * @returns
 */
export const selectJuchu = async (id: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select(
        'juchu_head_id, juchu_sts_nam, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_nam, kokyaku_tanto_nam, mem, nebiki_amt, zei_nam'
      )
      .eq('juchu_head_id', id)
      .single();
  } catch (e) {
    throw new Error('[selectJuchu] DBエラー:', { cause: e });
  }
};

export const selectPdfJuchuHead = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select('juchu_head_id, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_nam, nyuryoku_user, kokyaku_tanto_nam')
      .eq('juchu_head_id', juchuHeadId)
      .single();
  } catch (e) {
    throw new Error('[selectPdfJuchuHead] DBエラー:', { cause: e });
  }
};
