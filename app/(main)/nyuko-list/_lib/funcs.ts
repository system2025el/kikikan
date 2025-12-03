'use server';

import { selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
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
      koenbashoNam: d.koenbasho_nam,
      nyushukoDat: d.nyushuko_dat,
      nyushukoBashoId: d.nyushuko_basho_id,
      juchuKizaiHeadIdv: d.juchu_kizai_head_idv,
      juchuKizaiHeadKbn: Number(d.juchu_kizai_head_kbnv),
      headNamv: d.head_namv,
      sectionNamv: d.section_namv,
      kokyakuNam: d.kokyaku_nam,
      nchkSagyoStsId: d.nchk_sagyo_sts_id,
      nchkSagyoStsNamShort: d.nchk_sagyo_sts_nam_short,
      nyukoFixFlg: d.nyuko_fix_flg === 1 ? true : false,
    }));

    return nyukoList;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 入庫作業確定フラグ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadId 受注機材ヘッダーid
 * @param sagyoKbnId 作業区分id
 * @param sagyoDenDat 作業日時
 * @param sagyoId 作業id
 * @returns
 */
export const getNyukoFixFlag = async (
  juchuHeadId: number,
  juchuKizaiHeadId: number,
  sagyoKbnId: number,
  sagyoDenDat: string,
  sagyoId: number
) => {
  try {
    const { data, error } = await selectSagyoIdFilterNyushukoFixFlag(
      juchuHeadId,
      juchuKizaiHeadId,
      sagyoKbnId,
      sagyoDenDat,
      sagyoId
    );

    if (error) {
      if (error.code === 'PGRST116') {
        return false;
      }
      throw error;
    }

    return data.sagyo_fix_flg === 0 ? false : true;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
