'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectNyushukoEqptDetail = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  juchuKizaiMeisaiId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number,
  kizaiId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2_result')
      .select(
        'nyushuko_basho_id, rfid_dat, rfid_del_flg, rfid_el_num, rfid_kizai_sts, rfid_mem, rfid_shozoku_id, rfid_shozoku_nam, rfid_sts_nam, rfid_tag_id, rfid_user'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_kizai_meisai_id', juchuKizaiMeisaiId)
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('kizai_id', kizaiId)
      .order('rfid_tag_id');
  } catch (e) {
    throw e;
  }
};
