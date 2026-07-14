'use server';

import { selectOneCustomer } from '@/app/_lib/db/tables/m-kokyaku';
import { selectNyukoPdfJuchuKizaiMeisai } from '@/app/_lib/db/tables/nyushuko-pdf';
import { selectSagyoIdFilterNyushukoFixFlag } from '@/app/_lib/db/tables/t-nyushuko-fix';
import { selectPdfJuchuKizaiHead } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectPdfJuchuHead } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectFilteredNyukoList, selectFilteredShukoList } from '@/app/_lib/db/tables/v-nyushuko-den2';

import { toJapanYMDString } from '../../_lib/date-conversion';
import { getDic } from '../../_lib/funcs';
import { NyukoPdfModel } from '../nyuko/_lib/hooks/usePdf';
import { EqptGroup, NyukoKizai, NyukoListSearchValues, NyukoTableValues } from './types';

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
      nchkPlanQty: d.nchk_plan_qty ?? 0,
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
 * PDF出力の際に、顧客の敬称を取得する関数
 * @param kokyakuId 顧客id
 * @returns
 */
export const getKeisho = async (kokyakuId: number) => {
  try {
    const { data, error } = await selectOneCustomer(kokyakuId);
    if (error) {
      throw new Error('[selectOneCustomer] DBエラー:', { cause: error });
    }
    return data.keisho ?? '';
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
 * 員数票PDF用データ取得
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

    if (!juchuHeadData.kokyaku_id) {
      throw new Error('[getPdfData] 顧客IDが見つかりません');
    }

    const keisho = await getKeisho(juchuHeadData.kokyaku_id);

    const { data: juchuKizaiHeadData, error: juchuKizaiHeadDataError } = await selectPdfJuchuKizaiHead(
      juchuHeadId,
      juchuKizaiHeadIds,
      nyushukoBashoId
    );
    if (juchuKizaiHeadDataError) {
      throw new Error('[selectPdfJuchuKizaiHead] DBエラー:', { cause: juchuKizaiHeadDataError });
    }

    // 関数を実行して結果オブジェクト { header, meisai } を受け取る
    const nyukoResult = await selectNyukoPdfJuchuKizaiMeisai(
      juchuHeadId,
      juchuKizaiHeadIds,
      nyushukoDat,
      nyushukoBashoId
    );

    // ここで .meisai (meisaiQueryの結果) を kizaiData に入れる
    const kizaiData: NyukoKizai[] = nyukoResult.meisai;

    // const updatedKizaiData = kizaiData.map((item) => {
    //   if (item.juchu_kizai_head_kbn === 2) {
    //     return {
    //       ...item,
    //       plan_qty: item.plan_qty * -1,
    //     };
    //   }
    //   return item;
    // });

    const updatedKizaiData = kizaiData;

    // オプション機材のインデント文字
    const indentChara = await getDic(1);

    // セット機材のグループ化
    const groups: EqptGroup[] = [];
    let currentGroup: EqptGroup | null = null;

    for (const item of updatedKizaiData) {
      if (!item.kizai_nam.startsWith(indentChara)) {
        // 親機材の場合：新しいグループを作成
        currentGroup = { parent: item, children: [] };
        groups.push(currentGroup);
      } else {
        // オプション機材の場合：直近の親グループに追加
        if (currentGroup) {
          currentGroup.children.push(item);
        } else {
          // 万が一、最初の要素がオプションだった場合のセーフティ
          groups.push({ parent: item, children: [] });
        }
      }
    }

    // セット機材以外を機材IDごとに合算
    const finalGroups: EqptGroup[] = [];
    const summaryMap = new Map<number, EqptGroup>();

    for (const group of groups) {
      // childrenがある場合はセット機材なので合算しない
      if (group.children.length > 0) {
        finalGroups.push(group);
      } else {
        // childrenがない場合は単独機材なのでkizai_idごとに合算
        const kizaiId = group.parent.kizai_id;
        const existing = summaryMap.get(kizaiId);

        if (existing) {
          // すでにMapにある場合は、数量を足し算してメモを結合
          existing.parent.plan_qty += group.parent.plan_qty;
          existing.parent.mem2 =
            existing.parent.mem2 && group.parent.mem2
              ? `${existing.parent.mem2},${group.parent.mem2}`
              : !existing.parent.mem2 && group.parent.mem2
                ? group.parent.mem2
                : existing.parent.mem2 && !group.parent.mem2
                  ? existing.parent.mem2
                  : '';
        } else {
          // 新しく現れた機材は、元のデータを汚さないようコピーしてMapと配列に追加
          const clonedGroup = {
            parent: { ...group.parent },
            children: [],
          };
          summaryMap.set(kizaiId, clonedGroup);
          finalGroups.push(clonedGroup); // finalGroupsに参照を入れておく
        }
      }
    }

    finalGroups.sort((a, b) => {
      if (a.parent.kizai_grp_cod < b.parent.kizai_grp_cod) return -1;
      if (a.parent.kizai_grp_cod > b.parent.kizai_grp_cod) return 1;

      return a.parent.dsp_ord_num - b.parent.dsp_ord_num;
    });

    // グループをバラして一つの平坦な配列に戻す
    const sortKizaiData = finalGroups.flatMap((group) => [group.parent, ...group.children]);

    const sqlHeader = nyukoResult.header;

    const honbanbiCalcQty =
      sqlHeader.juchu_kizai_head_kbn !== 1
        ? null
        : /*(sqlHeader?.juchu_honbanbi_calc_qty ??*/
          juchuKizaiHeadData.reduce((max, current) => {
            return (current.juchu_honbanbi_calc_qty ?? 0) > (max.juchu_honbanbi_calc_qty ?? 0) ? current : max;
          }, juchuKizaiHeadData[0] || {}).juchu_honbanbi_calc_qty; /*)*/

    const shukoDatCandidates = juchuKizaiHeadData
      .flatMap((d) => [d.kics_shuko_dat, d.yard_shuko_dat])
      .filter((d): d is string => d !== null);

    const shukoDat =
      shukoDatCandidates.length > 0
        ? shukoDatCandidates.reduce((min, current) => (new Date(current) < new Date(min) ? current : min))
        : null;

    // ---------------------------------------------------------
    // PDFデータの生成
    // ---------------------------------------------------------
    const pdjData: NyukoPdfModel = {
      item1: juchuHeadData.juchu_head_id,
      item2: toJapanYMDString(),
      item3: juchuHeadData.koen_nam ?? '',
      item4: juchuHeadData.kokyaku_nam ? `${juchuHeadData.kokyaku_nam} ${keisho}` : '',
      item5: shukoDat ? toJapanYMDString(shukoDat) : '',
      item6: toJapanYMDString(nyushukoDat),
      item7: juchuHeadData.koenbasho_nam ?? '',
      item8: honbanbiCalcQty,
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
