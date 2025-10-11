'use server';

import { selectFilteredNyukoList, selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { NyukoListSearchValues, NyukoTableValues } from './types';

/**
 * 入庫一覧取得
 * @param queries 検索データ(受注番号、出庫日、出庫場所)
 * @returns
 */
export const getNyukoList = async (queries: NyukoListSearchValues) => {
  try {
    const data = await selectFilteredNyukoList(queries);
    console.log(data);

    if (!data) {
      return [];
    }

    const nyukoList: NyukoTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      koenNam: d.koen_nam,
      nyushukoDat: d.nyushuko_dat,
      nyushukoBashoId: d.nyushuko_basho_id,
      juchuKizaiHeadIdv: d.juchu_kizai_head_idv,
      headNamv: d.head_namv,
      sectionNamv: d.section_namv,
      kokyakuNam: d.kokyaku_nam,
      nchkSagyoStsId: d.nchk_sagyo_sts_id,
    }));

    return nyukoList;
  } catch (e) {
    console.error(e);
    return [];
  }
};
