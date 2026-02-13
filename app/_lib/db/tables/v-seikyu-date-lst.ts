'use server';

import dayjs from 'dayjs';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { escapeLikeString } from '@/app/(main)/_lib/escape-string';
import { BillingStsSearchValues } from '@/app/(main)/(bill)/billing-sts-list/_lib/types';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 受注請求状況一覧を取得する関数
 * @param queries
 * @returns 検索条件に一致する受注請求状況の配列
 */
export const selectFilteredBillingSituations = async (queries: BillingStsSearchValues) => {
  const { selectedDate, radio, radioKokyaku, kokyaku, unbilledCusts, kokyakuTantoNam, sts } = queries;

  const builder = supabase.schema(SCHEMA).from('v_seikyu_date_lst').select('*').eq('shuko_fix_flg', 1);

  // 検索条件日付
  let dateColumn = '';
  switch (radio) {
    case 'shuko': // '出庫日が'
      dateColumn = 'shuko_dat';
      break;
    case 'nyuko': // '入庫日が'
      dateColumn = 'nyuko_dat';
      break;
  }

  if (dateColumn) {
    switch (selectedDate?.value) {
      case '1': {
        // '先月全て'
        const startOfLastMonth = dayjs().tz('Asia/Tokyo').subtract(1, 'month').startOf('month').toISOString();
        const startOfThisMonth = dayjs().tz('Asia/Tokyo').add(1, 'month').startOf('month').toISOString();
        builder.or(`and(${dateColumn}.gte.${startOfLastMonth},${dateColumn}.lt.${startOfThisMonth})`);
        break;
      }
      case '2': {
        // '今月全て'
        const startOfThisMonth = dayjs().tz('Asia/Tokyo').startOf('month').toISOString();
        const startOfNextMonth = dayjs().tz('Asia/Tokyo').add(1, 'month').startOf('month').toISOString();
        builder.or(`and(${dateColumn}.gte.${startOfThisMonth},${dateColumn}.lt.${startOfNextMonth})`);
        break;
      }
      case '3': {
        // '今日'
        const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
        const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
        builder.or(`and(${dateColumn}.gte.${startOfToday},${dateColumn}.lt.${startOfTomorrow})`);
        break;
      }
      case '4': {
        // '今日以降'
        const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
        builder.or(`${dateColumn}.gte.${startOfToday},${dateColumn}.gte.${startOfToday}`);
        break;
      }
      case '5': {
        // '明日'
        const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
        const startOfDayAfterTomorrow = dayjs().tz('Asia/Tokyo').add(2, 'day').startOf('day').toISOString();
        builder.or(`and(${dateColumn}.gte.${startOfTomorrow},${dateColumn}.lt.${startOfDayAfterTomorrow})`);
        break;
      }
      case '6': {
        // '明日以降'
        const tomorrowAndAfter = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
        builder.or(`${dateColumn}.gte.${tomorrowAndAfter},${dateColumn}.gte.${tomorrowAndAfter}`);

        break;
      }
      case '7': {
        // '指定期間'
        if (selectedDate.range?.from && selectedDate.range.to) {
          // 指定日がどちらも入ってる場合
          const startOfDay = dayjs(selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();
          const startOfnextDay = dayjs(selectedDate.range.to)
            .tz('Asia/Tokyo')
            .add(1, 'day')
            .startOf('day')
            .toISOString();
          builder.or(`and(${dateColumn}.gte.${startOfDay},${dateColumn}.lt.${startOfnextDay})`);
        } else if (selectedDate.range?.from) {
          // fromだけの場合
          const startOfDay = dayjs(selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();
          console.log('start of the day: ', startOfDay);
          builder.or(`${dateColumn}.gte.${startOfDay},${dateColumn}.gte.${startOfDay}`);
        } else if (selectedDate.range?.to) {
          // toだけの場合
          const nextDay = dayjs(selectedDate.range.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
          console.log('start of the next day: ', nextDay);
          builder.or(`${dateColumn}.lt.${nextDay},${dateColumn}.lt.${nextDay}`);
        }
        break;
      }
      default:
        break;
    }
  }

  // if (kokyaku && kokyaku > 0) {
  //   builder.eq('kokyaku_id', kokyaku ?? FAKE_NEW_ID);
  // }
  if (radioKokyaku === 'single' && kokyaku && kokyaku.trim() !== '') {
    const escapedKokyaku = escapeLikeString(kokyaku);
    builder.ilike('kokyaku_nam', `%${escapedKokyaku}%`);
  }
  if (radioKokyaku === 'multi' && unbilledCusts && unbilledCusts.length > 0) {
    builder.in('kokyaku_nam', unbilledCusts);
  }
  if (kokyakuTantoNam && kokyakuTantoNam.trim() !== '') {
    const escapedKokyakuTantoNam = escapeLikeString(kokyakuTantoNam);
    builder.ilike('kokyaku_tanto_nam', `%${escapedKokyakuTantoNam}%`);
  }
  if (sts.length === 1 && sts[0] === '1') {
    builder.neq('seikyu_jokyo_total_sts_id', 9).neq('seikyu_jokyo_sts_id', 9);
  } else if (sts.length === 1 && sts[0] === '2') {
    builder.eq('seikyu_jokyo_total_sts_id', 9).eq('seikyu_jokyo_sts_id', 9);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 受注請求状況一覧を取得する関数
 * @param queries
 * @returns 検索条件に一致する受注請求状況の配列
 */
export const selectFilteredJuchusForBill = async (queries: {
  kokyakuId: number;
  date: string;
  tantouNam: string | null;
}) => {
  const { kokyakuId, date, tantouNam } = queries;
  console.log(queries);
  let query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.koenbasho_nam,
      v.head_nam,
      v.shuko_dat,
      v.nyuko_dat,
      v.seikyu_dat,
      meisai.shokei_amt,
      (
        SELECT
          count(juchu_honbanbi_dat)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as ch
        WHERE
          ch.juchu_head_id = v.juchu_head_id
        AND
          ch.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          ch.juchu_honbanbi_shubetu_id = 40
        AND
          ch.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
      ) as honbanbi_qty,
      (
        SELECT
          sum(juchu_honbanbi_add_qty)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as sh
        WHERE
          sh.juchu_head_id = v.juchu_head_id
        AND
          sh.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          sh.juchu_honbanbi_shubetu_id = 40
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
      ) as add_dat_qty
    FROM
      ${SCHEMA}.v_seikyu_date_lst as v
    LEFT JOIN
      (
        SELECT
          juchu_head_id,
          juchu_kizai_head_id,
          sum(plan_kizai_qty * kizai_tanka_amt) as shokei_amt
        FROM
          ${SCHEMA}.t_juchu_kizai_meisai
        GROUP BY
          juchu_head_id, juchu_kizai_head_id
      ) as meisai
      ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
    WHERE
      v.kokyaku_id = $1 AND
      v.shuko_fix_flg = 1 AND
      v.shuko_dat <= $2 AND
      (v.seikyu_dat <= $2 OR v.seikyu_dat IS NULL) AND
      v.seikyu_jokyo_sts_id <> 9
  `;

  // 実行時に渡す値の配列
  const values = [kokyakuId, date];

  // tantouNamがあれば、WHERE句とvaluesに条件を追加
  if (tantouNam && tantouNam.trim() !== '') {
    // プレースホルダの番号はvaluesの要素数+1で動的に決定
    query += ` AND v.kokyaku_tanto_nam = $${values.length + 1}`;
    values.push(tantouNam);
  }

  query += `
     ORDER BY
      v.juchu_head_id ASC, v.juchu_kizai_head_id ASC;
  `;

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注請求状況明細一覧を詳細に取得する関数
 * @param queries
 * @returns 検索条件に一致する受注請求状況の明細の配列
 */
export const selectFilteredJuchuDetailsForBill = async (queries: {
  kokyakuId: number;
  date: string;
  tantouNam: string | null;
}) => {
  const { kokyakuId, date, tantouNam } = queries;
  console.log(queries);
  let query = `
      SELECT
        v.juchu_head_id,
        v.juchu_kizai_head_id,
        v.kokyaku_tanto_nam,
        v.koen_nam,
        v.koenbasho_nam,
        v.head_nam,
        v.shuko_dat,
        v.nyuko_dat,
        v.seikyu_dat,
        (
          SELECT
            count(juchu_honbanbi_dat)
          FROM
            ${SCHEMA}.t_juchu_kizai_honbanbi as ch
          WHERE
            ch.juchu_head_id = v.juchu_head_id
          AND
            ch.juchu_kizai_head_id = v.juchu_kizai_head_id
          AND
            ch.juchu_honbanbi_shubetu_id = 40
          AND
            ch.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
          AND
            ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
        ) as honbanbi_qty,
        (
          SELECT
            sum(juchu_honbanbi_add_qty)
          FROM
            ${SCHEMA}.t_juchu_kizai_honbanbi as sh
          WHERE
            sh.juchu_head_id = v.juchu_head_id
          AND
            sh.juchu_kizai_head_id = v.juchu_kizai_head_id
          --AND
            --sh.juchu_honbanbi_shubetu_id = 40
          AND
            sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
          AND
            sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $2)
        ) as add_dat_qty,
        kizai.kizai_nam,
        meisai.kizai_tanka_amt,
        meisai.plan_kizai_qty as plan_qty,
        COALESCE(meisai.indent_num, 0) as indent_num
      FROM
        ${SCHEMA}.v_seikyu_date_lst as v
      LEFT JOIN
        ${SCHEMA}.t_juchu_kizai_meisai as meisai
      ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
      LEFT JOIN
        ${SCHEMA}.m_kizai as kizai
      ON kizai.kizai_id = meisai.kizai_id
      WHERE
        v.kokyaku_id = $1 AND
        v.shuko_fix_flg = 1 AND
        v.shuko_dat <= $2 AND
        (v.seikyu_dat <= $2 OR v.seikyu_dat IS NULL) AND
        v.seikyu_jokyo_sts_id <> 9
    `;

  // 実行時に渡す値の配列
  const values = [kokyakuId, date];

  // tantouNamがあれば、WHERE句とvaluesに条件を追加
  if (tantouNam && tantouNam.trim() !== '') {
    // プレースホルダの番号はvaluesの要素数+1で動的に決定
    query += ` AND v.kokyaku_tanto_nam = $${values.length + 1}`;
    values.push(tantouNam);
  }

  query += `
       ORDER BY
        v.juchu_head_id ASC, v.juchu_kizai_head_id ASC;
    `;

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 条件に合う明細ヘッダ名の配列を取得する関数
 * @param queries 検索条件 顧客情報、受注ヘッダID、年月日
 * @returns 機材ヘッダのID類お名前の配列
 */
export const selectJuchuKizaiHeadNamListFormBill = async (queries: {
  kokyaku: { id: number; nam: string };
  tantou: string | null;
  juchuId: number | null;
  dat: Date;
}) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_seikyu_date_lst')
    .select('juchu_head_id, juchu_kizai_head_id, head_nam')
    .eq('juchu_head_id', queries.juchuId ?? FAKE_NEW_ID)
    .eq('kokyaku_id', queries.kokyaku.id)
    .eq('shuko_fix_flg', 1)
    .lte('shuko_dat', toJapanYMDString(queries.dat, '-'))
    .or(`seikyu_dat.lte.${toJapanYMDString(queries.dat, '-')},seikyu_dat.is.null`)
    .neq('seikyu_jokyo_sts_id', 9)
    .order('juchu_kizai_head_id');

  if (queries.tantou && queries.tantou.trim() !== '') {
    builder.eq('kokyaku_tanto_nam', queries.tantou);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 条件に合う受注機材明細の情報を合算して取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 受注機材ヘッダID
 * @param date 年月日
 * @returns 機材明細を一式に合算した情報の配列
 */
export const selectJuchuKizaiMeisaiHeadForBill = async (juchuId: number, kizaiHeadId: number, date: Date) => {
  const query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.koenbasho_nam,
      v.head_nam,
      v.shuko_dat,
      v.nyuko_dat,
      v.seikyu_dat,
      meisai.shokei_amt,
      (
        SELECT
          count(juchu_honbanbi_dat)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as ch
        WHERE
          ch.juchu_head_id = v.juchu_head_id
        AND
          ch.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          ch.juchu_honbanbi_shubetu_id = 40
        AND
          ch.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3) -- プレースホルダ
      ) as honbanbi_qty,
      (
        SELECT
          sum(juchu_honbanbi_add_qty)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as sh
      WHERE
          sh.juchu_head_id = v.juchu_head_id
        AND
          sh.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          sh.juchu_honbanbi_shubetu_id = 40 
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3) 
      ) as add_dat_qty
    FROM
      ${SCHEMA}.v_seikyu_date_lst as v
    LEFT JOIN
      (
        SELECT
            juchu_head_id,
            juchu_kizai_head_id,
            sum(plan_kizai_qty * kizai_tanka_amt) as shokei_amt
        FROM
            ${SCHEMA}.t_juchu_kizai_meisai
        GROUP BY
            juchu_head_id, juchu_kizai_head_id
      ) as meisai
      ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
    WHERE
      v.juchu_head_id = $1
    AND
      v.juchu_kizai_head_id = $2; 
  `;

  // 実行時に渡す値の配列
  const values = [juchuId, kizaiHeadId, toJapanYMDString(date, '-')];

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 条件に合う受注機材明細の情報を取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 受注機材ヘッダID
 * @param date 年月日
 * @returns 機材明細の詳細情報の配列
 */
export const selectJuchuKizaiMeisaiDetailsForBill = async (juchuId: number, kizaiHeadId: number, date: Date) => {
  const query = `
    SELECT
      v.juchu_head_id,
      v.juchu_kizai_head_id,
      v.kokyaku_tanto_nam,
      v.koen_nam,
      v.koenbasho_nam,
      v.head_nam,
      v.shuko_dat,
      v.nyuko_dat,
      v.seikyu_dat,
      (
        SELECT
          count(juchu_honbanbi_dat)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as ch
        WHERE
          ch.juchu_head_id = v.juchu_head_id
        AND
          ch.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          ch.juchu_honbanbi_shubetu_id = 40
        AND
          ch.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          ch.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3)
      ) as honbanbi_qty,
      (
        SELECT
          sum(juchu_honbanbi_add_qty)
        FROM
          ${SCHEMA}.t_juchu_kizai_honbanbi as sh
        WHERE
          sh.juchu_head_id = v.juchu_head_id
        AND
          sh.juchu_kizai_head_id = v.juchu_kizai_head_id
        AND
          sh.juchu_honbanbi_shubetu_id = 40
        AND
          sh.juchu_honbanbi_dat >= COALESCE(v.seikyu_dat, v.shuko_dat)
        AND
          sh.juchu_honbanbi_dat <= LEAST(v.nyuko_dat, $3)
      ) as add_dat_qty,
      kizai.kizai_nam,
      meisai.kizai_tanka_amt,
      COALESCE(meisai.indent_num, 0) as indent_num,
      meisai.plan_kizai_qty as plan_qty
    FROM
      ${SCHEMA}.v_seikyu_date_lst as v
    LEFT JOIN
      ${SCHEMA}.t_juchu_kizai_meisai as meisai
    ON v.juchu_head_id = meisai.juchu_head_id AND v.juchu_kizai_head_id = meisai.juchu_kizai_head_id
    LEFT JOIN
      ${SCHEMA}.m_kizai as kizai
    ON kizai.kizai_id = meisai.kizai_id
    WHERE
      v.juchu_head_id = $1
    AND
      v.juchu_kizai_head_id = $2; 
  `;

  // 実行時に渡す値の配列
  const values = [juchuId, kizaiHeadId, toJapanYMDString(date, '-')];

  try {
    return await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

export const selectUnbilledCusts = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_seikyu_date_lst')
    .select('kokyaku_nam')
    .eq('shuko_fix_flg', 1)
    .in('seikyu_jokyo_sts_id', [0, 1]);

  if (query && query.trim() !== '') {
    const escapedQuery = escapeLikeString(query);
    builder.ilike('kokyaku_nam', `%${escapedQuery}%`);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
