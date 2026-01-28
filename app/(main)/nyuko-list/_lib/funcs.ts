'use server';

import { selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectPdfJuchuKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectNyukoPdfJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectPdfJuchuHead } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectFilteredNyukoList, selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { PdfModel } from '../nyuko/_lib/hooks/usePdf';
import { NyukoKizai, NyukoListSearchValues, NyukoTableValues } from './types';

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
    throw e;
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
  console.log('---押下時渡されたデータ---');
  console.log('juchuHeadId', juchuHeadId);
  console.log('juchuKizaiHeadIds', juchuKizaiHeadIds);
  console.log('nyushukoBashoId', nyushukoBashoId);
  console.log('nyushukoDat', nyushukoDat);

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

    // 関数を実行して結果オブジェクト { header, meisai } を受け取る
    const nyukoResult = await selectNyukoPdfJuchuKizaiMeisai(juchuHeadId, nyushukoDat, nyushukoBashoId);

    // ここで .meisai (meisaiQueryの結果) を kizaiData に入れる
    const kizaiData: NyukoKizai[] = nyukoResult.meisai;
    console.log('kizaiData', kizaiData);

    const sqlHeader = nyukoResult.header;
    console.log('sqlHeader', sqlHeader);

    const honbanbiCalcQty =
      sqlHeader?.juchu_honbanbi_calc_qty ??
      juchuKizaiHeadData.reduce((max, current) => {
        return (current.juchu_honbanbi_calc_qty ?? 0) > (max.juchu_honbanbi_calc_qty ?? 0) ? current : max;
      }, juchuKizaiHeadData[0] || {}).juchu_honbanbi_calc_qty;

    console.log('honbanbiCalcQty', honbanbiCalcQty);

    const shukoDat =
      nyushukoBashoId === 1
        ? juchuKizaiHeadData.reduce((min, current) => {
            return new Date(current.kics_shuko_dat ?? '') < new Date(min.kics_shuko_dat ?? '') ? current : min;
          }, juchuKizaiHeadData[0] || {}).kics_shuko_dat
        : juchuKizaiHeadData.reduce((min, current) => {
            return new Date(current.yard_shuko_dat ?? '') < new Date(min.yard_shuko_dat ?? '') ? current : min;
          }, juchuKizaiHeadData[0] || {}).yard_shuko_dat;

    console.log('shukoDat', shukoDat);

    // ---------------------------------------------------------
    // PDFデータの生成
    // ---------------------------------------------------------
    const pdjData: PdfModel = {
      item1: juchuHeadData.juchu_head_id,
      item2: toJapanYMDString(),
      item3: juchuHeadData.koen_nam ?? '',
      item4: juchuHeadData.kokyaku_nam ?? '',
      item5: shukoDat ? toJapanYMDString(shukoDat) : '',
      item6: toJapanYMDString(nyushukoDat),
      item7: juchuHeadData.koenbasho_nam ?? '',
      item8: honbanbiCalcQty ?? 0,
      item9: juchuHeadData.nyuryoku_user ?? '',
      item10: '',
      item11: juchuHeadData.kokyaku_tanto_nam ?? '',
      item12: kizaiData,
      item13: '',
    };

    return pdjData;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
