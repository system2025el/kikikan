'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectNyushukoDetail = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_nyushuko_den2_lst')
      .select(
        'juchu_head_id, juchu_kizai_head_id, juchu_kizai_meisai_id, juchu_kizai_head_kbn, head_namv, kizai_id, kizai_nam, koen_nam, koenbasho_nam, kokyaku_nam, nyushuko_basho_id, nyushuko_dat, nyushuko_shubetu_id, plan_qty, result_adj_qty, result_qty, sagyo_kbn_id, ctn_flg, dsp_ord_num_meisai, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .order('dsp_ord_num_meisai');
  } catch (e) {
    throw e;
  }
};

export const selectNyushukoDetailOne = async (
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
      .from('v_nyushuko_den2_lst')
      .select(
        'kizai_nam, kizai_mem, plan_qty, result_adj_qty, result_qty, ctn_flg, bld_cod, tana_cod, eda_cod, dsp_ord_num_meisai, indent_num'
      )
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_id', juchuKizaiHeadId)
      .eq('juchu_kizai_meisai_id', juchuKizaiMeisaiId)
      .eq('nyushuko_basho_id', nyushukoBashoId)
      .eq('nyushuko_dat', nyushukoDat)
      .eq('sagyo_kbn_id', sagyoKbnId)
      .eq('kizai_id', kizaiId)
      .single();
  } catch (e) {
    throw e;
  }
};
