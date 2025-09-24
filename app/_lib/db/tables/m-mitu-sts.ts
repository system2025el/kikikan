'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectActiveMituSts = async () => {
  try {
    return await supabase.schema(SCHEMA).from('m_mitu_sts').select('sts_id, sts_nam').neq('del_flg', 1);
  } catch (e) {
    throw e;
  }
};
