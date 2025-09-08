'use server';

import { selectActiveMituSts } from '@/app/_lib/db/tables/m-mitu-sts';
import { selectActiveUsers } from '@/app/_lib/db/tables/m-user';
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
export const getOrderForQuotation = async (id: number) => {
  try {
    const { data: juchuData, error } = await selectJuchu(id);

    if (error || !juchuData) {
      console.error('GetOrder juchu error : ', error);
      throw new Error('受注ヘッダーが存在しません');
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
    console.log(e);
  }
};
