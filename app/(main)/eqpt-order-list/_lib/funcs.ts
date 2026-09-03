'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { selectActiveUsers } from '@/app/_lib/db/tables/m-user';
import { selectFilteredKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';

import { toJapanTimeString, toJapanYMDString } from '../../_lib/date-conversion';
import { permission } from '../../_lib/permission';
import { SelectTypes } from '../../_ui/form-box';
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
    selectedDate: { value: '5', range: { from: null, to: null } },
    kokyaku: '',
    listSort: { sort: 'shuko', order: 'asc' },
    nyuryokuUser: '',
  }
): Promise<EqptOrderListTableValues[]> => {
  try {
    //
    const { data, error } = await selectFilteredKizaiHead(query);
    if (error) {
      throw new Error('[selectFilteredKizaiHead] DBエラー:', { cause: error });
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
      juchuDat: d.juchu_dat ? toJapanYMDString(d.juchu_dat) : '',
      nyuryokuUser: d.nyuryoku_user ?? '',
      addDat: d.add_dat ? toJapanYMDString(d.add_dat) : '',
    }));
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  } finally {
  }
};

/**
 * 入力者検索条件の選択肢取得（受注編集権限を持つユーザーのみ）
 * @returns 入力者の選択肢リスト
 */
export const getUsersSelection = async (): Promise<SelectTypes[]> => {
  try {
    const rows = await selectActiveUsers();
    if (!rows || rows.length === 0) {
      return [];
    }
    return rows
      .filter((d) => d.permission & permission.juchu_upd)
      .map((d) => ({
        id: d.user_nam,
        label: d.user_nam,
      }));
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};
