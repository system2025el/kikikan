'use server';

import { BillSearchValues } from '@/app/(main)/(bill)/bill-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

export const selectFilteredBills = async (queries: BillSearchValues) => {
  const { billId, billingSts, range, kokyaku, kokyakuTantoNam } = queries;
  const builder = supabase
    .schema(SCHEMA)
    .from('v_seikyu_lst')
    .select('seikyu_head_id, sts_nam, seikyu_head_nam, kokyaku_nam, seikyu_dat, kokyaku_tanto_nam');

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
