'use server';

import { selectFilteredJuchuList } from '@/app/_lib/db/tables/v-juchu-lst';

import { ShukoListSearchValues, ShukoTableValues } from './types';

export const getShukoList = async (queries: ShukoListSearchValues) => {
  try {
    const { data, error } = await selectFilteredJuchuList(queries);

    if (error) {
      console.error(error);
      return [];
    }

    const shukoList: ShukoTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id ?? 0,
      shukoDat: d.shuko_dat ? new Date(d.shuko_dat) : new Date(),
      koenNam: d.koen_nam ?? '',
      kokyakuNam: d.kokyaku_nam ?? '',
    }));

    return shukoList;
  } catch (e) {
    console.error(e);
    return [];
  }
};
