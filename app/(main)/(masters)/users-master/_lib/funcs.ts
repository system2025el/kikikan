'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { supabase, supabaseAdmin } from '@/app/_lib/db/supabase';
import {
  insertNewUser,
  SelectFilteredUsers,
  selectOneUser,
  upDateUserDB,
  updMUserDelFlg,
  updMUserDelFlgAndShainCod,
} from '@/app/_lib/db/tables/m-user';
import { MUserDBValues } from '@/app/_lib/db/types/m-use-type';
import { getUrl } from '@/app/_lib/url';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyUser } from './datas';
import { UsersMasterDialogValues, UsersMasterTableValues } from './types';

/**
 * 担当者マスタテーブルのデータを取得する関数
 * @param query 検索キーワード モック修正が必要、IDの部分
 * @returns {Promise<UsersMasterTableValues[]>} 担当者マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredUsers = async (query: string = '') => {
  try {
    const { rows } = await SelectFilteredUsers(query);
    if (!rows || rows.length === 0) {
      return [];
    }
    const filteredUsers: UsersMasterTableValues[] = rows.map((d, index) => ({
      tantouNam: d.user_nam,
      mailAdr: d.mail_adr,
      shainCod: d.shain_cod,
      mem: d.mem,
      lastLogin: !d.last_sign_in_at ? null : toJapanTimeString(d.last_sign_in_at),
      tblDspId: index + 1,
      delFlg: Boolean(d.del_flg),
    }));
    console.log(filteredUsers.length);
    return filteredUsers;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 選択された担当者のデータを取得する関数
 * @param id 担当者マスタID
 * @returns {Promise<UsersMasterDialogValues>} - 担当者の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getChosenUser = async (mailAdr: string) => {
  try {
    const { rows } = await selectOneUser(mailAdr);

    if (!rows || rows.length === 0) {
      return emptyUser;
    }
    // permissionを２進数に戻す
    const biString = rows[0].permission.toString(2).padStart(8, 0);

    const UserDetails: UsersMasterDialogValues = {
      mailAdr: rows[0].mail_adr,
      tantouNam: rows[0].user_nam,
      delFlg: Boolean(rows[0].del_flg),
      shainCod: rows[0].shain_cod,
      psermission:
        rows[0].permission === 65535
          ? {
              juchu: '11',
              nyushuko: '11',
              masters: '11',
              ht: '1',
              loginSetting: '1',
            }
          : {
              juchu: biString.slice(0, 2),
              nyushuko: biString.slice(2, 4),
              masters: biString.slice(4, 6),
              ht: biString.slice(6, 7),
              loginSetting: biString.slice(7, 8),
            },
      mem: rows[0].mem,
      lastLoginAt: !rows[0].last_sign_in_at ? null : toJapanTimeString(rows[0].last_sign_in_at),
    };
    console.log(UserDetails.psermission);
    return UserDetails;
  } catch (e) {
    console.error('例外が発生しました:', e);
    throw e;
  }
};

/**
 * 担当者マスタに新規登録する関数
 * @param data フォームで取得した担当者情報
 */
