'use server';

import dayjs from 'dayjs';

import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { OrderSearchValues } from '@/app/(main)/order-list/_lib/types';

import { SCHEMA, supabase } from '../supabase';

/**
 * 条件が一致する機材を取得する関数
 * @param {string} query 機材名, 部門ID, 大部門ID, 集計部門ID
 * @returns kizai_name, bumon_id, dai_bumon_id, shukei_bumon_idで検索された機材マスタの配列 検索無しなら全件
 */
export const selectFilteredEqpts = async (queries: {
  q: string;
  d: number | null;
  s: number | null;
  b: number | null;
  ngFlg?: boolean;
}) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('v_kizai_lst')
    .select(
      'kizai_id, kizai_nam, kizai_qty, kizai_ng_qty, shozoku_nam, mem, bumon_nam, dai_bumon_nam, shukei_bumon_nam, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, dsp_flg, del_flg'
    )
    .order('kizai_grp_cod')
    .order('dsp_ord_num');

  if (queries.q && queries.q.trim() !== '') {
    builder.ilike('kizai_nam', `%${queries.q}%`);
  }
  if (queries.b !== null && queries.b !== FAKE_NEW_ID) {
    builder.eq('bumon_id', queries.b);
  }
  if (queries.d !== null && queries.d !== FAKE_NEW_ID) {
    builder.eq('dai_bumon_id', queries.d);
  }
  if (queries.s !== null && queries.s !== FAKE_NEW_ID) {
    builder.eq('shukei_bumon_id', queries.s);
  }
  if (queries.ngFlg) {
    builder.gt('kizai_ng_qty', 0);
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * 機材IDが一致一致する機材のデータ配列を取得する関数
 * @param idList kizai_idの配列
 * @returns 機材ID, 機材名, 所属ID, 所属名, 機材グループコード, 表示順, 定価, ランクごとの価格, 保有数
 */
export const selectChosenEqptsDetails = async (idList: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select(
        `kizai_id, kizai_nam, shozoku_id, shozoku_nam, kizai_grp_cod, dsp_ord_num, ctn_flg, reg_amt, rank_amt_1, rank_amt_2, rank_amt_3, rank_amt_4, rank_amt_5, kizai_qty`
      )
      .in('kizai_id', idList)
      .order('kizai_grp_cod')
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 移動機材IDが一致する移動機材のデータ配列を取得する関数
 * @param idList kizai_idの配列
 * @returns 機材ID, 機材名, 所属ID, 所属名, 機材グループコード, 表示順, 定価, ランクごとの価格, 保有数
 */
export const selectChosenIdoEqptsDetails = async (idList: number[]) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select(
        `kizai_id, kizai_nam, shozoku_id, shozoku_nam, kizai_grp_cod, dsp_ord_num, rfid_kics_qty, rfid_yard_qty, ctn_flg`
      )
      .in('kizai_id', idList)
      .order('kizai_grp_cod')
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 貸出状況用機材データ取得
 * @param kizaiId 機材id
 * @returns 機材id,機材名,定価,保有数
 */
export const selectLoanKizai = async (kizaiId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select('kizai_id, kizai_nam, reg_amt, kizai_qty')
      .eq('kizai_id', kizaiId)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 在庫確認用機材データ取得
 * @param bumonId 部門id
 * @returns 機材id,機材名,保有数,部門id,部門名
 */
export const selectStockKizai = async (bumonId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_kizai_lst')
      .select(`kizai_id, kizai_nam, kizai_qty, bumon_id, bumon_nam, kizai_ng_qty`)
      .eq('bumon_id', bumonId)
      .eq('del_flg', 0)
      .eq('dsp_flg', 1)
      .order('dsp_ord_num');
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
        builder.gte(dateColumn, toJapanTimeString(thisMonthStart)).lte(dateColumn, toJapanTimeString(thisMonthEnd));
        break;

      case '3': // '昨日'
        const yesterday = dayjs().tz('Asia/Tokyo').subtract(1, 'day').format('YYYY-MM-DD');
        builder.eq(dateColumn, toJapanTimeString(yesterday));
        break;

      case '4': // '今日'
        const today = dayjs().tz('Asia/Tokyo').format('YYYY-MM-DD');
        builder.eq(dateColumn, toJapanTimeString(today));
        break;

      case '5': // '明日'
        const tomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').format('YYYY-MM-DD');
        builder.eq(dateColumn, toJapanTimeString(tomorrow));
        break;

      case '6': // '明日以降'
        const tomorrowAndAfter = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toDate();
        builder.gte(dateColumn, toJapanDateString(tomorrowAndAfter));
        break;

      case '7': // '指定期間'
        if (selectedDate.range?.from) {
          console.log('始まり！！！！！！', toJapanDateString(selectedDate.range?.from));
          builder.gte(dateColumn, toJapanDateString(selectedDate.range.from));
        }
        if (selectedDate.range?.to) {
          const nextDay = dayjs(selectedDate.range.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toDate();
          console.log('終わりの次の日！！！！！！', toJapanDateString(nextDay));
          builder.lt(dateColumn, toJapanDateString(nextDay));
        }
        break;

      default:
        break;
    }
  }

  // 受注開始日
  if (orderStartDate) {
    builder.gte('juchu_str_dat', toJapanTimeString(orderStartDate));
  }
  // 受注終了日
  if (orderFinishDate) {
    builder.lte('juchu_end_dat', toJapanTimeString(orderFinishDate));
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
