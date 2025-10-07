'use server';

import { selectShukoMeisai } from '@/app/_lib/db/tables/v-nyushuko-den2-lst';

import { ShukoMeisaiTableValues } from './types';

export const getShukoMeisai = async (
  juchuHeadId: number,
  nyushukoBashoId: number,
  nyushukoDat: string,
  sagyoKbnId: number
) => {
  try {
    const { data, error } = await selectShukoMeisai(juchuHeadId, nyushukoBashoId, nyushukoDat, sagyoKbnId);

    if (error) {
      console.error('getShukoMeisai error : ', error);
      return null;
    }

    const shukoMeisaiData: ShukoMeisaiTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadIdv: d.juchu_kizai_head_idv,
      headNamv: d.head_namv,
      kizaiId: d.kizai_id,
      kizaiNam: d.kizai_nam,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      kokyakuNam: d.kokyaku_nam,
      nyushukoBashoId: d.nyushuko_basho_id,
      nyushukoDat: d.nyushuko_dat,
      nyushukoShubetuId: d.nyushuko_shubetu_id,
      planQty: d.plan_qty,
      resultAdjQty: d.result_adj_qty,
      resultQty: d.result_qty,
      sagyoKbnId: d.sagyo_kbn_id,
      diff: (d.plan_qty ?? 0) - (d.result_qty ?? 0) - (d.result_adj_qty ?? 0),
      ctnFlg: d.ctn_flg,
    }));

    return shukoMeisaiData;
  } catch (e) {
    console.error(e);
    return null;
  }
};
