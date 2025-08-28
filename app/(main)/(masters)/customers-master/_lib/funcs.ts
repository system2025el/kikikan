'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyCustomer } from './datas';
import { CustomersMasterDialogValues, CustomersMasterTableValues } from './types';

/**
 * 顧客マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomersMasterTableValues[]>} 顧客マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredCustomers = async (query: string) => {
  const builder = supabase
    .schema('dev2')
    .from('m_kokyaku')
    .select('kokyaku_id, kokyaku_nam, adr_shozai, adr_tatemono, adr_sonota, tel, fax, mem, dsp_flg, del_flg')
    .order('dsp_ord_num');

  // queryが存在する場合のみあいまい検索、顧客名、顧客名かな、住所、電話番号、fax番号
  if (query && query.trim() !== '') {
    builder.or(
      `kokyaku_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
    );
  }

  try {
    const { data, error } = await builder;
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
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
      }
    } else {
      console.error('顧客情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/customers-master');
};

/**
 * 選択された顧客のデータを取得する関数
 * @param id 顧客マスタID
 * @returns {Promise<CustomersMasterDialogValues>} - 顧客の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneCustomer = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_kokyaku')
      .select(
        'kokyaku_id, kokyaku_nam, kana, kokyaku_rank, keisho, del_flg, adr_post, adr_shozai, adr_tatemono, adr_sonota, tel, tel_mobile, fax, mail, mem, dsp_flg, close_day, site_day, kizai_nebiki_flg'
      )
      .eq('kokyaku_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const CustomerDetails: CustomersMasterDialogValues = {
        kokyakuNam: data.kokyaku_nam,
        kana: data.kana,
        kokyakuRank: data.kokyaku_rank,
        delFlg: Boolean(data.del_flg),
        keisho: data.keisho,
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
        closeDay: data.close_day,
        siteDay: data.site_day,
        kizaiNebikiFlg: Boolean(data.kizai_nebiki_flg),
      };
      console.log(CustomerDetails.delFlg);
      return CustomerDetails;
    } else {
      console.error('顧客情報取得エラー。', { message: error.message, code: error.code });
      return emptyCustomer;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyCustomer;
  }
};

/**
 * 顧客マスタに新規登録する関数
 * @param data フォームで取得した顧客情報
 */
export const addNewCustomer = async (data: CustomersMasterDialogValues) => {
  console.log(data.mem);

  const query = `
      INSERT INTO m_kokyaku (
        kokyaku_id, kokyaku_nam, kana, kokyaku_rank, keisho, del_flg, dsp_ord_num,
        adr_post, adr_shozai, adr_tatemono, adr_sonota,
        tel, tel_mobile, fax, mail,
        mem, dsp_flg, close_day, site_day, kizai_nebiki_flg,
        add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        (SELECT coalesce(max(kokyaku_id),0) + 1 FROM m_kokyaku),
        $1, $2, $3, $4, $5,
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_kokyaku),
        $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
      );
    `;

  const date = toJapanTimeString();

  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);

    await pool.query(query, [
      data.kokyakuNam,
      data.kana,
      data.kokyakuRank,
      data.keisho,
      Number(data.delFlg),
      data.adrPost,
      data.adrShozai,
      data.adrTatemono,
      data.adrSonota,
      data.tel,
      data.telMobile,
      data.fax,
      data.mail,
      data.mem,
      Number(data.dspFlg),
      data.closeDay,
      data.siteDay,
      Number(data.kizaiNebikiFlg),
      date,
      'shigasan',
      null,
      null,
    ]);
    console.log('data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/customers-master');
};

/**
 * 顧客マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する顧客マスタID
 */
export const updateCustomer = async (data: CustomersMasterDialogValues, id: number) => {
  console.log('Update!!!', data.mem);
  const missingData = {
    kokyaku_nam: data.kokyakuNam,
    kana: data.kana,
    del_flg: Number(data.delFlg),
    keisho: data.keisho,
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
    close_day: data.closeDay,
    site_day: data.siteDay,
    kizai_nebiki_flg: Number(data.kizaiNebikiFlg),
  };
  console.log(missingData.del_flg);
  const date = toJapanTimeString();

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.kokyaku_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_kokyaku')
      .update({ ...theData })
      .eq('kokyaku_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('顧客を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/customer-master');
};
