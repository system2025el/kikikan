'use server';

import { SCHEMA, supabase } from '../supabase';
import { SeikyuDatJuchuKizai } from '../types/t-seikyu-date-juchu-kizai-type';

/**
 * 受注請求完了日テーブル t_seikyu_date_juchu_kizai を更新する関数
 * @param {SeikyuDatJuchuKizai} newData t_seikyu_date_juchu_kizaiの型
 */
export const upsertSeikyuDat = async (newData: SeikyuDatJuchuKizai) => {
  try {
    console.log('できてますか？', newData);
    const { data, error } = await supabase
      .schema(SCHEMA)
      .from('t_seikyu_date_juchu_kizai')
      .select('*')
      .eq('juchu_head_id', newData.juchu_head_id)
      .eq('juchu_kizai_head_id', newData.juchu_kizai_head_id);

    if (error) {
      console.error(error);
      throw error;
    }

    if (!data || data.length === 0) {
      const { upd_dat, upd_user, ...rest } = newData;
      console.log('新規です', rest);
      //
      await supabase.schema(SCHEMA).from('t_seikyu_date_juchu_kizai').insert(rest);
    } else {
      const { add_dat, add_user, ...rest } = newData;
      console.log('更新です', rest);
      const mama = await supabase
        .schema(SCHEMA)
        .from('t_seikyu_date_juchu_kizai')
        .update(rest)
        .eq('juchu_head_id', rest.juchu_head_id)
        .eq('juchu_kizai_head_id', rest.juchu_kizai_head_id)
        .select('*');
      console.log(mama);
    }
  } catch (e) {
    throw e;
  }
};
