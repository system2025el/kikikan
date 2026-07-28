'use server';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

export const selectActiveMituSts = async () => {
  const supabase = await createClient();
  try {
    return await supabase.schema(SCHEMA).from('m_mitu_sts').select('sts_id, sts_nam').neq('del_flg', 1).order('sts_id');
  } catch (e) {
    throw new Error('[selectActiveMituSts] DBエラー:', { cause: e });
  }
};
