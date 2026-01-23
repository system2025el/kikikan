'use server';

import { revalidatePath } from 'next/cache';

import { selectActiveMituSts } from '@/app/_lib/db/tables/m-mitu-sts';
import { selectActiveUsers } from '@/app/_lib/db/tables/m-user';
import { selectChosenMitu, updQuotHeadDelFlg } from '@/app/_lib/db/tables/t-mitu-head';
import { selectQuotMeisai } from '@/app/_lib/db/tables/t-mitu-meisai';
import { selectQuotMeisaiHead } from '@/app/_lib/db/tables/t-mitu-meisai-head';
import { selectJuchuKizaiHeadNamList } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectJuchu } from '@/app/_lib/db/tables/v-juchu-lst';
import { selectKizaiHeadListForMitu } from '@/app/_lib/db/tables/v-mitu-kizai';
import { selectKizaiHeadListWithIsshikiForMitu } from '@/app/_lib/db/tables/v-mitu-kizai-isshiki';
import { selectFilteredQuot } from '@/app/_lib/db/tables/v-mitu-lst';
import { MituMeisaiHead } from '@/app/_lib/db/types/t-mitu-meisai-head-type';
import { MituMeisai } from '@/app/_lib/db/types/t-mitu-meisai-type';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { permission } from '../../_lib/permission';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { JuchuValues, QuotHeadValues, QuotMeisaiHeadValues, QuotSearchValues } from './types';

/**
 * 請求一覧に表示する配列を取得する関数
 * @param queries
 * @returns 請求一覧に表示する配列
 */
