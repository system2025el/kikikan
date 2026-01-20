'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { selectFilteredKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';

import { toJapanTimeString } from '../../_lib/date-conversion';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
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
    selectedDate: { value: '4', range: { from: null, to: null } },
    kokyaku: '',
    listSort: { sort: 'shuko', order: 'asc' },
  }
): Promise<EqptOrderListTableValues[]> => {
  console.log('ーーーーー機材明細一覧の時間確認', query);

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
      juchuHeadId: d.juchu_head_id ?? FAKE_NEW_ID,
      kizaiHeadId: d.juchu_kizai_head_id ?? FAKE_NEW_ID,
      headNam: d.head_nam ?? '',
      headKbn: d.juchu_kizai_head_kbn ?? FAKE_NEW_ID,
      oyaJuchuKizaiHeadId: d.oya_juchu_kizai_head_id,
      koenNam: d.koen_nam ?? '',
      koenbashoNam: d.koenbasho_nam ?? '',
      kokyakuNam: d.kokyaku_nam ?? '',
      kShukoDat: d.kics_shuko_dat ? toJapanTimeString(d.kics_shuko_dat) : '-',
      kNyukoDat: d.kics_nyuko_dat ? toJapanTimeString(d.kics_nyuko_dat) : '-',
      yShukoDat: d.yard_shuko_dat ? toJapanTimeString(d.yard_shuko_dat) : '-',
      yNyukoDat: d.yard_nyuko_dat ? toJapanTimeString(d.yard_nyuko_dat) : '-',
    }));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  } finally {
  }
};
