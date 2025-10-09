'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectShukoEqptDetail = async (
  juchuHeadId: number,
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
        'bld_cod, ctn_flg, eda_cod, juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, kizai_id, kizai_mem, kizai_nam, nyushuko_basho_id, nyushuko_dat, nyushuko_shubetu_id, plan_qty, result_adj_qty, result_qty, rfid_dat, rfid_del_flg, rfid_el_num, rfid_kizai_sts, rfid_mem, rfid_shozoku_id, rfid_shozoku_nam, rfid_sts_nam, rfid_tag_id, rfid_user, sagyo_kbn_id, sagyo_kbn_nam, tana_cod'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('kizai_id', kizaiId)
      .order('rfid_tag_id');
  } catch (e) {
    throw e;
  }
};