export const addNewUser = async (data: UsersMasterDialogValues, user: string) => {
  console.log(data.tantouNam);
  const p = data.psermission;
  const permissionNum = parseInt(p.juchu + p.nyushuko + p.masters + p.ht + p.loginSetting, 2);
  const insertData: MUserDBValues = {
    user_nam: data.tantouNam,
    shain_cod: data.shainCod ?? null,
    mail_adr: data.mailAdr,
    permission: permissionNum === 255 ? 65535 : permissionNum,
    del_flg: Number(data.delFlg),
    mem: data.mem ?? null,
    add_dat: toJapanTimeString(undefined, '-'),
    add_user: user,
  };
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    // 担当者マスタ更新
    const result = await insertNewUser(insertData, connection);
    if (result) {
      console.log(result);
    }
    // 認証メール送信
    console.log(`${getUrl()}`);
    const { error } = await supabase.auth.signUp({
      email: data.mailAdr,
      password: 'password',
      options: { emailRedirectTo: `${getUrl()}` },
    });
    console.log('できた');
    await revalidatePath('/users-master');
    if (error) {
      await connection.query('ROLLBACK');
      throw error;
    }
    await connection.query('COMMIT');
  } catch (error) {
    console.log('DB接続エラー', error);
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 担当者マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する担当者マスタID
 */
export const updateUser = async (currentEmail: string, data: UsersMasterDialogValues, user: string) => {
  const date = toJapanTimeString(undefined, '-');
  // permissionを10進数に変換する
  const p = data.psermission;
  const permissionNum = parseInt(p.juchu + p.nyushuko + p.masters + p.ht + p.loginSetting, 2);

  // 更新データ
  const updateData: MUserDBValues = {
    user_nam: data.tantouNam,
    shain_cod: data.shainCod ?? null,
    mail_adr: currentEmail,
    permission: permissionNum === 255 ? 65535 : permissionNum,
    del_flg: Number(data.delFlg),
    mem: data.mem ?? null,
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.user_nam);
  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    // マスタ更新する
    await upDateUserDB(updateData, connection);
  } catch (error) {
    console.log('例外が発生', error);
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 条件の担当者マスタを無効化し、authの認証削除する関数
 * @param data
 */
export const deleteUsers = async (mailAdr: string, user: string) => {
  const delData = {
    mail_adr: mailAdr,
    del_flg: 1,
    upd_dat: toJapanTimeString(undefined, '-'),
    upd_user: user,
  };

  const connection = await pool.connect();
  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error(listError);
      throw listError;
    }
    const targetUser = users?.users.find((u) => u.email === mailAdr);
    const userId = targetUser?.id;
    await connection.query('BEGIN');
    await updMUserDelFlg(delData, connection);
    if (userId) {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (error) {
        console.error('削除失敗:', error.message);
        await connection.query('ROLLBACK');
        throw error;
      }
      await connection.query('COMMIT');
    }
    await connection.query('ROLLBACK');
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * 条件の担当者マスタを有効化し、authの認証メールを送信する関数
 * @param data
 */
export const restoreUsers = async (mailAdr: string, user: string) => {
  const delData = {
    mail_adr: mailAdr,
    del_flg: 0,
    upd_dat: toJapanTimeString(undefined, '-'),
    upd_user: user,
  };

  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    // 担当者マスタ更新
    await updMUserDelFlg(delData, connection);
    // 認証メール送信
    console.log(`${getUrl()}`);
    const { error } = await supabase.auth.signUp({
      email: mailAdr,
      password: 'password',
      options: { emailRedirectTo: `${getUrl()}` },
    });
    if (error) {
      console.error('削除失敗:', error.message);
      await connection.query('ROLLBACK');
      throw error;
    }
    await connection.query('COMMIT');
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
};

/**
 * 条件の担当者マスタを有効化し社員コードを変更、authの認証メールを送信する関数
 * @param data
 */
export const restoreUsersAndShainCod = async (mailAdr: string, shainCod: string | null, user: string) => {
  const delData = {
    mail_adr: mailAdr,
    del_flg: 0,
    upd_dat: toJapanTimeString(undefined, '-'),
    upd_user: user,
    shain_cod: shainCod,
  };

  const connection = await pool.connect();
  try {
    await connection.query('BEGIN');
    // 担当者マスタ更新
    await updMUserDelFlgAndShainCod(delData, connection);
    // 認証メール送信
    console.log(`${getUrl()}`);
    const { error } = await supabase.auth.signUp({
      email: mailAdr,
      password: 'password',
      options: { emailRedirectTo: `${getUrl()}` },
    });
    if (error) {
      console.error('削除失敗:', error.message);
      await connection.query('ROLLBACK');
      throw error;
    }
    await connection.query('COMMIT');
  } catch (e) {
    await connection.query('ROLLBACK');
    throw e;
  } finally {
    connection.release();
  }
};
