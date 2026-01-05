'use server';

import { PoolClient } from 'pg';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { UsersMasterDialogValues } from '@/app/(main)/(masters)/users-master/_lib/types';

import pool from '../postgres';
import { SCHEMA, supabase } from '../supabase';
import { MUserDBValues } from '../types/m-use-type';

/**
 * 要修正・確認 m_userから有効な担当者リストを取得する関数 viewを作って社員コードではなくすべきか？
 * @returns {{user_nam, shain_cod}[]} 有効な担当者リスト
 */
export const selectActiveUsers = async () => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_user')
      .select('user_nam, shain_cod')
      .neq('del_flg', 1)
      .order('user_nam');
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
  query += ` ORDER BY m.user_nam`;

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
export const insertNewUser = async (data: MUserDBValues, connection: PoolClient) => {
  const cols = Object.keys(data).join(', ');
  const values = Object.values(data);
  const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
  const query = `
    INSERT INTO ${SCHEMA}.m_user (${cols})
    VALUES (${placeholders});
  `;
  try {
    return await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 担当者マスタを更新する関数
 * @param data 更新するデータ
 * @param id 更新する担当者のuser_id
 */
export const upDateUserDB = async (data: MUserDBValues, connection: PoolClient) => {
  const { mail_adr, ...rest } = data;
  const cols = Object.keys(rest);
  const updSet = cols
    .map((key, index) => `"${key}" = $${index + 2}`) // $1はWHERE句で使うため、$2から開始
    .join(', ');
  const query = `
    UPDATE ${SCHEMA}.m_user
    SET ${updSet}
    WHERE mail_adr = $1
    RETURNING *;
  `;

  console.log(query);

  const values = [data.mail_adr, ...Object.values(rest)];
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * supabaseクライアントでm_userを更新する関数
 * @param {MUserDBValues} data 更新データ
 */
export const updMUserDelFlg = async (
  data: { mail_adr: string; del_flg: number; upd_dat: string; upd_user: string },
  connection: PoolClient
) => {
  const values = Object.values(data);
  const query = `
    UPDATE
      ${SCHEMA}.m_user
    SET
      del_flg = $2,
      upd_dat = $3,
      upd_user = $4
    WHERE
      mail_adr = $1;
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * supabaseクライアントでm_userを更新する関数
 * @param {MUserDBValues} data 更新データ
 */
export const updMUserDelFlgAndShainCod = async (
  data: { mail_adr: string; del_flg: number; upd_dat: string; upd_user: string; shain_cod: string | null },
  connection: PoolClient
) => {
  const values = Object.values(data);
  const query = `
    UPDATE
      ${SCHEMA}.m_user
    SET
      del_flg = $2,
      upd_dat = $3,
      upd_user = $4,
      shain_cod = $5
    WHERE
      mail_adr = $1;
  `;
  try {
    await connection.query(query, values);
  } catch (e) {
    throw e;
  }
};

/**
 * 社員コードの一致する担当者を取得する関数
 * @param {string} cod 社員コード
 */
export const checkShainCod = async (cod: string) => {
  try {
    return await supabase
      .schema(SCHEMA)
      .from('m_user')
      .select('*')
      .eq('shain_cod', cod)
      .neq('del_flg', 1)
      .maybeSingle();
  } catch (e) {
    throw e;
  }
};

/**
 * 無効も含めてメールアドレスの一致する担当者を取得する関数
 * @param {string} cod メールアドレス
 */
export const checkMailAdr = async (adr: string) => {
  try {
    return await supabase.schema(SCHEMA).from('m_user').select('*').eq('mail_adr', adr).maybeSingle();
  } catch (e) {
    throw e;
  }
};
