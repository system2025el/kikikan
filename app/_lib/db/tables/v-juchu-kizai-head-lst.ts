'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { EqptOrderSearchValues } from '@/app/(main)/eqpt-order-list/_lib/types';

import { SCHEMA, supabase } from '../supabase';

// .tz()を使う準備
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuKizaiHeadList = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select(
        'juchu_head_id, juchu_kizai_head_id, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, sikomibi, rihabi, genebi, honbanbi, juchu_honbanbi_calc_qty, shokei, nebiki_amt, mem, oya_juchu_kizai_head_id, ht_kbn, juchu_kizai_head_kbn, nebiki_rat, kics_shuko_fix_flg, yard_shuko_fix_flg'
      )
      .eq('juchu_head_id', juchuHeadId)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

/**
 * 受注機材ヘッダーリスト取得
 * @param juchuHeadId 受注機材ヘッダーid
 * @returns
 */
export const selectJuchuKizaiHeadNamList = async (juchuHeadId: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select('juchu_head_id, juchu_kizai_head_id, head_nam, nebiki_amt')
      .eq('juchu_head_id', juchuHeadId)
      .eq('juchu_kizai_head_kbn', 1)
      .not('juchu_kizai_head_id', 'is', null);
  } catch (e) {
    throw e;
  }
};

export const selectPdfJuchuKizaiHead = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: string,
  nyushukoBashoId: number
) => {
  const ids = juchuKizaiHeadIds.split(',').map(Number);
  try {
    return await supabase
      .schema(SCHEMA)
      .from('v_juchu_kizai_head_lst')
      .select('juchu_honbanbi_calc_qty, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat')
      .eq('juchu_head_id', juchuHeadId)
      .in('juchu_kizai_head_id', ids);
  } catch (e) {
    throw e;
  }
};

/**
 * 検索条件に一致する機材明細一覧を取得する関数
 * @param param0 検索条件
 * @returns v_juchu_kizai_head_lst型のobject
 */
