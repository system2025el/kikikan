'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { supabase } from '@/app/_lib/db/supabase';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { getChosenUser } from '@/app/(main)/(masters)/users-master/_lib/funcs';

import { login, setSession } from '../_lib/funcs';
import { UserSchema, UserValues } from '../_lib/types';

const Login = () => {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const [error, setError] = useState<string>('');

  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(UserSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: UserValues) => {
    console.log(data);
    const { error } = await login(data);
    if (error) {
      setError(`メールアドレスかパスワードがちがいます。${error}`);
    } else {
      const user = await getChosenUser(data.email);
      const storeUser = {
        id: FAKE_NEW_ID,
        name: user.tantouNam,
        email: user.mailAdr,
        permission: user.permission,
      };
      setUser(storeUser);
      router.push('/dashboard');
    } // ログイン後のページへリダイレクト

    // if (true) {
    //   // OKの場合。
    // router.push('/dashboard');
    // } else {
    //   // NGの場合
    // }
  };

  const handleMockClick = () => {
    const mockUser = {
      id: 1,
      name: 'test_user',
      email: 'test@example,com',
      permission: {
        juchu: 0,
        nyushuko: 12,
        masters: 48,
        loginSetting: 128,
        ht: 64,
      },
    };

    setUser(mockUser);
    router.push('/dashboard');
  };

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1)); // '#' を除いてパース！
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      setSession(access_token, refresh_token);
    }
    clearUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center" width="100%" height="100vh">
        <Typography variant="caption" color="error">
          {error}
        </Typography>

        <Box width={'30%'}>
          <Typography>ログインID（メールアドレス）</Typography>
          {/* <TextFieldElement name="email" control={control} type="email" required fullWidth /> */}
          <TextField type="email" fullWidth />
        </Box>
        <Box width={'30%'}>
          <Typography>パスワード</Typography>
          {/* <TextFieldElement name="password" control={control} type="password" required fullWidth /> */}
          <TextField type="password" fullWidth />
        </Box>
        <Box display="flex" width={'30%'} justifyContent="flex-end">
          {/* <Button type="submit">次へ</Button> */}
          <Button onClick={handleMockClick}>次へ</Button>
        </Box>
      </Stack>
    </form>
  );
};
export default Login;
