import { toJapanTimeStampString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { LocsMasterDialogValues } from '@/app/(main)/(masters)/locations-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MKoenbashoDBValues } from '../types/m-koenbasho-type';

/**
 * 顧客マスタから有効な顧客リストを取得する関数
 * @returns 有効な顧客のリスト
 */
export const selectActiveLocations = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_koenbasho')
      .select('koenbasho_id, koenbasho_nam')
      .neq('dsp_flg', 0)
      .neq('del_flg', 1)
      .order('koenbasho_nam');
  } catch (e) {
    throw e;
  }
};

/**
 * 公演場所マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<LocsDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const selectFilteredLocs = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_koenbasho')
    .select('koenbasho_id, koenbasho_nam, adr_shozai, adr_tatemono, adr_sonota, tel,  fax, mem, dsp_flg, del_flg') // テーブルに表示するカラム
    .order('koenbasho_nam'); // 並び順
  // あいまい検索：公演場所名、かな、住所、電話番号、ファックス番号
  if (query && query.trim() !== '') {
    builder.or(
      `koenbasho_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
    );
  }
  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * koenbasho_idが一致する公演場所を取得する関数
 * @param id 探すkoenbasho_id
 * @returns 公演場所IDが一致する公演場所情報
 */
export const selectOneLoc = async (id: number) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_koenbasho')
      .select(
        'koenbasho_id, koenbasho_nam, kana, del_flg, adr_post, adr_shozai, adr_tatemono, adr_sonota, tel, tel_mobile, fax, mail,  mem, dsp_flg'
      )
      .eq('koenbasho_id', id)
      .single();
  } catch (e) {
    throw e;
  }
};

/**
 * 公演場所マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewLoc = async (data: LocsMasterDialogValues, user: string) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_koenbasho (
      koenbasho_id, koenbasho_nam, kana, del_flg, dsp_ord_num,
      adr_post, adr_shozai, adr_tatemono, adr_sonota,
      tel, tel_mobile, fax, mail,
      mem, dsp_flg, add_dat, add_user
    )
    VALUES (
      (SELECT coalesce(max(koenbasho_id),0) + 1 FROM ${SCHEMA}.m_koenbasho),
      $1, $2, $3,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_koenbasho),
      $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
    );
  `;
  const date = toJapanTimeStampString();
  const values = [
    data.locNam,
    data.kana,
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
 * 公演場所マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する公演場所のkoenbasho_id
 */
export const upDateLocDB = async (data: MKoenbashoDBValues) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_koenbasho')
      .update({ ...data })
      .eq('koenbasho_id', data.koenbasho_id);
  } catch (e) {
    throw e;
  }
};
