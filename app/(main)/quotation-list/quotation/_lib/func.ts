'use server';

import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { selectActiveMituSts } from '@/app/_lib/db/tables/m-mitu-sts';
import { selectActiveUsers } from '@/app/_lib/db/tables/m-user';
import { selectJuchuHead } from '@/app/_lib/db/tables/t-juchu-head';
import { selectJuchuHonbanbiQty } from '@/app/_lib/db/tables/t-juchu-kizai-head';
import { selectHonbanbi } from '@/app/_lib/db/tables/t-juchu-kizai-honbanbi';
import { selectJuchuKizaiHeadList } from '@/app/_lib/db/tables/v-juchu-kizai-head-lst';
import { selectOyaJuchuKizaiMeisai } from '@/app/_lib/db/tables/v-juchu-kizai-meisai';
import { selectJuchu } from '@/app/_lib/db/tables/v-juchu-lst';
import { JuchuHead } from '@/app/_lib/db/types/t-juchu-head-type';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { JuchuValues } from './types';

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
    const selectElements: SelectTypes[] = data.map((d) => ({
      id: d.shain_cod!,
      label: d.user_nam,
    }));
    console.log('担当者が', selectElements.length, '件');
    return selectElements;
  } catch (e) {
    console.error('担当者取得DBエラー', e);
    throw e;
  }
};

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
 *
 * @param juchuId
 * @returns
 */
export const getJuchuKizaiHeadNamList = async (juchuId: number) => {
  try {
    const { data, error } = await selectJuchuKizaiHeadList(juchuId);
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
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};

export const getJuchuKizaiMeisaiList = async (juchuId: number, kizaiHeadId: number) => {
  try {
    const { data, error } = await selectOyaJuchuKizaiMeisai(juchuId, kizaiHeadId);
    const { data: honbanbi, error: honbanbiError } = await selectJuchuHonbanbiQty(juchuId, kizaiHeadId);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (honbanbiError) {
      console.error('DB情報取得エラー', honbanbiError.message, honbanbiError.cause, honbanbiError.hint);
      throw honbanbiError;
    }
    if (!data || data.length === 0) {
      return [];
    }
    console.log('dataだよ☆☆☆☆☆☆☆☆', data);
    return data.map((d) => ({
      nam: d.kizai_nam,
      qty: String(d.plan_kizai_qty! + d.plan_yobi_qty!),
      honbanbiQty: String(honbanbi.juchu_honbanbi_qty!),
      tankaAmt: String(1000), // ビューが欲しい
      shokeiAmt: String((d.plan_kizai_qty! + d.plan_yobi_qty!) * honbanbi.juchu_honbanbi_qty! * 1000),
    }));
  } catch (e) {
    console.error('例外が発生しました', e);
    throw e;
  }
};
