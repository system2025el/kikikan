'use server';

import { selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { ShukoListSearchValues, ShukoTableValues } from './types';

export const getShukoList = async (queries: ShukoListSearchValues) => {
  try {
    const data = await selectFilteredShukoList(queries);

    if (!data) {
      return [];
    }

    const shukoList: ShukoTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      koenNam: d.koen_nam,
      nyushukoDat: d.nyushuko_dat,
      nyushukoBashoId: d.nyushuko_basho_id,
      juchuKizaiHeadIdv: d.juchu_kizai_head_idv,
      headNamv: d.head_namv,
      sectionNamv: d.section_namv,
      kokyakuNam: d.kokyaku_nam,
      sstbSagyoStsId: d.sstb_sagyo_sts_id,
      schkSagyoStsId: d.schk_sagyo_sts_id,
    }));

    return shukoList;
  } catch (e) {
    console.error(e);
    return [];
  }
};
