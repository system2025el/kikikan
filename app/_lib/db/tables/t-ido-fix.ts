'use server';

import { SCHEMA, supabase } from '../supabase';
import { IdoFix } from '../types/t-ido-fix-type';

export const insertIdoFix = async (data: IdoFix[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_fix').insert(data);
  } catch (e) {
    throw e;
  }
};

export const deleteIdoFix = async (idoDenIds: number[]) => {
  try {
    return await supabase.schema(SCHEMA).from('t_ido_fix').delete().in('ido_den_id', idoDenIds);
  } catch (e) {
    throw e;
  }
};
