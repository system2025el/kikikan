'use server';

import { SCHEMA } from '../supabase';
import { createClient } from '../supabase-server';

/**
 * 受注ヘッドIDが一致する受注車両ヘッダのリストを取得する関数
 * @param {number} juchuHeadId 受注ヘッダID
 * @returns {} 受注車両ヘッダのデータ配列
 */
export const selectJuchuSharyoHeadList = async (juchuHeadId: number) => {
  const supabase = await createClient();
  try {
    return supabase
      .schema(SCHEMA)
      .from('v_juchu_sharyo_head_lst')
      .select('*')
      .eq('juchu_head_id', juchuHeadId)
      .not('juchu_sharyo_head_id', 'is', null);
  } catch (e) {
    throw new Error('[selectJuchuSharyoHeadList] DBエラー:', { cause: e });
  }
};
