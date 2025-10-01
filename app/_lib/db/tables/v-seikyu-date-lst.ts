'use server';

import { BillingStsSearchValues } from '@/app/(main)/(bill)/billing-sts-list/_lib/types';

import { SCHEMA, supabase } from '../supabase';

export const selectFilteredBillingSts = async (queries: BillingStsSearchValues) => {
  const { kokyaku, kokyakuTantoNam, sts } = queries;

  const builder = supabase
    .schema(SCHEMA)
    .from('v_seikyu_date_lst')
    .select('*')
    .eq('kokyaku_id', kokyaku)
    .eq('shuko_fix_flg', 1);

  if (kokyakuTantoNam && kokyakuTantoNam !== '') {
    builder.eq('kokyaku_tanto_nam', kokyakuTantoNam);
  }
  if (sts.length === 1 && sts[0] === '1') {
    builder.neq('seikyu_jokyo_total_sts_id', 9).neq('seikyu_jokyo_sts_id', 9);
  } else if (sts.length === 1 && sts[0] === '2') {
    builder.eq('seikyu_jokyo_total_sts_id', 9).eq('seikyu_jokyo_sts_id', 9);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
