'use server';

// import { supabase } from '@/app/_lib/db/supabase';
import { cache } from 'react';

import { createClient } from '@/app/_lib/db/supabase-server';
import { selectDic } from '@/app/_lib/db/tables/m-dic';
import { selectOneCustomer } from '@/app/_lib/db/tables/m-kokyaku';
import { insertLock, selectLock, updateLock } from '@/app/_lib/db/tables/t-lock';
import { logError } from '@/app/_lib/log-error';

// import { User } from '@/app/_lib/stores/usestore';
import { getChosenUser } from '../(masters)/users-master/_lib/funcs';
import { LockValues, User } from './types';

/**
 * インデント文字取得
 * @param dicId 辞書id
 * @returns
 */
export const getDic = async (dicId: number) => {
  try {
    const { data, error } = await selectDic(dicId);

    if (error) {
      if (error.code === 'PGRST116') {
        return '';
      }
      throw new Error('[selectDic] DBエラー:', { cause: error });
    }

    return data.dic_val as string;
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * PDF出力の際に、顧客（請求先）の敬称を取得する
 * 出庫・入庫・請求のPDFで使う（請求の画面からは Server Action として直接呼ぶ）
 * @param kokyakuId 顧客id
 * @returns 敬称（未設定なら空文字）
 */
export const getKeisho = async (kokyakuId: number) => {
  try {
    const { data, error } = await selectOneCustomer(kokyakuId);
    if (error) {
      throw new Error('[selectOneCustomer] DBエラー:', { cause: error });
    }
    return data.keisho ?? '';
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * ロック情報取得
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 * @returns ロックデータ
 */
export const getLock = async (lockShubetu: number, headId: number) => {
  try {
    const { data, error } = await selectLock(lockShubetu, headId);

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error('[selectLock] DBエラー:', { cause: error });
    }
    const lockData: LockValues = {
      lockShubetu: data.lock_shubetu,
      headId: data.head_id,
      addDat: data.add_dat ?? '',
      addUser: data.add_user ?? '',
      mail_adr: data.mail_adr ?? '',
    };
    return lockData;
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * ロック情報追加
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const addLock = async (lockShubetu: number, headId: number, date: string, userNam: string, mailAdr: string) => {
  const lockData = {
    lock_shubetu: lockShubetu,
    head_id: headId,
    add_dat: date,
    add_user: userNam,
    mail_adr: mailAdr,
  };

  try {
    const { error } = await insertLock(lockData);

    if (error) {
      throw new Error('[insertLock] DBエラー:', { cause: error });
    }
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * ロック情報更新
 * @param lockShubetu
 * @param headId
 * @param userNam
 * @param mailAdr
 */
export const updLock = async (lockShubetu: number, headId: number, date: string, userNam: string, mailAdr: string) => {
  const lockData = {
    lock_shubetu: lockShubetu,
    head_id: headId,
    add_dat: date,
    add_user: userNam,
    mail_adr: mailAdr,
  };

  try {
    const { error } = await updateLock(lockData);
    if (error) {
      throw new Error('[updateLock] DBエラー:', { cause: error });
    }
  } catch (e) {
    logError(e);
    throw e;
  }
};

/**
 * ログアウト処理
 */
export const logout = async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error(error);
    throw new Error('[supabase.auth.signOut] DBエラー:', { cause: error });
  }
};

/**
 * 現在のユーザー情報を取得
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const data = await getChosenUser(authUser.email!);
  if (!data) return null;

  const user: User = {
    id: data.shainCod ?? '',
    name: data.tantouNam,
    email: data.mailAdr,
    permission: data.permission,
  };

  return user;
});
