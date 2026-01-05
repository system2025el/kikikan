'use server';

import { revalidatePath } from 'next/cache';

import {
  insertNewLoc,
  selectActiveLocations,
  selectFilteredLocs,
  selectOneLoc,
  upDateLocDB,
} from '@/app/_lib/db/tables/m-koenbasho';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { emptyLoc } from './datas';
import { LocsMasterDialogValues, LocsMasterTableValues } from './types';

export const getLocsSelection = async (): Promise<SelectTypes[]> => {
  try {
    const { data, error } = await selectActiveLocations();
    if (error) {
      console.error('例外発生', error);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    return data.map((d) => ({ id: d.koenbasho_id, label: d.koenbasho_nam }));
  } catch (e) {
    throw e;
  }
};

/**
 * 公演場所マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<LocsMasterTableValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredLocs = async (query: string = '') => {
  try {
    const { data, error } = await selectFilteredLocs(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredLocs: LocsMasterTableValues[] = data.map((d, index) => ({
      locId: d.koenbasho_id,
      locNam: d.koenbasho_nam,
      adrShozai: d.adr_shozai,
      adrTatemono: d.adr_tatemono,
      adrSonota: d.adr_sonota,
      tel: d.tel,
      fax: d.fax,
      mem: d.mem,
      dspFlg: Boolean(d.dsp_flg),
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredLocs.length);
    return filteredLocs;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された公演場所のデータを取得する関数
 * @param id 公演場所マスタID
 * @returns {Promise<LocsMasterDialogValues>} - 公演場所の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenLoc = async (id: number) => {
  try {
    const { data, error } = await selectOneLoc(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyLoc;
    }
    const locDetails: LocsMasterDialogValues = {
      locNam: data.koenbasho_nam,
      adrPost: data.adr_post,
      adrShozai: data.adr_shozai,
      adrTatemono: data.adr_tatemono,
      adrSonota: data.adr_sonota,
      tel: data.tel,
      fax: data.fax,
      mem: data.mem,
      kana: data.kana,
      dspFlg: Boolean(data.dsp_flg),
      telMobile: data.tel_mobile,
      delFlg: Boolean(data.del_flg),
    };
    console.log(locDetails.delFlg);
    return locDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 公演場所マスタに新規登録する関数
 * @param data フォームで取得した公演場所情報
 */
export const addNewLoc = async (data: LocsMasterDialogValues, user: string) => {
  console.log(data.locNam);
  try {
    await insertNewLoc(data, user);
    await revalidatePath('/locations-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 公演場所マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する公演場所マスタID
 */
export const updateLoc = async (data: LocsMasterDialogValues, id: number, user: string) => {
  const date = new Date().toISOString();
  const updateData = {
    koenbasho_id: id,
    koenbasho_nam: data.locNam,
    kana: data.kana,
    del_flg: Number(data.delFlg),
    adr_post: data.adrPost,
    adr_shozai: data.adrShozai,
    adr_tatemono: data.adrTatemono,
    adr_sonota: data.adrSonota,
    tel: data.tel,
    tel_mobile: data.telMobile,
    fax: data.fax,
    mail: data.mail,
    mem: data.mem,
    dsp_flg: Number(data.dspFlg),
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.koenbasho_nam);
  try {
    await upDateLocDB(updateData);
    await revalidatePath('/locations-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
