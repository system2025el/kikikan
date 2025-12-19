'use server';

import { SCHEMA, supabase } from '../supabase';
import { TWeeklyValues } from '../types/t-weekly-type';

export const upsertTWeekly = async (data: TWeeklyValues) => {
  try {
    // レコードの存在確認
    const { data: rows, error } = await supabase
      .schema(SCHEMA)
      .from('t_weekly')
      .select('*')
      .eq('weekly_dat', data.weekly_dat);

    if (error) {
      console.error('weekly error', error);
      throw error;
    }

    if (rows && rows?.length > 0) {
      const { weekly_dat, add_dat, add_user, ...rest } = data;
      // 更新
      await supabase.schema(SCHEMA).from('t_weekly').update(rest).eq('weekly_dat', data.weekly_dat);
    } else {
      const { upd_dat, upd_user, ...rest } = data;

      if (
        !(
          (!rest.mem || rest.mem.trim() === '') &&
          (!rest.tanto_nam || rest.tanto_nam.trim() === '') &&
          rest.holiday_flg === 0
        )
      ) {
        // 新規挿入
        await supabase.schema(SCHEMA).from('t_weekly').insert(rest);
      }
    }
  } catch (e) {
    throw e;
  }
};
