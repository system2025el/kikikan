'use server';

import { supabase } from '@/app/_lib/db/supabase';
import { deleteLock, insertLock, selectLock, updateLock } from '@/app/_lib/db/tables/t-lock';

import { LockValues } from './types';

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
    console.error(e);
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
    console.error(e);
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
    console.error(e);
    throw e;
  }
};

/**
 * ロック情報削除
 * @param lockShubetu ロック種別
 * @param headId ヘッダーid
 */
export const delLock = async (lockShubetu: number, headId: number) => {
  try {
    const { error } = await deleteLock(lockShubetu, headId);

    if (error) {
      throw new Error('[deleteLock] DBエラー:', { cause: error });
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * セッション情報確認
 * @returns
 */
export const sessionCheck = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
};
