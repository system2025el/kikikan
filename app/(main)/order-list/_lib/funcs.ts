'use server';

import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/postgres/postgres';
import { supabase } from '@/app/_lib/supabase/supabase';

import { OrderListTableValues, OrderSearchValues } from './types';

/**
 * 受注一覧情報取得
 * @param query 検索キーワード
 * @returns 受注情報リスト
 */
export const getFilteredOrderList = async (query: OrderSearchValues) => {
  console.log(query);
  const { criteria, selectedDate, customer, stageName, orderStartDate, orderFinishDate } = query;
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
        const lastMonthStart = dayjs().subtract(1, 'month').startOf('month').toDate();
        const lastMonthEnd = dayjs().subtract(1, 'month').endOf('month').toDate();
        queryParams.push(lastMonthStart);
        whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        queryParams.push(lastMonthEnd);
        whereClauses.push(`${dateColumn} <= $${queryParams.length}`);
        break;

      case '2': // '今月全て'
        const thisMonthStart = dayjs().startOf('month').toDate();
        const thisMonthEnd = dayjs().endOf('month').toDate();
        queryParams.push(thisMonthStart);
        whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        queryParams.push(thisMonthEnd);
        whereClauses.push(`${dateColumn} <= $${queryParams.length}`);
        break;

      case '3': // '昨日'
        const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
        queryParams.push(yesterday);
        whereClauses.push(`${dateColumn} = $${queryParams.length}`);
        break;

      case '4': // '今日'
        const today = dayjs().format('YYYY-MM-DD');
        queryParams.push(today);
        whereClauses.push(`${dateColumn} = $${queryParams.length}`);
        break;

      case '5': // '明日'
        const tomorrow = dayjs().add(1, 'day').format('YYYY-MM-DD');
        queryParams.push(tomorrow);
        whereClauses.push(`${dateColumn} = $${queryParams.length}`);
        break;

      case '6': // '明日以降'
        const tomorrowAndAfter = dayjs().add(1, 'day').startOf('day').toDate();
        queryParams.push(tomorrowAndAfter);
        whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        break;

      case '7': // '指定期間'
        if (selectedDate.range?.from) {
          queryParams.push(selectedDate.range.from);
          whereClauses.push(`${dateColumn} >= $${queryParams.length}`);
        }
        if (selectedDate.range?.to) {
          const nextDay = dayjs(selectedDate.range.to).add(1, 'day').startOf('day').toDate();
          queryParams.push(nextDay);
          whereClauses.push(`${dateColumn} < $${queryParams.length}`);
        }
        break;

      default:
        break;
    }
  }
  if (whereClauses.length > 0) {
    sqlQuery += ` WHERE ${whereClauses.join(' AND ')}`;
  }
  sqlQuery += ` ORDER BY "juchuHeadId";`;
  console.log('Executing SQL:', sqlQuery);
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
