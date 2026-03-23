'use server';

import { selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectPdfJuchuKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectNyukoPdfJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectPdfJuchuHead } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectFilteredNyukoList, selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { getDic } from '../../_lib/funcs';
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
      nyuryokuUser: d.nyuryoku_user,
    }));

    return nyukoList;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
  try {
    const { data: juchuHeadData, error: juchuHeadDataError } = await selectPdfJuchuHead(juchuHeadId);
    if (juchuHeadDataError) {
      throw new Error('[selectPdfJuchuHead] DBエラー:', { cause: juchuHeadDataError });
    }

    const { data: juchuKizaiHeadData, error: juchuKizaiHeadDataError } = await selectPdfJuchuKizaiHead(
      juchuHeadId,
      juchuKizaiHeadIds,
      nyushukoBashoId
    );
    if (juchuKizaiHeadDataError) {
      throw new Error('[selectPdfJuchuKizaiHead] DBエラー:', { cause: juchuKizaiHeadDataError });
    }

    // 関数を実行して結果オブジェクト { header, meisai } を受け取る
    const nyukoResult = await selectNyukoPdfJuchuKizaiMeisai(juchuHeadId, nyushukoDat, nyushukoBashoId);

    // ここで .meisai (meisaiQueryの結果) を kizaiData に入れる
    const kizaiData: NyukoKizai[] = nyukoResult.meisai;

    // オプション機材のインデント文字
    const indentChara = await getDic(1);

    // セット機材のインデックスを特定
    const setKizaiIndices = new Set<number>();
    kizaiData.forEach((item, index) => {
      if (item.kizai_nam.startsWith(indentChara)) {
        setKizaiIndices.add(index);
        if (index > 0) setKizaiIndices.add(index - 1);
      }
    });

    // 合計対象のデータMap
    const summaryMap = new Map<number, NyukoKizai>();

    // 合計対象のうち最初に現れた位置を記録するMap
    const firstMap = new Map<number, number>();

    kizaiData.forEach((item, index) => {
      // セット機材は合計しない
      if (!setKizaiIndices.has(index)) {
        const existing = summaryMap.get(item.kizai_id);
        // 既にあるものは合計
        if (existing) {
          existing.planKizaiQty += item.planKizaiQty;
          existing.plan_yobi_qty += item.plan_yobi_qty;
          existing.plan_qty += item.plan_qty;
          // 最初のものはMapに追加して位置を記録
        } else {
          summaryMap.set(item.kizai_id, { ...item });
          firstMap.set(item.kizai_id, index);
        }
      }
    });

    // セット機材データと合計データ
    const mergeKizaiData: { index: number; data: NyukoKizai }[] = [];

    // セット機材データを追加
    setKizaiIndices.forEach((i) => {
      if (kizaiData[i]) {
        mergeKizaiData.push({ index: i, data: { ...kizaiData[i] } });
      }
    });

    // 合体データを追加（最初に現れたインデックスを使用）
    summaryMap.forEach((item, kizaiId) => {
      const originalIndex = firstMap.get(kizaiId)!;
      mergeKizaiData.push({ index: originalIndex, data: item });
    });

    // 元のインデックス順に並べる
    const sortKizaiData = mergeKizaiData.sort((a, b) => a.index - b.index).map((item) => item.data);

    const sqlHeader = nyukoResult.header;

    const honbanbiCalcQty =
      sqlHeader?.juchu_honbanbi_calc_qty ??
      juchuKizaiHeadData.reduce((max, current) => {
        return (current.juchu_honbanbi_calc_qty ?? 0) > (max.juchu_honbanbi_calc_qty ?? 0) ? current : max;
      }, juchuKizaiHeadData[0] || {}).juchu_honbanbi_calc_qty;

    const shukoDat =
      nyushukoBashoId === 1
        ? juchuKizaiHeadData.reduce((min, current) => {
            return new Date(current.kics_shuko_dat ?? '') < new Date(min.kics_shuko_dat ?? '') ? current : min;
          }, juchuKizaiHeadData[0] || {}).kics_shuko_dat
        : juchuKizaiHeadData.reduce((min, current) => {
            return new Date(current.yard_shuko_dat ?? '') < new Date(min.yard_shuko_dat ?? '') ? current : min;
          }, juchuKizaiHeadData[0] || {}).yard_shuko_dat;

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
      item12: sortKizaiData,
      item13: '',
    };

    return pdjData;
  } catch (e) {
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};
