'use server';

import { selectFilteredJuchus } from '@/app/_lib/db/tables/v-juchu-lst';

import { OrderListTableValues, OrderSearchValues } from './types';

/**
 * 受注一覧情報取得する関数
 * @param query 検索キーワード
 * @returns 受注情報リスト
 */
export const getFilteredOrderList = async (
  query: OrderSearchValues = {
    criteria: 1,
    selectedDate: { value: '1', range: { from: null, to: null } },
    listSort: { sort: 'shuko', order: 'asc' },
  }
): Promise<OrderListTableValues[]> => {
  console.log(query);

  try {
    //
    const { data, error } = await selectFilteredJuchus(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuStsNam: d.juchu_sts_nam,
      juchuDat: d.juchu_dat,
      juchuStrDat: d.juchu_str_dat,
      juchuEndDat: d.juchu_end_dat,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      kokyakuNam: d.kokyaku_nam,
    }));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  } finally {
  }
};
