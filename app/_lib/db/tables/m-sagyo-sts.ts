'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectActiveSagyoSts = async () => {
  try {
    return supabase.schema(SCHEMA).from('m_sagyo_sts').select('sts_id, sts_nam').order('sts_id');
  } catch (e) {
    throw e;
  }
};
