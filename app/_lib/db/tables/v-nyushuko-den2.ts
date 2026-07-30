import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { NYUSHUKO_SHUBETU_ID } from '@/app/_lib/constants';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { escapeLikeString } from '@/app/(main)/_lib/escape-string';
import { NyukoListSearchValues } from '@/app/(main)/nyuko-list/_lib/types';
import { ShukoListSearchValues } from '@/app/(main)/shuko-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

export const selectFilteredShukoList = async (queries: ShukoListSearchValues) => {
  let query = `
    SELECT
      d2.juchu_head_id,
      d2.koen_nam,
      d2.koenbasho_nam,
      d2.nyushuko_dat,
      d2.nyushuko_basho_id,
      d2.juchu_kizai_head_idv,
      d2.juchu_kizai_head_kbnv,
      d2.head_namv,
      d2.section_namv,
      d2.kokyaku_nam,
      d2.sstb_sagyo_sts_id,
      d2.sstb_sagyo_sts_nam_short,
      d2.schk_sagyo_sts_id,
      d2.schk_sagyo_sts_nam_short,
      d2.shuko_fix_flg,
      d2.nyuryoku_user,
      d2.sstb_plan_qty,
      d2.schk_plan_qty
    FROM
      ${SCHEMA}.v_nyushuko_den2 as d2
    WHERE
      d2.nyushuko_shubetu_id = ${NYUSHUKO_SHUBETU_ID.shuko}
  `;

  // 入出庫日
  switch (queries.selectedDate.value) {
    case '1': {
      // '昨日'
      const startOfYesterday = dayjs().tz('Asia/Tokyo').subtract(1, 'day').startOf('day').toISOString();
      const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
      query += ` AND d2.nyushuko_dat >= '${startOfYesterday}' AND d2.nyushuko_dat < '${startOfToday}'`;
      break;
    }
    case '2': {
      // '今日'
      const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
      const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
      query += ` AND d2.nyushuko_dat >= '${startOfToday}' AND d2.nyushuko_dat < '${startOfTomorrow}'`;
      break;
    }
    case '3': {
      // '明日'
      const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
      const startOfDayAfterTomorrow = dayjs().tz('Asia/Tokyo').add(2, 'day').startOf('day').toISOString();
      query += ` AND d2.nyushuko_dat >= '${startOfTomorrow}' AND d2.nyushuko_dat < '${startOfDayAfterTomorrow}'`;
      break;
    }
    case '4': {
      // '指定期間'
      if (queries.selectedDate.range.from && queries.selectedDate.range.to) {
        // 指定日がどちらも入ってる場合
        const startOfDay = dayjs(queries.selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();
        const startOfnextDay = dayjs(queries.selectedDate.range.to)
          .tz('Asia/Tokyo')
          .add(1, 'day')
          .startOf('day')
          .toISOString();
        query += ` AND d2.nyushuko_dat >= '${startOfDay}' AND d2.nyushuko_dat < '${startOfnextDay}'`;
      } else if (queries.selectedDate.range.from) {
        // fromだけの場合
        const startOfDay = dayjs(queries.selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();

        query += ` AND d2.nyushuko_dat >= '${startOfDay}'`;
      } else if (queries.selectedDate.range.to) {
        // toだけの場合
        const startOfnextDay = dayjs(queries.selectedDate.range.to)
          .tz('Asia/Tokyo')
          .add(1, 'day')
          .startOf('day')
          .toISOString();

        query += ` AND d2.nyushuko_dat < '${startOfnextDay}'`;
      }
      break;
    }
    default:
      break;
  }

  // 受注番号
  if (queries.juchuHeadId !== null) {
    query += ` AND d2.juchu_head_id = ${queries.juchuHeadId}`;
  }
  // 出庫場所
  if (queries.shukoBasho !== 0) {
    query += ` AND d2.nyushuko_basho_id = ${queries.shukoBasho}`;
  }
  // 顧客名称
  if (queries.kokyaku && queries.kokyaku.trim() !== '') {
    const escapedKokyaku = escapeLikeString(queries.kokyaku);
    query += ` AND d2.kokyaku_nam ILIKE '%${escapedKokyaku}%'`;
  }
  // 課
  if (queries.section && queries.section.length !== 0) {
    const likeClouds = queries.section.map((d) => ` d2.section_namv::TEXT LIKE '%${d}%'`).join(' OR');
    query += ` AND (${likeClouds})`;
  }

  query += ' ORDER BY d2.nyushuko_dat';

  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw new Error('[selectFilteredShukoList] DBエラー:', { cause: e });
  }
};

export const selectFilteredNyukoList = async (queries: NyukoListSearchValues) => {
  let query = `
    SELECT
      d2.juchu_head_id,
      d2.koen_nam,
      d2.koenbasho_nam,
      d2.nyushuko_dat,
      d2.nyushuko_basho_id,
      d2.juchu_kizai_head_idv,
      d2.juchu_kizai_head_kbnv,
      d2.head_namv,
      d2.section_namv,
      d2.kokyaku_nam,
      d2.nchk_sagyo_sts_id,
      d2.nchk_sagyo_sts_nam_short,
      d2.nyuko_fix_flg,
      d2.nyuryoku_user,
      d2.nchk_plan_qty
    FROM
      ${SCHEMA}.v_nyushuko_den2 as d2
    WHERE
      d2.nyushuko_shubetu_id = ${NYUSHUKO_SHUBETU_ID.nyuko}
  `;

  // 入出庫日
  switch (queries.selectedDate.value) {
    case '1': {
      // '昨日'
      const startOfYesterday = dayjs().tz('Asia/Tokyo').subtract(1, 'day').startOf('day').toISOString();
      const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
      query += ` AND d2.nyushuko_dat >= '${startOfYesterday}' AND d2.nyushuko_dat < '${startOfToday}'`;
      break;
    }
    case '2': {
      // '今日'
      const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
      const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
      query += ` AND d2.nyushuko_dat >= '${startOfToday}' AND d2.nyushuko_dat < '${startOfTomorrow}'`;
      break;
    }
    case '3': {
      // '明日'
      const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
      const startOfDayAfterTomorrow = dayjs().tz('Asia/Tokyo').add(2, 'day').startOf('day').toISOString();
      query += ` AND d2.nyushuko_dat >= '${startOfTomorrow}' AND d2.nyushuko_dat < '${startOfDayAfterTomorrow}'`;
      break;
    }
    case '4': {
      // '指定期間'
      if (queries.selectedDate.range.from && queries.selectedDate.range.to) {
        // 指定日がどちらも入ってる場合
        const startOfDay = dayjs(queries.selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();
        const startOfnextDay = dayjs(queries.selectedDate.range.to)
          .tz('Asia/Tokyo')
          .add(1, 'day')
          .startOf('day')
          .toISOString();
        query += ` AND d2.nyushuko_dat >= '${startOfDay}' AND d2.nyushuko_dat < '${startOfnextDay}'`;
      } else if (queries.selectedDate.range.from) {
        // fromだけの場合
        const startOfDay = dayjs(queries.selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();

        query += ` AND d2.nyushuko_dat >= '${startOfDay}'`;
      } else if (queries.selectedDate.range.to) {
        // toだけの場合
        const startOfnextDay = dayjs(queries.selectedDate.range.to)
          .tz('Asia/Tokyo')
          .add(1, 'day')
          .startOf('day')
          .toISOString();

        query += ` AND d2.nyushuko_dat < '${startOfnextDay}'`;
      }
      break;
    }
    default:
      break;
  }

  // 受注番号
  if (queries.juchuHeadId !== null) {
    query += ` AND d2.juchu_head_id = ${queries.juchuHeadId}`;
  }
  // 入庫場所
  if (queries.nyukoBasho !== 0) {
    query += ` AND d2.nyushuko_basho_id = ${queries.nyukoBasho}`;
  }
  // 顧客名称
  if (queries.kokyaku && queries.kokyaku.trim() !== '') {
    const escapedKokyaku = escapeLikeString(queries.kokyaku);
    query += ` AND d2.kokyaku_nam ILIKE '%${escapedKokyaku}%'`;
  }
  // 課
  if (queries.section && queries.section.length !== 0) {
    const likeClouds = queries.section.map((d) => ` d2.section_namv::TEXT LIKE '%${d}%'`).join(' OR');
    query += ` AND (${likeClouds})`;
  }

  query += ' ORDER BY d2.nyushuko_dat';

  try {
    return (await pool.query(query)).rows;
  } catch (e) {
    throw new Error('[selectFilteredNyukoList] DBエラー:', { cause: e });
  }
};

/**
 * 出庫作業ステータス確認
 * @param juchuHeadId
 * @param juchuKizaiHeadId
 * @returns
 */
export const selectShukoStateConfirm = async (juchuHeadId: number, juchuKizaiHeadId: number) => {
  const query = `
    select
      juchu_kizai_head_idv
    from 
      v_nyushuko_den2 
    where 
      juchu_head_id = $1
      and ('[' || replace(v_nyushuko_den2.juchu_kizai_head_idv ,',' , '][')  || ']') like '%[' || $2 || ']%' --1で検索したときに10などが引っ掛からないよう[]をつけて検索
      and nyushuko_shubetu_id = $3
      and (sstb_sagyo_sts_id > 0 or schk_sagyo_sts_id > 0 or shuko_fix_flg = $4)
  `;

  const values = [juchuHeadId, juchuKizaiHeadId, 1, 1];

  try {
    return (await pool.query(query, values)).rows;
  } catch (e) {
    throw new Error('[selectShukoStateConfirm] DBエラー:', { cause: e });
  }
};

// export const selectNyushukoOne = async (
//   juchuHeadId: number,
//   juchuKizaiHeadKbn: number,
//   nyushukoBashoId: number,
//   nyushukoDat: string,
//   nyushukoShubetuId: number
// ) => {
//   try {
//     return await supabase
//       .schema(SCHEMA)
//       .from('v_nyushuko_den2')
//       .select('koen_nam, juchu_kizai_head_idv, head_namv, koenbasho_nam, kokyaku_nam')
//       .eq('juchu_head_id', juchuHeadId)
//       .eq('juchu_kizai_head_kbnv', juchuKizaiHeadKbn.toString())
//       .eq('nyushuko_basho_id', nyushukoBashoId)
//       .eq('nyushuko_dat', nyushukoDat)
//       .eq('nyushuko_shubetu_id', nyushukoShubetuId)
//       .single();
//     // const queey = `
//     //   SELECT
//     //     koen_nam,
//     //     juchu_kizai_head_idv,
//     //     head_namv,
//     //     koenbasho_nam,
//     //     kokyaku_nam
//     //   FROM ${SCHEMA}.v_nyushuko_den2
//     //   WHERE juchu_head_id = $1
//     //     AND juchu_kizai_head_kbnv = $2
//     //     AND nyushuko_basho_id = $3
//     //     AND nyushuko_dat = $4
//     //     AND nyushuko_shubetu_id = $5
//     //     LIMIT 1
//     // `;
//     // const values = [juchuHeadId, juchuKizaiHeadKbn.toString(), nyushukoBashoId, nyushukoDat, nyushukoShubetuId];
//     // const result = await pool.query(queey, values);
//     // return result.rows;
//   } catch (e) {
//     throw e;
//   }
// };