export const getFilteredQuotList = async (
  queries: QuotSearchValues = {
    mituId: null,
    juchuId: null,
    mituSts: FAKE_NEW_ID,
    mituHeadNam: null,
    kokyaku: null,
    mituDat: {
      strt: null,
      end: null,
    },
    nyuryokuUser: null,
  }
) => {
  try {
    console.log('デバッグ中▼▼', queries);
    const { data, error } = await selectFilteredQuot(queries);
    if (error) {
      console.error(error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({
      mituHeadId: d.mitu_head_id ?? FAKE_NEW_ID,
      juchuHeadId: d.juchu_head_id ?? FAKE_NEW_ID,
      mituStsNam: d.sts_nam ?? '',
      mituHeadNam: d.mitu_head_nam ?? '',
      koenNam: d.koen_nam ?? '',
      koenbashoNam: d.koenbasho_nam ?? '',
      kokyakuNam: d.kokyaku_nam ?? '',
      mituDat: d.mitu_dat ? toJapanYMDString(d.mitu_dat) : '',
      nyuryokuUser: d.nyuryoku_user ?? '',
    }));
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 担当者の選択肢リスト取得関数
 * @returns 担当者の選択肢リスト
 */
export const getUsersSelection = async () => {
  try {
    const { data, error } = await selectActiveUsers();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型する
    const selectElements: SelectTypes[] = data
      .filter((d) => d.permission & permission.juchu_upd)
      .map((d) => ({
        id: d.user_nam!,
        label: d.user_nam,
      }));
    console.log('担当者が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('担当者取得DBエラー', e);
    throw e;
  }
};

/**
 * 見積ステータス選択肢を取得する関数
 * @returns {SelectTypes[]} 見積ステータスの配列
 */
export const getMituStsSelection = async () => {
  try {
    const { data, error } = await selectActiveMituSts();
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    // 選択肢の型に成型する
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.sts_id!,
      label: d.sts_nam,
    }));
    console.log('mitu_stsが', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 受注ヘッダIDが等しい受注ヘッダを取得する
 * @param id 受注ヘッダID
 * @returns 見積画面で表示される受注ヘッダ
 */
export const getOrderForQuotation = async (id: number): Promise<JuchuValues | null> => {
  try {
    const { data: juchuData, error } = await selectJuchu(id);
    if (error) {
      return null;
    }
    const order: JuchuValues = {
      juchuHeadId: juchuData.juchu_head_id,
      juchuSts: juchuData.juchu_sts_nam,
      juchuDat: juchuData.juchu_dat ? new Date(juchuData.juchu_dat) : null,
      juchuRange:
        juchuData.juchu_str_dat && juchuData.juchu_end_dat
          ? { strt: new Date(juchuData.juchu_str_dat), end: new Date(juchuData.juchu_end_dat) }
          : { strt: null, end: null },
      nyuryokuUser: juchuData.nyuryoku_user,
      koenNam: juchuData.koen_nam,
      koenbashoNam: juchuData.koenbasho_nam,
      kokyaku: { id: juchuData.kokyaku_id, name: juchuData.kokyaku_nam },
      kokyakuTantoNam: juchuData.kokyaku_tanto_nam,
      mem: juchuData.mem,
      nebikiAmt: juchuData.nebiki_amt,
      zeiKbn: juchuData.zei_nam,
    };
    console.log('GetOrder order : ', order);
    return order;
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 見積一覧で選択された見積IDの見積書情報を取得する関数
 * @param mituId 選択された見積ヘッドID
 */
export const getChosenQuot = async (mituId: number) => {
  // 明細のデータ変換をする
  const transformMeisaiHead = (head: MituMeisaiHead, meisais: MituMeisai[]) => ({
    mituMeisaiHeadId: head.mitu_meisai_head_id,
    mituMeisaiHeadNam: head.mitu_meisai_head_nam,
    mituMeisaiKbn: head.mitu_meisai_head_kbn,
    headNamDspFlg: Boolean(head.head_nam_dsp_flg),
    nebikiNam: head.nebiki_nam,
    nebikiAmt: head.nebiki_amt,
    nebikiAftAmt: head.nebiki_aft_amt,
    nebikiAftNam: head.nebiki_aft_nam,
    shokeiAmt: meisais.reduce((total, m) => total + (m.shokei_amt ?? 0), 0),
    biko1: head.biko_1,
    biko2: head.biko_2,
    biko3: head.biko_3,
    meisai: meisais.map((m) => ({
      id: m.mitu_meisai_id,
      nam: m.mitu_meisai_nam,
      qty: m.meisai_qty,
      honbanbiQty: m.meisai_honbanbi_qty,
      tankaAmt: m.meisai_tanka_amt,
      shokeiAmt: m.shokei_amt,
    })),
  });
  try {
    // 見積ヘッドの取得
    const { data: mituData, error: mituError } = await selectChosenMitu(mituId);
    if (mituError) {
      console.error(mituError);
      throw new Error('DBエラー：t_mitu_head');
    }
    console.log(mituData);

    // 受注情報と明細情報を並列を取得
    const [juchuResult, meisaiHeadResult, meisaiResult] = await Promise.all([
      mituData.juchu_head_id ? selectJuchu(mituData.juchu_head_id) : Promise.resolve({ data: null, error: null }),
      selectQuotMeisaiHead(mituData.mitu_head_id),
      selectQuotMeisai(mituData.mitu_head_id),
    ]);

    const { data: juchuData, error: juchuError } = juchuResult;
    if (juchuError) throw new Error('DBエラー：v_juchu_lst');
    const { data: meisaiHeads, error: meisaiHeadError } = meisaiHeadResult;
    const { data: meisais, error: meisaiError } = meisaiResult;
    if (meisaiHeadError || meisaiError) throw new Error('DBエラー：明細取得時');

    // 受注情報の整形
    const juchus: JuchuValues | null = juchuData
      ? {
          juchuHeadId: juchuData.juchu_head_id,
          juchuSts: juchuData.juchu_sts_nam,
          juchuDat: juchuData.juchu_dat ? new Date(juchuData.juchu_dat) : null,
          juchuRange:
            juchuData.juchu_str_dat && juchuData.juchu_end_dat
              ? { strt: new Date(juchuData.juchu_str_dat), end: new Date(juchuData.juchu_end_dat) }
              : { strt: null, end: null },
          nyuryokuUser: juchuData.nyuryoku_user,
          koenNam: juchuData.koen_nam,
          koenbashoNam: juchuData.koenbasho_nam,
          kokyaku: { id: juchuData.kokyaku_id, name: juchuData.kokyaku_nam },
          kokyakuTantoNam: juchuData.kokyaku_tanto_nam,
          mem: juchuData.mem,
          nebikiAmt: juchuData.nebiki_amt,
          zeiKbn: juchuData.zei_nam,
        }
      : null;

    // 明細をヘッダIDごとにグループ化
    const meisaisByHeadId = meisais.reduce((acc: Record<number, MituMeisai[]>, current: MituMeisai) => {
      const headId = current.mitu_meisai_head_id;
      if (!acc[headId]) {
        acc[headId] = [];
      }
      acc[headId].push(current);
      return acc;
    }, {});

    // ヘッダを区分ごとに分類・整形
    // 初期値
    const initialKbnMeisais: {
      kizai: QuotMeisaiHeadValues[];
      labor: QuotMeisaiHeadValues[];
      other: QuotMeisaiHeadValues[];
    } = { kizai: [], labor: [], other: [] };
    const kbnMeisais = meisaiHeads.reduce((acc, head) => {
      const associatedMeisais = meisaisByHeadId[head.mitu_meisai_head_id] || [];
      const transformedHead = transformMeisaiHead(head, associatedMeisais);

      switch (head.mitu_meisai_head_kbn) {
        case 0: // kizai
          acc.kizai.push(transformedHead);
          break;
        case 1: // labor
          acc.labor.push(transformedHead);
          break;
        case 2: // other
          acc.other.push(transformedHead);
          break;
      }
      return acc;
    }, initialKbnMeisais);

    // 見積の全情報
    const allData: QuotHeadValues = {
      mituHeadId: mituData.mitu_head_id,
      juchuHeadId: mituData.juchu_head_id,
      mituSts: mituData.mitu_sts,
      mituDat: mituData.mitu_dat ? new Date(mituData.mitu_dat) : null,
      mituHeadNam: mituData.mitu_head_nam,
      kokyakuId: mituData.kokyaku_id,
      kokyaku: mituData.kokyaku_nam,
      nyuryokuUser: mituData.nyuryoku_user,
      mituRange:
        mituData.mitu_str_dat && mituData.mitu_end_dat
          ? { strt: new Date(mituData.mitu_str_dat), end: new Date(mituData.mitu_end_dat) }
          : { strt: null, end: null },
      kokyakuTantoNam: mituData.kokyaku_tanto_nam,
      koenNam: mituData.koen_nam,
      koenbashoNam: mituData.koenbasho_nam,
      mituHonbanbiQty: mituData.mitu_honbanbi_qty,
      biko: mituData.biko,
      comment: mituData.comment,
      kizaiChukeiMei: mituData.kizai_chukei_mei,
      chukeiMei: mituData.chukei_mei,
      tokuNebikiMei: mituData.toku_nebiki_mei,
      tokuNebikiAmt: mituData.toku_nebiki_amt,
      zeiAmt: mituData.zei_amt,
      zeiRat: mituData.zei_rat,
      gokeiMei: mituData.gokei_mei,
      gokeiAmt: mituData.gokei_amt,
      meisaiHeads: kbnMeisais, // 整形済みのデータを代入
    };
    console.log(juchus);
    console.log({ m: allData, j: juchus });
    return { m: allData, j: juchus };
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 自動生成ダイアログ：選択用の機材ヘッダ名、受注ヘッドID、機材明細ヘッドIDを取得する関数
 * @param juchuId 受注ヘッドID
 * @returns 選択用の機材ヘッダ名、受注ヘッドID、機材明細ヘッドIDの配列
 */
export const getJuchuKizaiHeadNamListForQuot = async (juchuId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiHeadNamList(juchuId);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('明細名リスト', data.length, '件');
    return data.map((d) => ({
      juchuHeadId: d.juchu_head_id,
      juchuKizaiHeadId: d.juchu_kizai_head_id,
      headNam: d.head_nam,
      nebikiAmt: d.nebiki_amt,
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 自動生成ダイアログ：選択された機材明細ヘッダの明細を取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 機材ヘッダID
 * @returns 機材明細の配列
 */
export const getJuchuKizaiMeisaiList = async (juchuId: number, kizaiHeadId: number) => {
  try {
    const { data, error } = await selectKizaiHeadListForMitu(juchuId, kizaiHeadId);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('明細☆☆☆☆☆☆☆☆', data);
    return data.map((d) => ({
      nam: d.kizai_nam,
      qty: d.plan_kizai_qty,
      honbanbiQty: d.juchu_honbanbi_calc_qty,
      tankaAmt: d.kizai_tanka_amt,
      shokeiAmt: Math.round(
        Number(d.plan_kizai_qty ?? 0) * Number(d.juchu_honbanbi_calc_qty ?? 0) * Number(d.kizai_tanka_amt ?? 0)
      ),
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 自動生成ダイアログ：選択された機材明細ヘッダの明細を一式でまとめて取得する関数
 * @param juchuId 受注ヘッダID
 * @param kizaiHeadId 機材ヘッダID
 * @returns 一式でまとめた機材明細の配列
 */
export const getJuchuIsshikiMeisai = async (juchuId: number, kizaiHeadId: number) => {
  try {
    const { data, error } = await selectKizaiHeadListWithIsshikiForMitu(juchuId, kizaiHeadId);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('一式有効明細☆☆☆☆☆☆☆☆', data);
    return data.map((d) => ({
      nam: d.kizai_nam,
      qty: d.plan_kizai_qty,
      honbanbiQty: d.juchu_honbanbi_calc_qty,
      tankaAmt: d.kizai_tanka_amt,
      shokeiAmt: Math.round(
        Number(d.plan_kizai_qty ?? 0) * Number(d.juchu_honbanbi_calc_qty ?? 0) * Number(d.kizai_tanka_amt ?? 0)
      ),
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

/**
 * 一覧で選択された見積の削除フラグを１にする関数
 * @param {number[]} ids 選択された見積のヘッドIDの配列
 */
export const updQuotDelFlg = async (ids: number[]) => {
  try {
    console.log('Delete ::: ', ids);
    await updQuotHeadDelFlg(ids);
    await revalidatePath('/quotation-list');
  } catch (e) {
    throw e;
  }
};
