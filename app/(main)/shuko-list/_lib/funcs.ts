'use server';

import { selectPdfJuchuKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectPdfJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectPdfJuchuHead } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { toJapanDateString } from '../../_lib/date-conversion';
import { PdfModel } from '../shuko/_lib/hooks/usePdf';
import { ShukoKizai, ShukoListSearchValues, ShukoTableValues } from './types';

/**
 * 出庫一覧取得
 * @param queries 検索データ(受注番号、出庫日、出庫場所)
 * @returns
 */
export const getShukoList = async (queries: ShukoListSearchValues) => {
  try {
    const data = await selectFilteredShukoList(queries);

    if (!data) {
      return [];
    }

    const shukoList: ShukoTableValues[] = data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      koenNam: d.koen_nam,
      koenbashoNam: d.koenbasho_nam,
      nyushukoDat: d.nyushuko_dat,
      nyushukoBashoId: d.nyushuko_basho_id,
      juchuKizaiHeadIdv: d.juchu_kizai_head_idv,
      headNamv: d.head_namv,
      sectionNamv: d.section_namv,
      kokyakuNam: d.kokyaku_nam,
      sstbSagyoStsId: d.sstb_sagyo_sts_id,
      sstbSagyoStsNamShort: d.sstb_sagyo_sts_nam_short,
      schkSagyoStsId: d.schk_sagyo_sts_id,
      schkSagyoStsNamShort: d.schk_sagyo_sts_nam_short,
      shukoFixFlg: d.shuko_fix_flg === 1 ? true : false,
    }));

    return shukoList;
  } catch (e) {
    console.error(e);
    return [];
  }
};

/**
 * 納品書PDF用データ取得
 * @param juchuHeadId 受注ヘッダーid
 * @param juchuKizaiHeadIds 受注機材ヘッダーid
 * @param nyushukoBashoId 入出庫場所id
 * @param nyushukoDat 入出庫日時
 */
export const getPdfData = async (
  juchuHeadId: number,
  juchuKizaiHeadIds: string,
  nyushukoBashoId: number,
  nyushukoDat: string
) => {
  try {
    const { data: juchuHeadData, error: juchuHeadDataError } = await selectPdfJuchuHead(juchuHeadId);
    if (juchuHeadDataError) {
      console.error('getPdfData selectPdfJuchuHead error : ', juchuHeadDataError);
      throw new Error(juchuHeadDataError.message);
    }
    console.log('juchuHeadData', juchuHeadData);

    const { data: juchuKizaiHeadData, error: juchuKizaiHeadDataError } = await selectPdfJuchuKizaiHead(
      juchuHeadId,
      juchuKizaiHeadIds,
      nyushukoBashoId
    );
    if (juchuKizaiHeadDataError) {
      console.error('getPdfData selectPdfJuchuKizaiHead error : ', juchuKizaiHeadDataError);
      throw new Error(juchuKizaiHeadDataError.message);
    }
    console.log('juchuKizaiHeadData', juchuKizaiHeadData);

    const honbanbiCalcQty = juchuKizaiHeadData.reduce((max, current) => {
      return current.juchu_honbanbi_calc_qty > max.juchu_honbanbi_calc_qty ? current : max;
    }).juchu_honbanbi_calc_qty;
    console.log('honbanbiCalcQty', honbanbiCalcQty);

    const nyukoDat =
      nyushukoBashoId === 1
        ? juchuKizaiHeadData.reduce((min, current) => {
            return new Date(current.kics_nyuko_dat) < new Date(min.kics_nyuko_dat) ? current : min;
          }).kics_nyuko_dat
        : juchuKizaiHeadData.reduce((min, current) => {
            return new Date(current.yard_nyuko_dat) < new Date(min.yard_nyuko_dat) ? current : min;
          }).yard_nyuko_dat;
    console.log('nyukoDat', nyukoDat);

    const kizaiData: ShukoKizai[] = (await selectPdfJuchuKizaiMeisai(juchuHeadId, juchuKizaiHeadIds, nyushukoBashoId))
      .rows;
    console.log('kizaiData', kizaiData);

    const pdjData: PdfModel = {
      item1: juchuHeadData.juchu_head_id,
      item2: toJapanDateString(),
      item3: juchuHeadData.koen_nam,
      item4: juchuHeadData.kokyaku_nam,
      item5: toJapanDateString(nyushukoDat),
      item6: toJapanDateString(nyukoDat),
      item7: juchuHeadData.koenbasho_nam,
      item8: honbanbiCalcQty,
      item9: juchuHeadData.nyuryoku_user,
      item10: '',
      item11: juchuHeadData.kokyaku_tanto_nam,
      item12: kizaiData,
    };

    return pdjData;
  } catch (e) {
    console.error(e);
    return null;
  }
};
