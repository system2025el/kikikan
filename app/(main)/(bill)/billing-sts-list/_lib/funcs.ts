'use server';

import { revalidatePath } from 'next/cache';

import { upsertSeikyuDat } from '@/app/_lib/db/tables/t-seikyu-date-juchu-kizai';
import { selectFilteredBillingSituations } from '@/app/_lib/db/tables/v-seikyu-date-lst';
import { toJapanTimeStampString, toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';

import { BillingStsSearchValues, BillingStsTableValues } from './types';

/**
 * 受注請求状況一覧テーブルに表示する配列を取得・成形
 * @param queries 検索条件
 * @returns 受注請求状況一覧テーブルに表示する配列
 */
export const getFilteredBillingSituations = async (
  queries: BillingStsSearchValues
): Promise<BillingStsTableValues[]> => {
  if (!queries.sts.includes('1') && !queries.sts.includes('2')) {
    return []; // 空配列を返す
  }
  try {
    const { data, error } = await selectFilteredBillingSituations(queries);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log(data);

    const heads = data.map((d) => ({
      juchuId: d.juchu_head_id,
      kziHeadId: d.juchu_kizai_head_id,
      headNam: d.head_nam,
      shukoDat: d.shuko_dat,
      nyukoDat: d.nyuko_dat,
      seikyuDat: d.seikyu_dat ?? null,
    }));
    const uniqueData = Array.from(new Map(data.map((d) => [JSON.stringify(d.juchu_head_id), d])).values());
    return uniqueData.map((d, index) => ({
      juchuId: d.juchu_head_id,
      kokyakuNam: d.kokyaku_nam,
      kokyakuTantoNam: d.kokyaku_tanto_nam,
      koenNam: d.koen_nam,
      sts: d.seikyu_jokyo_total_sts_nam,
      ordNum: index + 1,
      heads: heads.filter((h) => d.juchu_head_id === h.juchuId).map((h, i) => ({ ...h, ordNum: i + 1 })),
    }));
  } catch (e) {
    throw e;
  }
};

/**
 * 請求状況一覧で請求済み期間を変更する関数
 * @param param0
 * @param user ログインユーザー
 */
export const changeSeikyuDat = async (
  {
    juchuId,
    kziHeadId,
    newDat,
  }: {
    juchuId: number;
    kziHeadId: number;
    newDat: Date;
  },
  user: string
) => {
  const upsertData = {
    juchu_head_id: juchuId,
    juchu_kizai_head_id: kziHeadId,
    seikyu_dat: toJapanYMDString(newDat, '-'),
    add_dat: toJapanTimeStampString(),
    add_user: user,
  };
  try {
    await upsertSeikyuDat(upsertData);
    await revalidatePath('/billing-sts-list');
  } catch (e) {
    console.error(e);
    throw e;
  }
};
