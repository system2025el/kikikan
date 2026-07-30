'use server';

import { SCHEMA, supabase } from '../supabase';

export const selectColor = async () => {
  try {
    return await supabase.schema(SCHEMA).from('m_honbanbi_color').select('clolor_id, color_nam');
  } catch (e) {
    throw new Error('[selectColor] DBエラー:', { cause: e });
  }
};
