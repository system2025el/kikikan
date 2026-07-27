'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertTitle, Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

// import { supabase } from '@/app/_lib/db/supabase';
import { serverErrorLog } from '@/app/_lib/funcs';
import { getChosenUser } from '@/app/(main)/(masters)/users-master/_lib/funcs';

import { login } from '../_lib/funcs';
import { UserSchema, UserValues } from '../_lib/types';

const Login = () => {
  const router = useRouter();
  // const user = useUserStore((state) => state.user);
  const searchParams = useSearchParams();

  const [error, setError] = useState<string>('');
  // const [isHydrated, setIsHydrated] = useState(false);

  const authErrorMessage = useMemo(() => {
    const errorType = searchParams.get('error');
    if (!errorType) return null;

    const messages: Record<string, { title: string; body: string }> = {
      verify_fail: {
        title: '認証に失敗しました',
        body: '招待リンクの期限が切れているか、既に使用されています。\n管理者に再送を依頼してください。',
      },
      auth_code_error: {
        title: 'アクセス権限エラー',
        body: '認証コードが無効です。\nもう一度最初からやり直してください。',
      },
      unexpected: {
        title: 'システムエラー',
        body: '一時的な問題が発生しました。\n管理者へお問い合わせください。',
      },
    };

    return messages[errorType] || { title: 'エラー', body: '予期せぬエラーが発生しました。' };
  }, [searchParams]);

  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(UserSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: UserValues) => {
    try {
      const { error } = await login(data);
      // const { error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (error) {
        const errorLog = new Error('[supabase.auth.signInWithPassword] DBエラー');
        serverErrorLog(errorLog.message);
        setError('メールアドレスかパスワードがちがいます。');
        return;
      }
      const user = await getChosenUser(data.email);
      if (!user) {
        setError('メールアドレスかパスワードがちがいます。');
      } else {
        router.refresh();
        router.push('/dashboard');
      } // ログイン後のページへリダイレクト
    } catch (e) {
      const errorLog = e as Error;
      await serverErrorLog(errorLog.message);
      setError(`ログインに失敗しました。`);
    }

    // if (true) {
    //   // OKの場合。
    // router.push('/dashboard');
    // } else {
    //   // NGの場合
    // }
  };

  const handleMockClick = () => {
    const mockUser = {
      id: '1',
      name: 'test_user',
      email: 'test@example,com',
      permission: {
        juchu: 3,
        nyushuko: 12,
        masters: 48,
        loginSetting: 128,
        ht: 64,
        schedule: 256,
      },
    };

    router.push('/dashboard');
  };

  // useEffect(() => {
  //   // const hash = window.location.hash;
  //   // const params = new URLSearchParams(hash.slice(1)); // '#' を除いてパース！
  //   // const access_token = params.get('access_token');
  //   // const refresh_token = params.get('refresh_token');
  //   // if (access_token && refresh_token) {
  //   //   setSession(access_token, refresh_token);
  //   // }
  //   const initializeAuth = async () => {
  //     // await handleLogout();
  //     await supabase.auth.signOut();
  //     clearUser();
  //   };
  //   initializeAuth();
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  useEffect(() => {
    const MIGRATION_KEY = 'auth_migration';

    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(MIGRATION_KEY)) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
      localStorage.removeItem('user-storage');
      localStorage.setItem(MIGRATION_KEY, 'true');
    }

    // const checkAndClear = async () => {
    //   const session = await sessionCheck();

    //   if (!session) {
    //     await handleLogout();
    //     clearUser();
    //   }
    // };
    // checkAndClear();
  }, []);

  // useEffect(() => {
  //   if (!isHydrated) return;
  //   const checkUser = async () => {
  //     const {
  //       data: { user: authUser },
  //     } = await supabase.auth.getUser();
  //     if (authUser && user) {
  //       router.push('/dashboard');
  //     }
  //   };
  //   checkUser();
  // }, [isHydrated, user, router, clearUser]);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center" width="100%" height="100vh">
        {authErrorMessage && (
          <Box width="30%">
            <Alert severity="error" variant="outlined" sx={{ whiteSpace: 'pre-line' }}>
              <AlertTitle>{authErrorMessage.title}</AlertTitle>
              {authErrorMessage.body}
            </Alert>
          </Box>
        )}
        <Typography variant="caption" color="error">
          {error}
        </Typography>

        <Box width={'30%'}>
          <Typography>ログインID（メールアドレス）</Typography>
          <TextFieldElement name="email" control={control} type="email" required fullWidth />
          {/* <TextField type="email" fullWidth /> */}
        </Box>
        <Box width={'30%'}>
          <Typography>パスワード</Typography>
          <TextFieldElement name="password" control={control} type="password" required fullWidth />
          {/* <TextField type="password" fullWidth /> */}
        </Box>
        <Box display="flex" width={'30%'} justifyContent="flex-end">
          <Button type="submit">次へ</Button>
          {/* <Button onClick={handleMockClick}>次へ</Button> */}
        </Box>
      </Stack>
    </form>
  );
};
export default Login;
