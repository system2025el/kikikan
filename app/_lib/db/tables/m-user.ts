import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { UsersMasterDialogValues } from '@/app/(main)/(masters)/users-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';

/**
 * 要修正・確認 m_userから有効な担当者リストを取得する関数 viewを作って社員コードではなくすべきか？
 * @returns {{user_nam, shain_cod}[]} 有効な担当者リスト
 */
export const selectActiveUsers = async () => {
  try {
    return await supabase
      .schema('dev6')
      .from('m_user')
      .select('user_nam, shain_cod')
      .neq('del_flg', 1)
      .order('dsp_ord_num');
  } catch (e) {
    throw e;
  }
};

/**
 * 担当者マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<UsersDialogValues[]>} 公演場所マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const SelectFilteredUsers = async (searchQuery: string) => {
  let query = `
  SELECT
    m.mail_adr, m.user_nam, m.del_flg, m.shain_cod, m.mem, u.last_sign_in_at
  FROM
    ${SCHEMA}.m_user as m
  LEFT JOIN
    auth.users as u
  ON m.mail_adr = u.email
  `;
  const params = [];
  // 検索条件あれば
  if (searchQuery && searchQuery.trim() !== '') {
    query += `WHERE m.user_nam ILIKE $1`;
    params.push(`%${searchQuery}%`);
  }
  try {
    return await pool.query(query, params);
  } catch (e) {
    throw e;
  }
};

/**
 * user_idが一致する担当者を取得する関数
 * @param id 探すuser_id
 * @returns 担当者IDが一致する担当者情報
 */
export const selectOneUser = async (mailAdr: string) => {
  const query = `
  SELECT
    m.mail_adr, m.user_nam, m.permission, m.del_flg, m.shain_cod, m.mem, u.last_sign_in_at
  FROM
    ${SCHEMA}.m_user as m
  LEFT JOIN
    auth.users as u
  ON m.mail_adr = u.email
  WHERE
    m.mail_adr = $1;`;
  try {
    return await pool.query(query, [mailAdr]);
  } catch (e) {
    throw e;
  }
};

/**
 * 担当者マスタに新規挿入する関数
 * @param data 挿入するデータ
 */
export const insertNewUser = async (data: UsersMasterDialogValues, user: string) => {
  const query = `
    INSERT INTO ${SCHEMA}.m_user (
      user_nam, del_flg, dsp_ord_num,
      add_dat, add_user
    )
    VALUES (
      $1, $2,
      (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM ${SCHEMA}.m_user),
      $3, $4
    );
  `;
  const date = toJapanTimeString();
  const values = [data.tantouNam, Number(data.delFlg), date, user];
  try {
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
