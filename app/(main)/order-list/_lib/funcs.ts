'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import pool from '@/app/_lib/db/postgres';

import { toJapanTimeString } from '../../_lib/date-conversion';
import { OrderSearchValues } from './types';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 受注一覧情報取得する関数
 * @param query 検索キーワード
 * @returns 受注情報リスト
 */
export const getFilteredOrderList = async (query: OrderSearchValues) => {
  console.log(query);
  const { criteria, selectedDate, customer, customerSort, stageName, orderStartDate, orderFinishDate } = query;
  // 基本のクエリ
  let sqlQuery = `
    SELECT
      juchu_head_id as "juchuHeadId", juchu_sts_nam as "juchuStsNam", koen_nam as "koenNam", 
      koenbasho_nam as "koenbashoNam", kokyaku_nam as "kokyakuNam", juchu_dat as "juchuDat", 
      juchu_str_dat as "juchuStrDat", juchu_end_dat as "juchuEndDat", nyushuko_sts_nam as "nyushukoStsNam"
    FROM
      v_juchu_lst 
  `;
  const queryParams = [];
  const whereClauses = [];

  // 検索条件
  // 公演名
  if (stageName && stageName.trim() !== '') {
    queryParams.push(`%${stageName}%`);
    whereClauses.push(`koen_nam ILIKE $${queryParams.length}`);
  }

  // 顧客
  if (customer && customer > 0) {
    queryParams.push(customer);
    whereClauses.push(`kokyaku_id = $${queryParams.length}`);
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
        queryParams.push(toJapanTimeString(lastMonthStart));
        whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        queryParams.push(toJapanTimeString(lastMonthEnd));
        whereClauses.push(`${dateColumn} <= $${queryParams.length}`);
        break;

      case '2': // '今月全て'
        const thisMonthStart = dayjs().tz('Asia/Tokyo').startOf('month').toDate();
        const thisMonthEnd = dayjs().tz('Asia/Tokyo').endOf('month').toDate();
        queryParams.push(toJapanTimeString(thisMonthStart));
        whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        queryParams.push(toJapanTimeString(thisMonthEnd));
        whereClauses.push(`${dateColumn} <= $${queryParams.length}`);
        break;

      case '3': // '昨日'
        const yesterday = dayjs().tz('Asia/Tokyo').subtract(1, 'day').format('YYYY-MM-DD');
        queryParams.push(toJapanTimeString(yesterday));
        whereClauses.push(`${dateColumn} = $${queryParams.length}`);
        break;

      case '4': // '今日'
        const today = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD');
        queryParams.push(toJapanTimeString(today));
        whereClauses.push(`${dateColumn} = $${queryParams.length}`);
        break;

      case '5': // '明日'
        const tomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').format('YYYY-MM-DD');
        queryParams.push(toJapanTimeString(tomorrow));
        whereClauses.push(`${dateColumn} = $${queryParams.length}`);
        break;

      case '6': // '明日以降'
        const tomorrowAndAfter = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toDate();
        queryParams.push(toJapanTimeString(tomorrowAndAfter));
        whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        break;

      case '7': // '指定期間'
        if (selectedDate.range?.from) {
          queryParams.push(toJapanTimeString(selectedDate.range.from));
          whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        }
        if (selectedDate.range?.to) {
          const nextDay = dayjs(selectedDate.range.to).add(1, 'day').startOf('day').toDate();
          queryParams.push(toJapanTimeString(nextDay));
          whereClauses.push(`${dateColumn} < $${queryParams.length}`);
        }
        break;

      default:
        break;
    }
  }

  // 受注開始日
  if (orderStartDate) {
    queryParams.push(toJapanTimeString(orderStartDate));
    whereClauses.push(`juchu_str_dat >= $${queryParams.length}`);
  }
  // 受注終了日
  if (orderFinishDate) {
    queryParams.push(toJapanTimeString(orderFinishDate));
    whereClauses.push(`juchu_end_dat <= $${queryParams.length}`);
  }

  if (whereClauses.length > 0) {
    sqlQuery += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  if (customerSort === '1') sqlQuery += ` ORDER BY kokyaku_id, "juchuHeadId";`;
  else if (customerSort === '2') sqlQuery += ` ORDER BY kokyaku_nam, "juchuHeadId";`;
  else sqlQuery += ` ORDER BY "juchuHeadId";`;

  console.log('With Parameters:', queryParams);

  try {
    await pool.query(`SET search_path TO dev2;`);
    // 処理実行
    const data = await pool.query(sqlQuery, queryParams);
    if (data) {
      console.log(data.rows);
      return data.rows;
    }
    return [];
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  } finally {
  }
};