export const selectFilteredKizaiHead = async ({
  selectedDate,
  radio,
  juchuId,
  headNam,
  kokyaku,
  koenNam,
  koenbashoNam,
  listSort,
}: EqptOrderSearchValues) => {
  // 基本のセレクト
  const builder = supabase
    .schema(SCHEMA)
    .from('v_juchu_kizai_head_lst')
    .select(
      `juchu_head_id, juchu_kizai_head_id, juchu_kizai_head_kbn, kokyaku_nam, koen_nam, koenbasho_nam, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, oya_juchu_kizai_head_id`
    );

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
        builder.or(
          // yardが先月の範囲
          `and(yard_${dateColumn}.gte.${startOfLastMonth},yard_${dateColumn}.lt.${startOfThisMonth}),` +
            // kicsが先月の範囲
            `and(kics_${dateColumn}.gte.${startOfLastMonth},kics_${dateColumn}.lt.${startOfThisMonth})`
        );
        break;
      }
      case '2': {
        // '今月全て'
        const startOfThisMonth = dayjs().tz('Asia/Tokyo').startOf('month').toISOString();
        const startOfNextMonth = dayjs().tz('Asia/Tokyo').add(1, 'month').startOf('month').toISOString();
        builder.or(
          // yardが今月の範囲
          `and(yard_${dateColumn}.gte.${startOfThisMonth},yard_${dateColumn}.lt.${startOfNextMonth}),` +
            // kicsが今月の範囲
            `and(kics_${dateColumn}.gte.${startOfThisMonth},kics_${dateColumn}.lt.${startOfNextMonth})`
        );
        break;
      }
      case '3': {
        // '昨日'
        const startOfYesterday = dayjs().tz('Asia/Tokyo').subtract(1, 'day').startOf('day').toISOString();
        const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
        builder.or(
          // yardが昨日の範囲内
          `and(yard_${dateColumn}.gte.${startOfYesterday},yard_${dateColumn}.lt.${startOfToday}),` +
            // kicsが昨日の範囲内
            `and(kics_${dateColumn}.gte.${startOfYesterday},kics_${dateColumn}.lt.${startOfToday})`
        );
        break;
      }
      case '4': {
        // '今日'
        const startOfToday = dayjs().tz('Asia/Tokyo').startOf('day').toISOString();
        const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
        builder.or(
          // yardが今日の範囲内
          `and(yard_${dateColumn}.gte.${startOfToday},yard_${dateColumn}.lt.${startOfTomorrow}),` +
            // kicsが今日の範囲内
            `and(kics_${dateColumn}.gte.${startOfToday},kics_${dateColumn}.lt.${startOfTomorrow})`
        );
        break;
      }
      case '5': {
        // '明日'
        const startOfTomorrow = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
        const startOfDayAfterTomorrow = dayjs().tz('Asia/Tokyo').add(2, 'day').startOf('day').toISOString();
        builder.or(
          // yardが明日の範囲内
          `and(yard_${dateColumn}.gte.${startOfTomorrow},yard_${dateColumn}.lt.${startOfDayAfterTomorrow}),` +
            // kicsが明日の範囲内
            `and(kics_${dateColumn}.gte.${startOfTomorrow},kics_${dateColumn}.lt.${startOfDayAfterTomorrow})`
        );
        break;
      }
      case '6': {
        // '明日以降'
        const tomorrowAndAfter = dayjs().tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
        builder.or(`yard_${dateColumn}.gte.${tomorrowAndAfter},kics_${dateColumn}.gte.${tomorrowAndAfter}`);

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
          builder.or(
            // yardが今日の範囲内
            `and(yard_${dateColumn}.gte.${startOfDay},yard_${dateColumn}.lt.${startOfnextDay}),` +
              // kicsが今日の範囲内
              `and(kics_${dateColumn}.gte.${startOfDay},kics_${dateColumn}.lt.${startOfnextDay})`
          );
        } else if (selectedDate.range?.from) {
          // fromだけの場合
          const startOfDay = dayjs(selectedDate.range.from).tz('Asia/Tokyo').startOf('day').toISOString();
          console.log('start of the day: ', startOfDay);
          builder.or(`yard_${dateColumn}.gte.${startOfDay},kics_${dateColumn}.gte.${startOfDay}`);
        } else if (selectedDate.range?.to) {
          // toだけの場合
          const nextDay = dayjs(selectedDate.range.to).tz('Asia/Tokyo').add(1, 'day').startOf('day').toISOString();
          console.log('start of the next day: ', nextDay);
          builder.or(`yard_${dateColumn}.lt.${nextDay},kics_${dateColumn}.lt.${nextDay}`);
        }
        break;
      }
      default:
        break;
    }
  }

  // 受注番号が入っていたら
  if (juchuId) {
    builder.eq('juchu_head_id', juchuId);
  }
  // 機材明細名が入っていたら
  if (headNam && headNam.trim() !== '') {
    builder.ilike('head_nam', `%${headNam}%`);
  }
  // 顧客が選択されていたら
  if (kokyaku && kokyaku !== FAKE_NEW_ID) {
    builder.eq('kokyaku_id', kokyaku);
  }
  // 公演名が入っていたら
  if (koenNam && koenNam.trim() !== '') {
    builder.ilike('koen_nam', `%${koenNam}%`);
  }
  // 公演場所が入っていたら
  if (koenbashoNam && koenbashoNam.trim() !== '') {
    builder.ilike('koenbasho_nam', `%${koenbashoNam}%`);
  }

  // ソート処理
  const { sort, order } = listSort;
  // ソート項目をMap化
  const sortMap: Record<string, string> = {
    shuko: 'shuko_dat',
    nyuko: 'nyuko_dat',
    juchuId: 'juchu_head_id',
    headNam: 'head_nam',
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
