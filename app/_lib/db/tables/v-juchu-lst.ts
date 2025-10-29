'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { OrderSearchValues } from '@/app/(main)/order-list/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 *
 * @param id
 * @returns
 */
export const selectJuchu = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select(
        'juchu_head_id, juchu_sts_nam, juchu_dat, juchu_str_dat, juchu_end_dat, nyuryoku_user, koen_nam, koenbasho_nam, kokyaku_id, kokyaku_nam, kokyaku_tanto_nam, mem, nebiki_amt, zei_nam'
      )
      .eq('juchu_head_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

export const selectJuchuHeadIds = async (strDat: string) => {
  try {
    await pool.query(` SET search_path TO ${SCHEMA};`);
    return await pool.query(`
      select 
          v_juchu_lst.juchu_head_id as "juchuHeadId"
      from 
          v_juchu_lst
      where
          -- ①出庫日がスケジュール終了日より小さい、且つ、
          v_juchu_lst.shuko_dat <= cast('${strDat}' as date) + cast( '90 days' as INTERVAL ) --【変数】
          and
          -- ②入庫日がスケジュール開始日より大きい
          v_juchu_lst.nyuko_dat >= '${strDat}'   --【変数】
      `);
  } catch (e) {
    throw e;
  }
};

export const selectPdfJuchuHead = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_lst')
      .select('juchu_head_id, koen_nam, koenbasho_nam, kokyaku_nam, nyuryoku_user, kokyaku_tanto_nam')
      .eq('juchu_head_id', juchuHeadId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 検索条件に一致する受注の一覧の配列を取得する関数
 * @param query 検索条件
 * @returns 検索にあう受注情報
 */
export const selectFilteredJuchus = async (
  query: OrderSearchValues = {
    criteria: 1,
    selectedDate: { value: '1', range: { from: null, to: null } },
    listSort: { sort: 'shuko', order: 'asc' },
  }
) => {
  console.log(query);
  const { criteria, selectedDate, customer, listSort, stageName, orderStartDate, orderFinishDate } = query;
  // 基本のクエリ
  const builder = supabase.schema(SCHEMA).from('v_juchu_lst').select(`
    juchu_head_id, juchu_sts_nam, koen_nam, koenbasho_nam, kokyaku_nam, juchu_dat, juchu_str_dat, juchu_end_dat
  `);

  // 検索条件
  // 公演名
  if (stageName && stageName.trim() !== '') {
    builder.ilike('kokyaku_nam', `%${stageName}%`);
  }

  // 顧客
  if (customer && customer !== FAKE_NEW_ID) {
    builder.eq('kokyaku_id', customer);
  }

  // 検索条件日付系
  let dateColumn = '';
  switch (criteria) {
    case 1: // '出庫日が'
      dateColumn = 'shuko_dat';
      break;
    case 2: // '入庫日が'
      dateColumn = 'nyuko_dat';
      break;
    case 3: // '受注日が'
      dateColumn = 'juchu_dat';
      break;
  }
  if (dateColumn) {
    switch (selectedDate?.value) {
      case '1': // '先月全て'
        const lastMonthStart = dayjs().tz('Asia/Tokyo').subtract(1, 'month').startOf('month').toDate();
        const lastMonthEnd = dayjs().tz('Asia/Tokyo').subtract(1, 'month').endOf('month').toDate();
        builder.gte(dateColumn, toJapanTimeString(lastMonthStart)).lte(dateColumn, toJapanTimeString(lastMonthEnd));
        break;

      case '2': // '今月全て'
        const thisMonthStart = dayjs().tz('Asia/Tokyo').startOf('month').toDate();
        const thisMonthEnd = dayjs().tz('Asia/Tokyo').endOf('month').toDate();
        builder
          .gte(dateColumn, toJapanTimeString(thisMonthStart, '-'))
          .lte(dateColumn, toJapanTimeString(thisMonthEnd));
        break;

      case '3': // '昨日'
        const yesterday = dayjs().tz('Asia/Tokyo').subtract(1, 'day').format('YYYY-MM-DD');
        builder.eq(dateColumn, toJapanTimeString(yesterday, '-'));
        break;

      case '4': // '今日'
        const today = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD');
        builder.eq(dateColumn, toJapanTimeString(today, '-'));
        break;

      case '5': // '明日'
        const tomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').format('YYYY-MM-DD');
        builder.eq(dateColumn, toJapanTimeString(tomorrow, '-'));
        break;

      case '6': // '明日以降'
        const tomorrowAndAfter = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toDate();
        builder.gte(dateColumn, toJapanDateString(tomorrowAndAfter, '-'));
        break;

      case '7': // '指定期間'
        if (selectedDate.range?.from) {
          console.log('始まり！！！！！！', toJapanDateString(selectedDate.range?.from, '-'));
          builder.gte(dateColumn, toJapanDateString(selectedDate.range.from, '-'));
        }
        if (selectedDate.range?.to) {
          const nextDay = dayjs(selectedDate.range.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toDate();
          console.log('終わりの次の日！！！！！！', toJapanDateString(nextDay), '-');
          builder.lt(dateColumn, toJapanDateString(nextDay));
        }
        break;

      default:
        break;
    }
  }

  // 受注開始日
  if (orderStartDate) {
    builder.gte('juchu_str_dat', toJapanTimeString(orderStartDate, '-'));
  }
  // 受注終了日
  if (orderFinishDate) {
    builder.lte('juchu_end_dat', toJapanTimeString(orderFinishDate, '-'));
  }

  // ソート処理
  const { sort, order } = listSort;
  // ソート項目をMap化
  const sortMap: Record<string, string> = {
    shuko: 'shuko_dat',
    nyuko: 'nyuko_dat',
    juchuId: 'juchu_head_id',
    juchuDat: 'juchu_dat',
    koenNam: 'koen_nam',
    kokyakuNam: 'kokyaku_nam',
  };
  // キーでソート基準のカラムを指定
  const sortCOlumn = sortMap[sort];
  if (sortCOlumn) {
    if (order === 'asc') builder.order(sortCOlumn).order('juchu_head_id');
    if (order === 'desc') builder.order(sortCOlumn, { ascending: false }).order('juchu_head_id');
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
