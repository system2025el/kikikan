'use server';

import { ShukoListSearchValues, ShukoTableValues } from './types';

export const getShukoList = async (queries: ShukoListSearchValues) => {
  // try {
  //   const { data, error } = await selectFilteredShukoList(queries);

  //   if (error) {
  //     console.error(error);
  //     return [];
  //   }

  //   const shukoList: ShukoTableValues[] = data.map((d) => ({
  //     juchuHeadId: d.juchu_head_id ?? 0,
  //     juchuKizaiHeadId: d.juchu_kizai_head_id ?? 0,
  //     shukoDat: d.shuko_dat ? new Date(d.shuko_dat) : new Date(),
  //     koenNam: d.koen_nam ?? '',
  //     kokyakuNam: d.kokyaku_nam ?? '',
  //   }));

  //   return shukoList;
  // } catch (e) {
  //   console.error(e);
  //   return [];
  // }
  return [];
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
