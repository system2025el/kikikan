'use server';

import { SCHEMA, supabase } from '../supabase';

/**
 * 機材IDが一致するRFIDタグの数を返す
 * @param id kizai_id
 * @returns
 */
export const selectCountOfTheEqpt = async (id: number) => {
  try {
    return await supabase.schema(SCHEMA).from('m_rfid').select('*', { count: 'exact', head: true }).eq('kizai_id', id);
  } catch (e) {
    throw e;
  }
};
