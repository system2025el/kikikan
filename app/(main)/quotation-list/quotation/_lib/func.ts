'use server';

import { selectJuchu } from '@/app/_lib/db/tables/v-juchu-lst';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';

import { JuchuValues } from './types';

/**
 * 受注ヘッダIDが等しい受注ヘッダを取得する
 * @param id 受注ヘッダID
 * @returns 見積画面で表示される受注ヘッダ
 */
export const getOrderForQuotation = async (id: number) => {
  try {
    const { data: juchuData, error } = await selectJuchu(id);

    if (error || !juchuData) {
      console.error('GetOrder juchu error : ', error);
      throw new Error('受注ヘッダーが存在しません');
    }
    const order: JuchuValues = {
      juchuHeadId: juchuData.juchu_head_id,
      juchuSts: juchuData.juchu_sts_nam,
      juchuDat: juchuData.juchu_dat ? new Date(juchuData.juchu_dat) : null,
      juchuRange:
        juchuData.juchu_str_dat && juchuData.juchu_end_dat
          ? { strt: new Date(juchuData.juchu_str_dat), end: new Date(juchuData.juchu_end_dat) }
          : { strt: null, end: null },
      nyuryokuUser: juchuData.nyuryoku_user,
      koenNam: juchuData.koen_nam,
      koenbashoNam: juchuData.koenbasho_nam,
      kokyaku: juchuData.kokyaku_nam,
      kokyakuTantoNam: juchuData.kokyaku_tanto_nam,
      mem: juchuData.mem,
      nebikiAmt: juchuData.nebiki_amt,
      zeiKbn: juchuData.zei_nam,
    };
    console.log('GetOrder order : ', order);
    return order;
  } catch (e) {
    console.log(e);
  }
};
