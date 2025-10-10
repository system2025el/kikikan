'use server';

import { supabase } from '../supabase';

export const selectActiveSagyoSts = async () => {
  try {
    return supabase.schema('dev6').from('m_sagyo_sts').select('sts_id, sts_nam').order('sts_id');
  } catch (e) {
    throw e;
  }
};
