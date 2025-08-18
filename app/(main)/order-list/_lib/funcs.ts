import { revalidatePath } from 'next/cache';

import { supabase } from '@/app/_lib/supabase/supabase';

import { OrderListTableValues } from './types';

/**
 * 受注一覧情報取得
 * @param query 検索キーワード
 * @returns 受注情報リスト
 */
export const getFilteredOrderList = async (query: string) => {
  const builder = supabase
    .schema('dev2')
    .from('v_juchu_lst')
    .select(
      'juchu_head_id, juchu_sts_nam, koen_nam, koenbasho_nam, kokyaku_nam, juchu_dat, juchu_str_dat, juchu_end_dat, nyushuko_sts_nam'
    );

  // if (query && query.trim() !== '') {
  //   builder.or(
  //     `koenbasho_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
  //   );
  // }

  try {
    const { data, error } = await builder;
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredOrderList: OrderListTableValues[] = data.map((d, index) => ({
          juchuHeadId: d.juchu_head_id,
          juchuStsNam: d.juchu_sts_nam,
          koenNam: d.koen_nam,
          koenbashoNam: d.koenbasho_nam,
          kokyakuNam: d.kokyaku_nam,
          juchuDat: d.juchu_dat,
          juchuStrDat: d.juchu_str_dat,
          juchuEndDat: d.juchu_end_dat,
          nyushukoStsNam: d.nyushuko_sts_nam,
        }));
        console.log(filteredOrderList.length);
        return filteredOrderList;
      }
    } else {
      console.error('受注一覧情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/order-list');
};
