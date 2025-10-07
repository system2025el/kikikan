'use server';

import { selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { toISOString, toISOStringYearMonthDay } from '../../_lib/date-conversion';
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

// /**
//  *
//  * @param queries 検索クエリ(受注ヘッダーid、出庫日時、出庫場所)
//  * @returns
//  */
// export const selectFilteredShukoList = async (queries: ShukoListSearchValues) => {
//   const builder = supabase.schema(SCHEMA).from('v_juchu_lst').select('juchu_head_id, koen_nam, kokyaku_nam, shuko_dat');

//   if (queries.juchuHeadId) {
//     builder.eq('juchu_head_id', queries.juchuHeadId);
//   }
//   if (queries.shukoDat) {
//     builder.eq('shuko_dat', toISOString(queries.shukoDat));
//   }

//   try {
//     return await builder;
//   } catch (e) {
//     throw e;
//   }
// };
