'use server';

import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';

import { SCHEMA, supabase } from '../supabase';

/**
 * 作業日指定移動リスト取得
 * @param sagyoDenDat 作業日
 * @param sagyoSijiId 作業指示id
 * @returns
 */
export const selectFilteredIdoList = async (sagyoDenDat: string, sagyoSijiId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_ido_den2yoko')
      .select(
        'nyushuko_dat, ido_den_id, juchu_flg, sagyo_siji_id, schk_sagyo_sts_id, nchk_sagyo_sts_id, shuko_fix_flg, nyuko_fix_flg'
      )
      .eq('nyushuko_dat', sagyoDenDat)
      .eq('sagyo_siji_id', sagyoSijiId);
  } catch (e) {
    throw e;
  }
};
