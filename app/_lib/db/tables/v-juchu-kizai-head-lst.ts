'use server';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { toJapanTimeStampString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
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
        'juchu_head_id, juchu_kizai_head_id, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat, sikomibi, rihabi, genebi, honbanbi, juchu_honbanbi_calc_qty, shokei, nebiki_amt, oya_juchu_kizai_head_id, ht_kbn, juchu_kizai_head_kbn'
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
  range,
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

  // 期間のfromが入ってたら
  if (range?.from) {
    const startOfDay = dayjs(range.to).tz('Asia/Tokyo').startOf('day').toDate();
    console.log('start of the day: ', toJapanTimeStampString(startOfDay));
    switch (radio) {
      case 'shuko': // '出庫日'
        builder.or(
          `yard_shuko_dat.gte.${toJapanTimeStampString(startOfDay)},kics_shuko_dat.gte.${toJapanTimeStampString(startOfDay)}`
        );
        break;
      case 'nyuko': // '入庫日'
        builder.or(
          `yard_nyuko_dat.gte.${toJapanTimeStampString(startOfDay)},kics_nyuko_dat.gte.${toJapanTimeStampString(startOfDay)}`
        );
        break;
    }
  }

  // 期間のtoが入ってたら
  if (range?.to) {
    const endOfDay = dayjs(range.to).tz('Asia/Tokyo').endOf('day').toDate();
    console.log('end of the day: ', toJapanTimeStampString(endOfDay));
    switch (radio) {
      case 'shuko': // '出庫日'
        builder.or(
          `yard_shuko_dat.lte.${toJapanTimeStampString(endOfDay)},kics_shuko_dat.lte.${toJapanTimeStampString(endOfDay)}`
        );
        break;
      case 'nyuko': // '入庫日'
        builder.or(
          `yard_nyuko_dat.lte.${toJapanTimeStampString(endOfDay)},kics_nyuko_dat.lte.${toJapanTimeStampString(endOfDay)}`
        );
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
