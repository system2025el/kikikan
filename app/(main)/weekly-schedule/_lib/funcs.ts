'use server';

import { selectWeeklyList } from '@/app/_lib/db/tables/t-juchu-sharyo-head';

import { WeeklyScheduleValues } from './types';

export const getWeeklyScheduleList = async (date: Date): Promise<WeeklyScheduleValues[]> => {
  try {
    const data = await selectWeeklyList(date.toISOString());

    // console.log('===============================', data);

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
        holiday_flg: number | null;
        juchuSharyoMap: Record<string, sharyoTime>;
      }
    > = {};

    data.forEach((row) => {
      const dateKey = row.cal_dat;

      // 日付のキーが無ければ追加する、初期化
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          cal_dat: row.cal_dat,
          weekly_mem: null,
          tanto_nam: null,
          holiday_flg: null,
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
        holidayFlg: dayObj.holiday_flg,
        timeDatas: Object.values(dayObj.juchuSharyoMap),
      };
    });

    // console.log(
    //   '=============================================結果＝＝＝',
    //   resultData.map((d) => ({
    //     ...d,
    //     sharyoTimes: d.timeDatas.map((t) => `${t.juchuSharyoId}-${t.koenNam}-${t.sharyoIds}-${t.nyushukoDat}`),
    //   }))
    // );

    return resultData;
  } catch (e) {
    throw e;
  }
};
