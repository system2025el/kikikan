'use server';

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

export const getBumonsSelection = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_bumon')
      .select('bumon_id, bumon_nam')
      .neq('del_flg', 1);
    if (!error) {
      if (!data || data.length === 0) {
        return [];
      } else {
        const selectElements: SelectTypes[] = data.map((d) => ({
          id: d.bumon_id,
          label: d.bumon_nam,
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

export const getShozokuSelection = async () => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_shozoku')
      .select('shozoku_id, shozoku_nam')
      .neq('del_flg', 1);
    if (!error) {
      if (!data || data.length === 0) {
        return [];
      } else {
        const selectElements: SelectTypes[] = data.map((d) => ({
          id: d.shozoku_id,
          label: d.shozoku_nam,
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

/**
 * 選択肢のまとめたデータ
 * @returns {{SelectTypes[]}} 0:daibumon, 1:shukeibumon, 2:bumon, 3:shozoku
 */
export const getAllSelections = async (): Promise<{
  d: SelectTypes[];
  s: SelectTypes[];
  b: SelectTypes[];
  shozoku: SelectTypes[];
}> => {
  try {
    const [daibumons, shukeibumons, bumons, shozoku] = await Promise.all([
      getDaibumonsSelection(),
      getShukeibumonsSelection(),
      getBumonsSelection(),
      getShozokuSelection(),
    ]);

    return { d: daibumons!, s: shukeibumons!, b: bumons!, shozoku: shozoku! };
  } catch (error) {
    console.error('Error fetching all selections:', error);
    return { d: [], s: [], b: [], shozoku: [] };
  }
};
