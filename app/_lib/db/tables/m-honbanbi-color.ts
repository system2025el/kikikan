'use server';

import { SCHEMA } from '../schema';
import { createClient } from '../supabase-server';

export const selectColor = async () => {
  const supabase = await createClient();
  try {
    return await supabase.schema(SCHEMA).from('m_honbanbi_color').select('clolor_id, color_nam');
  } catch (e) {
    throw new Error('[selectColor] DBエラー:', { cause: e });
  }
};
