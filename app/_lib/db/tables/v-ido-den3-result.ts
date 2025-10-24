'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectIdoEqptDetail = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_result')
      .select(
        'ido_den_id, rfid_el_num, rfid_tag_id, rfid_kizai_sts, rfid_sts_nam, rfid_mem, rfid_dat, rfid_user, rfid_del_flg'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId)
      .eq('kizai_id', kizaiId);
  } catch (e) {
    throw e;
  }
};
