'use server';

import { revalidatePath } from 'next/cache';

import { insertNewUser, SelectFilteredUsers, selectOneUser, upDateUserDB } from '@/app/_lib/db/tables/m-user';
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
    const biString = rows[0].permission.toString(2).padStart(8);

    const UserDetails: UsersMasterDialogValues = {
      mailAdr: rows[0].mail_adr,
      tantouNam: rows[0].user_nam,
      delFlg: Boolean(rows[0].del_flg),
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
  try {
    await insertNewUser(data, user);
    await revalidatePath('/users-master');
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
export const updateUser = async (data: UsersMasterDialogValues, id: number, user: string) => {
  const date = toJapanTimeString();
  const updateData = {
    user_nam: data.tantouNam,
    del_flg: Number(data.delFlg),
    upd_dat: date,
    upd_user: user,
  };
  console.log(updateData.user_nam);
  try {
    await upDateUserDB(updateData, id);
    // await upDateUserDB(updateData, id);
    await revalidatePath('/users-master');
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
};
