'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { selectFilteredKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';

import { EqptOrderListTableValues, EqptOrderSearchValues } from './types';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 受注一覧情報取得する関数
 * @param query 検索キーワード
 * @returns 受注情報リスト
 */
export const getFilteredOrderList = async (
  query: EqptOrderSearchValues = {
    radio: 'shuko',
    range: { from: new Date(), to: new Date() },
  }
): Promise<EqptOrderListTableValues[]> => {
  console.log(query);

  try {
    //
    const { data, error } = await selectFilteredKizaiHead(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      kizaiHeadId: d.juchu_kizai_head_id,
      headNam: d.head_nam,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      kokyakuNam: d.kokyaku_nam,
      kShukoDat: d.kics_shuko_dat,
      kNyukoDat: d.kics_nyuko_dat,
      yShukoDat: d.yard_shuko_dat,
      yNyukoDat: d.yard_nyuko_dat,
    }));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  } finally {
  }
};
