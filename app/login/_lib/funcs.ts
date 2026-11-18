'use server';

import { createClient } from '@/app/_lib/db/supabase-server';
import { logError } from '@/app/_lib/log-error';

// import { supabase } from '@/app/_lib/db/supabase-server';
import { UserValues } from './types';

/**
 * supabase ログイン処理
 * @param {UserValues} data
 * @returns {Promise<AuthTokenResponsePassword>} ログイン処理結果
 */
export const login = async (data: UserValues) => {
  try {
    const supabase = await createClient();
    // 2. 取り出したインスタンスに対して .auth を呼び出す
    return await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
  } catch (e) {
    logError(e);
    throw e;
  }
};
