'use server';

import { revalidatePath } from 'next/cache';

import pool from '@/app/_lib/db/postgres';
import { supabase } from '@/app/_lib/db/supabase';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

import { emptyUser } from './data';
import { UsersMasterDialogValues, UsersMasterTableValues } from './types';

/**
 * 担当者マスタテーブルのデータを取得する関数
 * @param query 検索キーワード
 * @returns {Promise<UsersMasterTableValues[]>} 担当者マスタテーブルに表示するデータ（ 検索キーワードが空の場合は全て ）
 */
export const getFilteredUsers = async (query: string) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_user')
      .select('instance_id, user_nam, del_flg') // テーブルに表示するカラム
      .ilike('user_nam', `%${query}%`)
      //   // あいまい検索、担当者名、担当者名かな、住所、電話番号、fax番号
      //   .or(`user_nam.ilike.%${query}%`)
      .order('dsp_ord_num'); // 並び順
    if (!error) {
      console.log('I got a datalist from db', data.length);
      if (!data || data.length === 0) {
        return [];
      } else {
        const filteredUsers: UsersMasterTableValues[] = data.map((d, index) => ({
          tantouId: d.instance_id,
          tantouNam: d.user_nam,
          tblDspId: index + 1,
          delFlg: Boolean(d.del_flg),
        }));
        console.log(filteredUsers.length);
        return filteredUsers;
      }
    } else {
      console.error('担当者情報取得エラー。', { message: error.message, code: error.code });
      return [];
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
  }
  revalidatePath('/users-master');
};

/**
 * 選択された担当者のデータを取得する関数
 * @param id 担当者マスタID
 * @returns {Promise<UsersMasterDialogValues>} - 担当者の詳細情報。取得失敗時は空オブジェクトを返します。
 */
export const getOneUser = async (id: number) => {
  try {
    const { data, error } = await supabase
      .schema('dev2')
      .from('m_user')
      .select('user_nam, del_flg, mem')
      .eq('instance_id', id)
      .single();
    if (!error) {
      console.log('I got a datalist from db', data.del_flg);

      const UserDetails: UsersMasterDialogValues = {
        tantouNam: data.user_nam,
        delFlg: Boolean(data.del_flg),
      };
      console.log(UserDetails.delFlg);
      return UserDetails;
    } else {
      console.error('担当者情報取得エラー。', { message: error.message, code: error.code });
      return emptyUser;
    }
  } catch (e) {
    console.error('例外が発生しました:', e);
    return emptyUser;
  }
};

/**
 * 担当者マスタに新規登録する関数
 * @param data フォームで取得した担当者情報
 */
export const addNewUser = async (data: UsersMasterDialogValues) => {
  console.log(data.tantouNam);

  const query = `
      INSERT INTO m_user (
        user_nam, del_flg, dsp_ord_num,
        add_dat, add_user, upd_dat, upd_user
      )
      VALUES (
        $1, $2,
        (SELECT coalesce(max(dsp_ord_num),0) + 1 FROM m_user),
        $3, $4, $5, $6
      );
    `;

  const date = toJapanTimeString();
  try {
    console.log('DB Connected');
    await pool.query(` SET search_path TO dev2;`);

    await pool.query(query, [data.tantouNam, Number(data.delFlg), date, 'shigasan', null, null]);
    console.log('data : ', data);
  } catch (error) {
    console.log('DB接続エラー', error);
    throw error;
  }
  await revalidatePath('/users-master');
};

/**
 * 担当者マスタの情報を更新する関数
 * @param data フォームに入力されている情報
 * @param id 更新する担当者マスタID
 */
export const updateUser = async (data: UsersMasterDialogValues, id: number) => {
  console.log('Update!!!', data.tantouNam);
  const missingData = {
    user_nam: data.tantouNam,
    del_flg: Number(data.delFlg),
  };
  console.log(missingData.del_flg);
  const date = toJapanTimeString();

  const theData = {
    ...missingData,
    upd_dat: date,
    upd_user: 'test_user',
  };
  console.log(theData.user_nam);

  try {
    const { error: updateError } = await supabase
      .schema('dev2')
      .from('m_user')
      .update({ ...theData })
      .eq('instance_id', id);

    if (updateError) {
      console.error('更新に失敗しました:', updateError.message);
      throw updateError;
    } else {
      console.log('担当者を更新しました : ', theData.del_flg);
    }
  } catch (error) {
    console.log('例外が発生', error);
    throw error;
  }
  revalidatePath('/users-master');
};
