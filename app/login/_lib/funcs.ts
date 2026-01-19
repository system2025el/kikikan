'use server';

import { supabase } from '@/app/_lib/db/supabase';

import { UserValues } from './types';

/**
 * supabase ログイン処理
 * @param {UserValues} data
 * @returns {Promise<AuthTokenResponsePassword>} ログイン処理結果
 */
export const login = async (data: UserValues) => {
  // try {
  //   return await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
  // } catch (e) {
  //   console.error(e);
  //   throw e;
  // }
  try {
    // 2. 取り出したインスタンスに対して .auth を呼び出す
    return await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
  } catch (e) {
    console.error(e);
    throw e;
  }
};

/**
 * supabase セッションのセット処理
 * @param {string} access_token
 * @param {string} refresh_token
 */
export const setSession = async (access_token: string, refresh_token: string) => {
  supabase.auth.setSession({ access_token, refresh_token }).then(({ data, error }) => {
    if (data.session) {
      return data.session;
    }
  });
};

/* ログアウトクリック時 */
export const handleLogout = async () => {
  await supabase.auth.signOut();
};
