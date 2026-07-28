'use server';

// import { supabase } from '@/app/_lib/db/supabase';
import { cache } from 'react';

import { createClient } from '@/app/_lib/db/supabase-server';
import { selectDic } from '@/app/_lib/db/tables/m-dic';
import { deleteLock, insertLock, selectLock, updateLock } from '@/app/_lib/db/tables/t-lock';

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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
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
    if (e instanceof Error) {
      console.error(`[ERROR] ${e.message}`);
      if (e.cause) {
        console.error(`[CAUSE]`, e.cause);
      }
    } else {
      console.error(e);
    }
    throw e;
  }
};

/**
 * セッション情報確認
 * @returns
 */
export const sessionCheck = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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
