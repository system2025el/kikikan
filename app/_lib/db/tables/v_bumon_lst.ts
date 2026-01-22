'use server';

import { escapeLikeString } from '@/app/(main)/_lib/escape-string';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import { SCHEMA, supabase } from '../supabase';

/**
 * DBから有効な部門を取得する関数
 * @returns 有効な部門のidと名前の配列
 */
export const selectActiveBumons = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_bumon_lst')
      .select('bumon_id, bumon_nam')
      .neq('del_flg', 1)
      .order('kizai_grp_cod');
  } catch (e) {
    throw e;
  }
};

/**
 * 条件が一致する部門を取得する関数
 * @param {string} query 部門名, 大部門ID, 集計部門ID
 * @returns bumon_name, dai_bumon_id, shukei_bumon_idで検索された部門マスタの配列 検索無しなら全件
 */
export const selectFilteredBumons = async (queries: { q: string; d: number | null; s: number | null }) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_bumon_lst')
    .select('bumon_id, bumon_nam, mem, del_flg')
    .order('kizai_grp_cod');

  if (queries.q && queries.q.trim() !== '') {
    const escapedBumonNam = escapeLikeString(queries.q);
    builder.ilike('bumon_nam', `%${escapedBumonNam}%`);
  }
  if (queries.d !== null && queries.d !== FAKE_NEW_ID) {
    builder.eq('dai_bumon_id', queries.d);
  }
  if (queries.s !== null && queries.s !== FAKE_NEW_ID) {
    builder.eq('shukei_bumon_id', queries.s);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
