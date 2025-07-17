'use server';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

export const getDaibumonsSelection = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_dai_bumon')
      .select('dai_bumon_id, dai_bumon_nam')
      .neq('del_flg', 1);
    if (!error) {
      if (!data || data.length === 0) {
        return [];
      } else {
        const selectElements: SelectTypes[] = data.map((d) => ({
          id: d.dai_bumon_id,
          label: d.dai_bumon_nam,
        }));
        console.log(selectElements.length);
        return selectElements;
      }
    } else {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
};

export const getShukeibumonsSelection = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_shukei_bumon')
      .select('shukei_bumon_id, shukei_bumon_nam')
      .neq('del_flg', 1);
    if (!error) {
      if (!data || data.length === 0) {
        return [];
      } else {
        const selectElements: SelectTypes[] = data.map((d) => ({
          id: d.shukei_bumon_id,
          label: d.shukei_bumon_nam,
        }));
        console.log(selectElements.length);
        return selectElements;
      }
    } else {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
};
