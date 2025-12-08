'use server';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA } from '@/app/_lib/db/supabase';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { WeeklyScheduleValues } from './types';

export const selectWeeklyList = async (date: string) => {
  try {
    const query = `
        SELECT   
          CAST(cal.cal_dat AS DATE), --スケジュール日
          s_meisai.juchu_head_id,
          s_meisai.juchu_sharyo_head_id,
          s_head.head_nam as sharyo_head_nam,
          s_meisai.nyushuko_dat,
          t_weekly.mem as weekly_mem,
          t_weekly.holiday_flg,
          t_weekly.tanto_nam,
          s_meisai.nyushuko_shubetu_id,
          sharyo.sharyo_nam,
          juchu.koen_nam,
          kokyaku.kokyaku_nam
        FROM
          dev6.t_juchu_sharyo_head as s_head
        LEFT JOIN
          dev6.t_juchu_sharyo_meisai as s_meisai
        ON 
          s_head.juchu_head_id = s_meisai.juchu_head_id
        AND
          s_head.juchu_sharyo_head_id = s_meisai.juchu_sharyo_head_id
        LEFT JOIN
          dev6.t_juchu_head as juchu
        ON
          juchu.juchu_head_id = s_meisai.juchu_head_id
        LEFT JOIN
          dev6.m_kokyaku as kokyaku
        ON
          kokyaku.kokyaku_id = juchu.kokyaku_id
        LEFT JOIN
          dev6.m_sharyo as sharyo
        ON
          sharyo.sharyo_id = s_meisai.sharyo_id
        RIGHT OUTER JOIN 
          /* スケジュール生成して外部結合 */
          (
              -- スケジュールの生成範囲 /*■変数箇所■*/
              select $1::date + g.i as cal_dat from generate_series(0, 14) as g(i)
          ) as cal
        ON CAST(s_meisai.nyushuko_dat AS DATE) = cal.cal_dat    
        LEFT JOIN
          dev6.t_weekly
        ON cal.cal_dat = t_weekly.weekly_dat
        ORDER BY cal_dat;
    `;

    const values = [date];

    return (await pool.query(query, values)).rows;
  } catch (e) {
    throw e;
  }
};

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
      koenNam: string | null;
      kokyakuNam: string | null;
      sharyos: string[];
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
          targetJob.sharyos.push(row.sharyo_nam);
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
