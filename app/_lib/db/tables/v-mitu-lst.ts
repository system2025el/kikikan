'use server';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { escapeLikeString } from '@/app/(main)/_lib/escape-string';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { QuotSearchValues } from '@/app/(main)/quotation-list/_lib/types';

import { SCHEMA, supabase } from '../supabase';

export const selectFilteredQuot = async ({
  mituId,
  juchuId,
  mituSts,
  mituHeadNam,
  kokyaku,
  mituDat,
  nyuryokuUser,
}: QuotSearchValues) => {
  console.log('チェック☆☆☆☆☆☆☆☆☆☆', nyuryokuUser, '  ', kokyaku, '  ', mituHeadNam);
  /* 検索ビルダー */
  const builder = supabase
    .schema(SCHEMA)
    .from('v_mitu_lst')
    .select(
      `mitu_head_id, juchu_head_id, sts_nam, mitu_head_nam, koen_nam, koenbasho_nam, kokyaku_nam, mitu_dat, nyuryoku_user, mitu_str_dat, mitu_end_dat`
    )
    .order('mitu_head_id', { ascending: false });
  // 見積番号あり
  if (mituId) {
    builder.eq('mitu_head_id', mituId);
  }
  // 受注番号あり
  if (juchuId) {
    builder.eq('juchu_head_id', juchuId);
  }
  // 見積ステータスあり
  if (mituSts !== null && mituSts !== FAKE_NEW_ID) {
    builder.eq('mitu_sts', mituSts);
  }
  // 見積件名あり
  if (mituHeadNam && mituHeadNam.trim() !== '') {
    const escapedMituHeadNam = escapeLikeString(mituHeadNam);
    builder.ilike('mitu_head_nam', `%${escapedMituHeadNam}%`);
  }
  // 見積相手あり
  if (kokyaku && kokyaku.trim() !== '') {
    const escapedkokyaku = escapeLikeString(kokyaku);
    builder.ilike('kokyaku_nam', `%${escapedkokyaku}%`);
  }
  // 入力者あり
  if (nyuryokuUser && nyuryokuUser.trim() !== '未選択') {
    builder.eq('nyuryoku_user', nyuryokuUser);
  }
  if (mituDat.strt) {
    builder.gte('mitu_dat', toJapanTimeString(mituDat.strt));
  }
  if (mituDat.end) {
    builder.lte('mitu_dat', toJapanTimeString(mituDat.end));
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};
