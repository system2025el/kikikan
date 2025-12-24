'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectDic = async (dicId: number) => {
  try {
    return await supabase.schema(SCHEMA).from('m_dic').select('dic_val').eq('dic_id', dicId).single();
  } catch (e) {
    throw e;
  }
};
