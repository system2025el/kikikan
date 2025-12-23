'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { selectWeeklyList } from '@/app/_lib/db/tables/t-juchu-sharyo-head';
import { upsertTWeekly } from '@/app/_lib/db/tables/t-weekly';
import { TWeeklyValues } from '@/app/_lib/db/types/t-weekly-type';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { WeeklyScheduleValues, WeeklySearchValues, WeeklyValues } from './types';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Weeklyスケジュールを取得する関数
 * @param date
 * @returns
 */
export const getWeeklyScheduleList = async (query: WeeklySearchValues): Promise<WeeklyScheduleValues[]> => {
  const { startDate, endDate, dateCount } = query;
  const DEFAULT_COUNT = 30;
  let count: number;
  let date: string;

  if (startDate && endDate) {
    // start, endどちらも入力されているとき
    count = dayjs(endDate).tz('Asia/Tokyo').diff(dayjs(startDate), 'day') + 1;
    date = toJapanYMDString(startDate, '-');
    console.log('ssssssssssssssssaaaaaaaaaaaaaaaaaaaaaaaa', count, date);
  } else if (!startDate && endDate) {
    // endだけ入力されているとき
    count = dateCount && dateCount !== 0 ? dateCount - 1 : DEFAULT_COUNT;
    /** endDateから表示日数分前の日付 */
    date = dayjs(endDate).tz('Asia/Tokyo').subtract(count, 'day').format(`YYYY-MM-DD`);
  } else if (!endDate && startDate) {
    // startだけ入力されているとき
    count = dateCount && dateCount !== 0 ? dateCount - 1 : DEFAULT_COUNT;
    date = toJapanYMDString(startDate, '-');
  } else {
    // 全てない場合は今日で31日表示
    count = dateCount && dateCount !== 0 ? dateCount - 1 : DEFAULT_COUNT;
    date = toJapanYMDString(new Date(), '-');
  }
  try {
    // データ取得実行
    const data = await selectWeeklyList({
      start: date,
      count: count,
    });

    type sharyoTime = {
      juchuHeadId: number;
      juchuSharyoId: number;
      sharyoHeadNam: string | null;
      nyushukoDat: string | null;
      nyushukoShubetuId: number | null;
      nyushukoBashoId: number | null;
      koenNam: string | null;
      kokyakuNam: string | null;
      sharyos: { nam: string; daisu: number }[];
    };

    // 日付をキーにして、集計用オブジェクトを保持するMap
    const dateMap: Record<
      string,
      {
        cal_dat: string;
        weekly_mem: string | null;
        tanto_nam: string | null;
        holiday_flg: boolean | null;
        juchuSharyoMap: Record<string, sharyoTime>;
      }
    > = {};

    data.forEach((row) => {
      const dateKey = row.cal_dat;

      // 日付のキーが無ければ追加する、初期化
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          cal_dat: row.cal_dat,
          weekly_mem: row.weekly_mem ?? null,
          tanto_nam: row.tanto_nam ?? null,
          holiday_flg: row.holiday_flg ? Boolean(row.holiday_flg) : null,
          juchuSharyoMap: {},
        };
      }

      // 今の日付キー
      const currentDay = dateMap[dateKey];

      // 時間と受注ごとに整理
      // 車両明細情報がない行はスキップ
      if (!row.juchu_head_id || !row.juchu_sharyo_head_id) {
        return;
      }

      // 複合キー
      const sharyoMeisaiKey = `${row.juchu_head_id}-${row.juchu_sharyo_head_id}-${row.nyushuko_dat}`;

      // まだこの明細が登録されていなければ作成
      if (!currentDay.juchuSharyoMap[sharyoMeisaiKey]) {
        currentDay.juchuSharyoMap[sharyoMeisaiKey] = {
          juchuHeadId: row.juchu_head_id,
          juchuSharyoId: row.juchu_sharyo_head_id,
          sharyoHeadNam: row.sharyo_head_nam,
          nyushukoDat: row.nyushuko_dat,
          nyushukoShubetuId: row.nyushuko_shubetu_id,
          nyushukoBashoId: row.nyushuko_basho_id,
          koenNam: row.koen_nam,
          kokyakuNam: row.kokyaku_nam,
          sharyos: [],
        };
      }

      // 車両整理
      if (row.sharyo_nam !== null) {
        const targetJob = currentDay.juchuSharyoMap[sharyoMeisaiKey];
        // 重複チェック
        if (!targetJob.sharyos.includes(row.sharyo_nam)) {
          targetJob.sharyos.push({ nam: row.sharyo_nam, daisu: row.daisu });
        }
      }
    });

    // dateMapを配列に変換
    // juchuSharyoMapを配列に変換
    const resultData = Object.values(dateMap).map((dayObj) => {
      return {
        calDat: dayObj.cal_dat,
        mem: dayObj.weekly_mem,
        tantoNam: dayObj.tanto_nam,
        holidayFlg: Boolean(dayObj.holiday_flg),
        timeDatas: Object.values(dayObj.juchuSharyoMap),
      };
    });

    return resultData;
  } catch (e) {
    throw e;
  }
};

/**
 * 日付に対するシフト担当者、メモ、祝日フラグを成型する関数
 * @param  data フォームのデータ
 * @param {string} user ログインユーザ名
 */
export const insertWeeklyData = async (data: WeeklyValues, user: string) => {
  const now = new Date().toISOString();
  const newData: TWeeklyValues = {
    weekly_dat: toJapanYMDString(data.dat, '-'),
    mem: data.mem,
    tanto_nam: data.tantoNam,
    holiday_flg: Number(data.holidayFlg),
    add_dat: now,
    add_user: user,
    upd_dat: now,
    upd_user: user,
  };
  try {
    await upsertTWeekly(newData);
  } catch (e) {
    throw e;
  }
};
