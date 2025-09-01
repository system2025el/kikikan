import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { UsersMasterDialogValues } from '@/app/(main)/(masters)/users-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 担当者マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<UsersDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const SelectFilteredUsers = async (query: string) => {
  const builder = supabase
    .schema(SCHEMA)
    .from('m_user')
    .select('instance_id, user_nam, del_flg') // テーブルに表示するカラム
    .ilike('user_nam', `%${query}%`)
    //   // あいまい検索、担当者名、担当者名かな、住所、電話番号、fax番号
    //   .or(`user_nam.ilike.%${query}%`)
    .order('dsp_ord_num'); // 並び順
  // queryが存在する場合のみあいまい検索、担当者名、担当者名かな、住所、電話番号、fax番号
  if (query && query.trim() !== '') {
    builder.or(
      `user_nam.ilike.%${query}%, kana.ilike.%${query}%, adr_shozai.ilike.%${query}%, adr_tatemono.ilike.%${query}%, adr_sonota.ilike.%${query}%, tel.ilike.%${query}%, fax.ilike.%${query}%`
    );
  }

  try {
    return await builder;
  } catch (e) {
    throw e;
  }
};

/**
 * user_idが一致する担当者を取得する関数
 * @param id 探すuser_id
 * @returns 担当者IDが一致する担当者情報
 */
export const selectOneUser = async (id: number) => {
  try {
    return await supabase.schema(SCHEMA).from('m_user').select('user_nam, del_flg, mem').eq('instance_id', id).single();
  } catch (e) {
    throw e;
  }
};

/**
 * 担当者マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewUser = async (data: UsersMasterDialogValues) => {
  const query = `
    INSERT INTO m_user (
      user_nam, del_flg, dsp_ord_num,
      add_dat, add_user
    )
    VALUES (
      $1, $2,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_user),
      $3, $4
    );
  `;
  const date = toJapanTimeString();
  const values = [data.tantouNam, Number(data.delFlg), date, 'shigasan'];
  try {
    await pool.query(` SET search_path TO dev2;`);
    await pool.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 担当者マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する担当者のuser_id
 */
export const upDateUserDB = async (
  data: { user_nam: string; del_flg: number; upd_dat: string; upd_user: string },
  id: number
) => {
  try {
    await supabase
      .schema(SCHEMA)
      .from('m_user')
      .update({ ...data })
      .eq('instance_id', id);
  } catch (e) {
    throw e;
  }
};
