'use server';

import { revalidatePath } from 'next/cache';

import {
  insertNewCustomer,
  selectFilteredCustomers,
  selectOneCustomer,
  upDateCustomerDB,
} from '@/app/_lib/db/tables/m-kokyaku';
import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { FAKE_NEW_ID } from '../../_lib/constants';
import { emptyCustomer } from './datas';
import { CustomersMasterDialogValues, CustomersMasterTableValues } from './types';

/**
 * 顧客マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomersMasterTableValues[]>} 顧客マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredCustomers = async (query: string | undefined = '') => {
  try {
    const { data, error } = await selectFilteredCustomers(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredCustomers: CustomersMasterTableValues[] = data.map((d, index) => ({
      kokyakuId: d.kokyaku_id,
      kokyakuNam: d.kokyaku_nam,
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
    console.log(filteredCustomers.length);
    return filteredCustomers;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された顧客のデータを取得する関数
 * @param id 顧客マスタID
 * @returns {Promise<CustomersMasterDialogValues>} - 顧客の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenCustomer = async (id: number) => {
  try {
    const { data, error } = await selectOneCustomer(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyCustomer;
    }
    const CustomerDetails: CustomersMasterDialogValues = {
      kokyakuNam: data.kokyaku_nam,
      kana: data.kana,
      nebikiRat: data.nebiki_rat,
      delFlg: Boolean(data.del_flg),
      // keisho: data.keisho,
      adrPost: data.adr_post,
      adrShozai: data.adr_shozai,
      adrTatemono: data.adr_tatemono,
      adrSonota: data.adr_sonota,
      tel: data.tel,
      telMobile: data.tel_mobile,
      fax: data.fax,
      mail: data.mail,
      mem: data.mem,
      dspFlg: Boolean(data.dsp_flg),
      // closeDay: data.close_day,
      // siteDay: data.site_day,
      // kizaiNebikiFlg: Boolean(data.kizai_nebiki_flg),
    };
    console.log(CustomerDetails.delFlg);
    return CustomerDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された顧客のIDと名前を取得する関数
 * @param id 顧客マスタID
 * @returns {Promise<CustomersMasterDialogValues>} - 顧客の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenCustomerIdAndName = async (id: number) => {
  try {
    const { data, error } = await selectOneCustomer(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return {
        kokyakuId: FAKE_NEW_ID,
        kokyakuNam: '',
        kana: '',
        nebikiRat: null,
        delFlg: false,
        // keisho: '',
        adrPost: '',
        adrShozai: '',
        adrTatemono: '',
        adrSonota: '',
        tel: '',
        telMobile: '',
        fax: '',
        mail: '',
        mem: '',
        dspFlg: true,
        // closeDay: null,
        // siteDay: null,
        // kizaiNebikiFlg: false,
      };
    }
    const CustomerDetails = {
      kokyakuId: data.kokyaku_id ?? FAKE_NEW_ID,
      kokyakuNam: data.kokyaku_nam ?? '',
      kana: data.kana ?? '',
      nebikiRat: data.nebiki_rat ?? 0,
      delFlg: Boolean(data.del_flg),
      // keisho: data.keisho,
      adrPost: data.adr_post ?? '',
      adrShozai: data.adr_shozai ?? '',
      adrTatemono: data.adr_tatemono ?? '',
      adrSonota: data.adr_sonota ?? '',
      tel: data.tel ?? '',
      telMobile: data.tel_mobile ?? '',
      fax: data.fax ?? '',
      mail: data.mail ?? '',
      mem: data.mem ?? '',
      dspFlg: Boolean(data.dsp_flg),
      // closeDay: data.close_day,
      // siteDay: data.site_day,
      // kizaiNebikiFlg: Boolean(data.kizai_nebiki_flg),
    };
    console.log(CustomerDetails.delFlg);
    return CustomerDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 顧客マスタに新規登録する関数
 * @param data フォームで取得した顧客情報
 */
export const addNewCustomer = async (data: CustomersMasterDialogValues, user: string) => {
  console.log(data.kokyakuNam);
  try {
    await insertNewCustomer(data, user);
    await revalidatePath('/customers-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 顧客マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する顧客マスタID
 */
export const updateCustomer = async (rawData: CustomersMasterDialogValues, id: number, user: string) => {
  const date = toJapanTimeStampString();
  const updateData = {
    kokyaku_id: id,
    kokyaku_nam: rawData.kokyakuNam,
    kana: rawData.kana,
    kokyaku_rank: 0,
    nebiki_rat: rawData.nebikiRat,
    del_flg: Number(rawData.delFlg),
    adr_post: rawData.adrPost,
    adr_shozai: rawData.adrShozai,
    adr_tatemono: rawData.adrTatemono,
    adr_sonota: rawData.adrSonota,
    tel: rawData.tel,
    tel_mobile: rawData.telMobile,
    fax: rawData.fax,
    mail: rawData.mail,
    mem: rawData.mem,
    dsp_flg: Number(rawData.dspFlg),
    // close_day: rawData.closeDay,
    // site_day: rawData.siteDay,
    // kizai_nebiki_flg: Number(rawData.kizaiNebikiFlg),
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.kokyaku_nam);
  try {
    await upDateCustomerDB(updateData);
    await revalidatePath('/customer-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};

/**
 * 選択された顧客の名前を取得する関数
 * @param id 顧客ID
 * @returns {string} 顧客名
 */
export const getChosenCustomerName = async (id: number) => {
  try {
    const { data, error } = await selectOneCustomer(id);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return null;
    }
    const CustomerNam: string = data.kokyaku_nam;
    console.log(CustomerNam);
    return CustomerNam;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};
