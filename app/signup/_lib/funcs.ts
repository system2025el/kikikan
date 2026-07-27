'use server';

import { createClient } from '@/app/_lib/db/supabase-server';

export const signup = async (password: string, email: string) => {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'セッションが切断されました。' };
  if (user.email !== email) return { error: 'メールアドレスが一致しません。' };
  if (user.user_metadata?.setup_completed !== false) return { error: '既にパスワードは設定済みです。' };

  // パスワード更新
  const { error: updateError } = await supabase.auth.updateUser({
    password: password,
    data: { setup_completed: true },
  });
  if (updateError) return { error: updateError.message };

  // サインアウト（Cookie破棄）
  await supabase.auth.signOut();

  return { success: true };
};
