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

  try {
    await pool.query(`SET search_path TO dev2;`);

    // 基本のクエリ
    let sqlQuery = `
    SELECT
      v.juchu_head_id as "juchuHeadId", v.juchu_sts_nam as "juchuStsNam", v.koen_nam as "koenNam", 
      v.koenbasho_nam as "koenbashoNam", v.kokyaku_nam as "kokyakuNam", v.juchu_dat as "juchuDat", 
      v.juchu_str_dat as "juchuStrDat", v.juchu_end_dat as "juchuEndDat", v.nyushuko_sts_nam as "nyushukoStsNam"
    FROM
      v_juchu_lst v
    INNER JOIN
      m_kokyaku m ON v.kokyaku_id = m.kokyaku_id 
  `;
    const queryParams = [];
    const whereClauses = [];

    // 検索条件
    // 公演名
    if (stageName && stageName.trim() !== '') {
      queryParams.push(`%${stageName}%`);
      whereClauses.push(`v.koen_nam ILIKE $${queryParams.length}`);
    }

    // 顧客
    if (customer && customer > 0) {
      queryParams.push(customer);
      whereClauses.push(`m.kokyaku_id = $${queryParams.length}`);
    }

    // 検索条件日付系
    let dateColumn = '';
    switch (criteria) {
      case 1: // '出庫日が'
        dateColumn = 'v.shuko_dat';
        break;
      case 2: // '入庫日が'
        dateColumn = 'v.nyuko_dat';
        break;
      case 3: // '受注日が'
        dateColumn = 'v.juchu_dat';
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
