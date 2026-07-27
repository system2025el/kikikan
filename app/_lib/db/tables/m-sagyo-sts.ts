'use server';

import { SCHEMA } from '../supabase';
import { createClient } from '../supabase-server';

export const selectActiveSagyoSts = async () => {
  const supabase = await createClient();
  try {
    return supabase.schema(SCHEMA).from('m_sagyo_sts').select('sts_id, sts_nam').order('sts_id');
  } catch (e) {
    throw new Error('[selectActiveSagyoSts] DBエラー:', { cause: e });
  }
};
