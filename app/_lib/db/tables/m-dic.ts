'use server';

import { SCHEMA } from '../supabase';
import { createClient } from '../supabase-server';

export const selectDic = async (dicId: number) => {
  const supabase = await createClient();
  try {
    return await supabase.schema(SCHEMA).from('m_dic').select('dic_val').eq('dic_id', dicId).single();
  } catch (e) {
    throw new Error('[selectDic] DBエラー:', { cause: e });
  }
};
