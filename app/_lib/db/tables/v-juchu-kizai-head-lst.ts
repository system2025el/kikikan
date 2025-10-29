'use server';

import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { EqptOrderSearchValues } from '@/app/(main)/eqpt-order-list/_lib/types';

import { SCHEMA, supabase } from '../supabase';

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
}: EqptOrderSearchValues) => {
  // 基本のセレクト
  const builder = supabase
    .schema(SCHEMA)
    .from('v_juchu_kizai_head_lst')
    .select(
      `juchu_head_id, kokyaku_nam, koen_nam, koenbasho_nam, head_nam, kics_shuko_dat, kics_nyuko_dat, yard_shuko_dat, yard_nyuko_dat`
    );

  // 期間のfromが入ってたら
  if (range?.from) {
    switch (radio) {
      case 'shuko': // '出庫日'
        builder.or(
          `yard_shuko_dat.gte.${toJapanDateString(range.from)},kics_shuko_dat.gte.${toJapanDateString(range.from)}`
        );
        break;
      case 'nyuko': // '入庫日'
        builder.or(
          `yard_nyuko_dat.gte.${toJapanDateString(range.from)},kics_nyuko_dat.gte.${toJapanDateString(range.from)}`
        );
        break;
    }
  }

  // 期間のtoが入ってたら
  if (range?.to) {
    switch (radio) {
      case 'shuko': // '出庫日'
        builder.or(
          `yard_shuko_dat.lte.${toJapanDateString(range.to)},kics_shuko_dat.lte.${toJapanDateString(range.to)}`
        );
        break;
      case 'nyuko': // '入庫日'
        builder.or(
          `yard_nyuko_dat.lte.${toJapanDateString(range.to)},kics_nyuko_dat.lte.${toJapanDateString(range.to)}`
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
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
