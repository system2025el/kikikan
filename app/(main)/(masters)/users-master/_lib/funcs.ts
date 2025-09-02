'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { SCHEMA, supabase } from '@/app/_lib/db/supabase';
import { insertMasterUpdates } from '@/app/_lib/db/tables/m-master-update';
import { insertNewUser, SelectFilteredUsers, selectOneUser, upDateUserDB } from '@/app/_lib/db/tables/m-user';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyUser } from './data';
import { UsersMasterDialogValues, UsersMasterTableValues } from './types';

/**
 * 担当者マスタテーブルのデータを取得する関数
 * @param query 検索キーワード モック修正が必要、IDの部分
 * @returns {Promise<UsersMasterTableValues[]>} 担当者マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredUsers = async (query: string = '') => {
  try {
    const { data, error } = await SelectFilteredUsers(query);
    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data || data.length === 0) {
      return [];
    }
    const filteredUsers: UsersMasterTableValues[] = data.map((d, index) => ({
      tantouId: index,
      tantouNam: d.user_nam,
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
export const getChosenUser = async (id: number) => {
  try {
    const { data, error } = await selectOneUser(id);

    if (error) {
      console.error('DB情報取得エラー', error.message, error.cause, error.hint);
      throw error;
    }
    if (!data) {
      return emptyUser;
    }
    const UserDetails: UsersMasterDialogValues = {
      tantouNam: data.user_nam,
      delFlg: Boolean(data.del_flg),
    };
    console.log(UserDetails.delFlg);
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
export const addNewUser = async (data: UsersMasterDialogValues) => {
  console.log(data.tantouNam);
  try {
    // await insertNewUser(data);
    // await revalidatePath('/users-master');
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
};

/**
 * 担当者マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する担当者マスタID
 */
export const updateUser = async (data: UsersMasterDialogValues, id: number) => {
  const date = toJapanTimeString();
  const updateData = {
    user_nam: data.tantouNam,
    del_flg: Number(data.delFlg),
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(updateData.user_nam);
  try {
    await upDateUserDB(updateData, id);
    // await Promise.all([upDateUserDB(updateData, id), insertMasterUpdates('m_user')]);
    await revalidatePath('/users-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
