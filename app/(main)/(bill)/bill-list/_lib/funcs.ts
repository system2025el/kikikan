'use server';

import { selectActiveSeikyuSts } from '@/app/_lib/db/tables/m-seikyu-sts';
import { selectChosenSeikyu } from '@/app/_lib/db/tables/t-seikyu-head';
import { selectBillMeisai } from '@/app/_lib/db/tables/t-seikyu-meisai';
import { selectBillMeisaiHead } from '@/app/_lib/db/tables/t-seikyu-meisai-head';
import { selectFilteredBills } from '@/app/_lib/db/tables/v-seikyu-lst';
import { SeikyuMeisaiHead } from '@/app/_lib/db/types/t-seikyu-meisai-head-type';
import { SeikyuMeisai } from '@/app/_lib/db/types/t-seikyu-meisai-type';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { BillHeadValues, BillMeisaiHeadsValues, BillSearchValues, BillsListTableValues } from './types';

/**
 * 選択肢用請求ステータスを取得する関数
 * @returns 選択肢用の請求ステータスの配列
 */
export const getBillingStsSelection = async (): Promise<SelectTypes[]> => {
  try {
    const { data, error } = await selectActiveSeikyuSts();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({ id: d.sts_id, label: d.sts_nam }));
  } catch (e) {
    throw e;
  }
};

/**
 * 請求一覧に表示するリストを取得・成形する関数
 * @param queries 検索条件
 * @returns
 */
export const getFilteredBills = async (
  queries: BillSearchValues = {
    billId: undefined,
    billingSts: undefined,
    range: {
      str: undefined,
      end: undefined,
    },
    kokyaku: undefined,
    kokyakuTantoNam: undefined,
  }
): Promise<BillsListTableValues[]> => {
  try {
    const { data, error } = await selectFilteredBills(queries);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({
      billHeadId: d.seikyu_head_id,
      billingSts: d.sts_nam,
      billHeadNam: d.seikyu_head_nam,
      kokyaku: d.kokyaku_nam,
      seikyuDat: d.seikyu_dat,
    }));
  } catch (e) {
    console.error('例外が発生', e);
    throw e;
  }
};

/**
 * 選択された見積IDの見積書情報を取得する関数
 * @param seikyuId 選択された見積ヘッドID
 */
export const getChosenBill = async (seikyuId: number) => {
  // 明細のデータ変換をする
  const transformMeisaiHead = (head: SeikyuMeisaiHead, meisais: SeikyuMeisai[]) => ({
    juchuHeadId: head.juchu_head_id,
    juchuKizaiHeadId: head.juchu_kizai_head_id,
    seikyuMeisaiHeadId: head.seikyu_meisai_head_id,
    // seikyuMeisaiHeadNam: head.seikyu_meisai_head_nam,
    seikyuRange: {
      strt: head.seikyu_str_dat ? new Date(head.seikyu_str_dat) : null,
      end: head.seikyu_end_dat ? new Date(head.seikyu_end_dat) : null,
    },
    koenNam: head.koen_nam,
    koenBashoNam: head.koenbasho_nam,
    kokyakuTantoNam: head.kokyaku_tanto_nam,
    nebikiAmt: head.nebiki_amt,
    zeiFlg: Boolean(head.zei_flg),
    meisai: meisais.map((m) => ({
      id: m.seikyu_meisai_id,
      nam: m.seikyu_meisai_nam,
      qty: m.meisai_qty,
      honbanbiQty: m.meisai_honbanbi_qty,
      tankaAmt: m.meisai_tanka_amt,
    })),
  });
  try {
    // 見積ヘッドの取得
    const { data: seikyuData, error: seikyuError } = await selectChosenSeikyu(seikyuId);
    if (seikyuError) {
      console.error(seikyuError);
      throw new Error('DBエラー：t_seikyu_head');
    }
    console.log(seikyuData);

    // 受注情報と明細情報を並列を取得
    const [meisaiHeadResult, meisaiResult] = await Promise.all([
      selectBillMeisaiHead(seikyuData.seikyu_head_id),
      selectBillMeisai(seikyuData.seikyu_head_id),
    ]);

    const { data: meisaiHeads, error: meisaiHeadError } = meisaiHeadResult;
    const { data: meisais, error: meisaiError } = meisaiResult;
    if (meisaiHeadError || meisaiError) {
      console.error(meisaiHeadError?.message, meisaiError?.message);
      throw new Error('DBエラー：明細取得時');
    }
    // 明細をヘッダIDごとにグループ化
    const meisaisByHeadId = meisais.reduce((acc: Record<number, SeikyuMeisai[]>, current: SeikyuMeisai) => {
      const headId = current.seikyu_meisai_head_id;
      if (!acc[headId]) {
        acc[headId] = [];
      }
      acc[headId].push(current);
      return acc;
    }, {});

    const meisaisList = meisaiHeads.map((d) => {
      const associatedMeisais = meisaisByHeadId[d.seikyu_meisai_head_id] || [];
      return transformMeisaiHead(d, associatedMeisais);
    });

    // const meisaisList = meisaiHeads.reduce((acc, head) => {
    //   const associatedMeisais = meisaisByHeadId[head.seikyu_meisai_head_id] || [];
    //   const transformedHead = transformMeisaiHead(head, associatedMeisais);

    //   switch (head.seikyu_meisai_head_kbn) {
    //     case 0: // kizai
    //       acc.kizai.push(transformedHead);
    //       break;
    //     case 1: // labor
    //       acc.labor.push(transformedHead);
    //       break;
    //     case 2: // other
    //       acc.other.push(transformedHead);
    //       break;
    //   }
    //   return acc;
    // }, initialKbnMeisais);

    // 見積の全情報
    const allData: BillHeadValues = {
      seikyuHeadId: seikyuData.seikyu_head_id,
      seikyuSts: seikyuData.seikyu_sts,
      seikyuDat: seikyuData.seikyu_dat ? new Date(seikyuData.seikyu_dat) : null,
      // seikyuHeadNam: seikyuData.seikyu_head_nam,
      kokyaku: seikyuData.kokyaku_nam,
      nyuryokuUser: seikyuData.nyuryoku_user,
      aite: { id: seikyuData.kokyaku_id, nam: seikyuData.kokyaku_nam },
      adr1: seikyuData.adr_post,
      adr2: { shozai: seikyuData.adr_shozai, tatemono: seikyuData.adr_tatemono, sonota: seikyuData.adr_sonota },
      // seikyuRange:
      //   seikyuData.seikyu_str_dat && seikyuData.seikyu_end_dat
      //     ? { strt: new Date(seikyuData.seikyu_str_dat), end: new Date(seikyuData.seikyu_end_dat) }
      //     : { strt: null, end: null },
      // kokyakuTantoNam: seikyuData.kokyaku_tanto_nam,
      // koenNam: seikyuData.koen_nam,
      // koenbashoNam: seikyuData.koenbasho_nam,
      // seikyuHonbanbiQty: seikyuData.seikyu_honbanbi_qty,
      zeiRat: seikyuData.zei_rat,
      meisaiHeads: meisaisList, // 整形済みのデータを代入
    };
    return allData;
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};
