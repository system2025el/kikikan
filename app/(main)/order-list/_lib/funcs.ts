'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';
import { selectFilteredJuchus } from '@/app/_lib/db/tables/v-kizai-list';

import { toJapanTimeString } from '../../_lib/date-conversion';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { OrderListTableValues, OrderSearchValues } from './types';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

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
