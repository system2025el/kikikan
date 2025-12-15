'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 移動伝票取得
 * @param sagyoKbnId 作業区分id
 * @param sagyoSijiId 作業指示id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const selectIdoDen = async (sagyoKbnId: number, sagyoSijiId: number, sagyoDenDat: string, sagyoId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_lst')
      .select(
        'ido_flg, juchu_flg, kizai_id, kizai_nam, kizai_shozoku_id, rfid_yard_qty, rfid_kics_qty, plan_juchu_qty, plan_low_qty, plan_qty, result_qty, result_adj_qty, diff_qty, ctn_flg'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId);
  } catch (e) {
    throw e;
  }
};

export const selectIdoDenOne = async (
  sagyoKbnId: number,
  sagyoSijiId: number,
  sagyoDenDat: string,
  sagyoId: number,
  kizaiId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den3_lst')
      .select(
        'ido_den_id, kizai_id, kizai_nam, plan_qty, result_qty, result_adj_qty, ctn_flg, bld_cod, tana_cod, eda_cod, kizai_mem'
      )
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('sagyo_siji_id', sagyoSijiId)
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('nyushuko_basho_id', sagyoId)
      .eq('kizai_id', kizaiId)
      .single();
  } catch (e) {
    throw e;
  }
};
