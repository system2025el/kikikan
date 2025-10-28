'use server';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { CustomersMasterDialogValues } from '@/app/(main)/(masters)/customers-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MKokyakuDBValues } from '../types/m-kokyaku-type';

/**
 * 受注ヘッダー用顧客データ取得
 * @param kokyaku_id 顧客id
 * @returns
 */
export const selectKokyaku = async (kokyaku_id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .select('kokyaku_nam, kokyaku_rank')
      .eq('kokyaku_id', kokyaku_id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 顧客マスタから有効な顧客リストを取得する関数
 * @returns 有効な顧客のリスト
 */
export const selectActiveCustomers = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .select('kokyaku_id, kokyaku_nam')
      .neq('dsp_flg', 0)
      .neq('del_flg', 1)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 顧客マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<CustomersDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const selectFilteredCustomers = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_kokyaku')
    .select(
      'kokyaku_id, kokyaku_nam, adr_shozai, adr_tatemono, adr_sonota, tel, fax, mem, dsp_flg, del_flg, kokyaku_rank'
    )
    .order('kokyaku_nam');

  // queryが存在する場合のみあいまい検索、顧客名、顧客名かな、住所、電話番号、fax番号
  if (query && query.trim() !== '') {
    builder.or(
      `kokyaku_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
    );
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * kokyaku_idが一致する顧客を取得する関数
 * @param id 探すkokyaku_id
 * @returns 顧客IDが一致する顧客情報
 */
export const selectOneCustomer = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .select(
        'kokyaku_id, kokyaku_nam, kana, nebiki_amt, keisho, del_flg, adr_post, adr_shozai, adr_tatemono, adr_sonota, tel, tel_mobile, fax, mail, mem, dsp_flg, close_day, site_day, kizai_nebiki_flg'
      )
      .eq('kokyaku_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 顧客マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewCustomer = async (data: CustomersMasterDialogValues, user: string) => {
  const query = `
  INSERT INTO ${SCHEMA}.m_kokyaku (
    kokyaku_id, kokyaku_nam, kana, kokyaku_rank, keisho, del_flg, dsp_ord_num,
    adr_post, adr_shozai, adr_tatemono, adr_sonota,
    tel, tel_mobile, fax, mail,
    mem, dsp_flg, close_day, site_day, kizai_nebiki_flg,
    add_dat, add_user
  )
  VALUES (
    (SELECT coalesce(max(kokyaku_id),0) + 1 FROM ${SCHEMA}.m_kokyaku),
    $1, $2, $3, $4, $5,
    (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_kokyaku),
    $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
  );
`;
  const date = toJapanTimeString();
  const values = [
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
    user,
  ];
  try {
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 顧客マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する顧客のkokyaku_id
 */
export const upDateCustomerDB = async (data: MKokyakuDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_kokyaku')
      .update({ ...data })
      .eq('kokyaku_id', data.kokyaku_id);
  } catch (e) {
    throw e;
  }
};
