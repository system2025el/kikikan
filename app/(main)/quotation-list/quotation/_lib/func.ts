'use server';

import { selectJuchu } from '@/app/_lib/db/tables/v-juchu-lst';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';

import { JuchuValues } from '../_ui/quotation';

export const getOrderForQuotation = async (id: number) => {
  try {
    const juchuData = await selectJuchu(id);

    if (juchuData.error || !juchuData.data) {
      console.error('GetOrder juchu error : ', juchuData.error);
      throw new Error('受注ヘッダーが存在しません');
    }
    const order: JuchuValues = {
      juchuHeadId: juchuData.data.juchu_head_id,
      juchuSts: juchuData.data.juchu_sts_nam,
      juchuDat: juchuData.data.juchu_dat ? new Date(juchuData.data.juchu_dat) : null,
      juchuRange:
        juchuData.data.juchu_str_dat && juchuData.data.juchu_end_dat
          ? { strt: new Date(juchuData.data.juchu_str_dat), end: new Date(juchuData.data.juchu_end_dat) }
          : { strt: null, end: null },
      nyuryokuUser: juchuData.data.nyuryoku_user,
      koenNam: juchuData.data.koen_nam,
      koenbashoNam: juchuData.data.koenbasho_nam,
      kokyaku: juchuData.data.kokyaku_nam,
      kokyakuTantoNam: juchuData.data.kokyaku_nam,
      mem: juchuData.data.mem,
      nebikiAmt: juchuData.data.nebiki_amt,
    };
    console.log('GetOrder order : ', order);
    return order;
  } catch (e) {
    console.log(e);
  }
};
