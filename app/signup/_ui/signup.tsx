'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { supabase } from '@/app/_lib/db/supabase';
import { Loading } from '@/app/(main)/_ui/loading';

import { SignupSchema, SignupValues } from '../_lib/types';

export const Signup = () => {
  const router = useRouter();

  // 処理中
  const [isProcessing, setIsProcessing] = useState(false);
  // エラーメッセージ
  const [error, setError] = useState<string>('');

  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(SignupSchema),
    defaultValues: { email: '', password: '', checkPassword: '' },
  });

  const onSubmit = async (data: SignupValues) => {
    if (data.password !== data.checkPassword) {
      setError('パスワードが一致しません。');
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError('セッションが切断されました。再度メールから開き直してください。');
      return;
    }

    if (user?.email === data.email) {
      const { error: updateError } = await supabase.auth.updateUser({ password: data.password });

      if (updateError) {
        setError(`登録に失敗しました: ${updateError.message}`);
      } else {
        await supabase.auth.signOut();
        router.push('/login');
      }
    } else {
      setError('入力されたメールアドレスが登録情報と一致しません。');
    }
  };

  useEffect(() => {
    const handleCallback = async () => {
      const { searchParams } = new URL(window.location.href);
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError('認証コードが無効または期限切れです。');
        }
      } else {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setError('認証セッションが見つかりません。メールのリンクからアクセスしてください。');
        }
      }
      setIsProcessing(false);
    };

    handleCallback();
  }, []);

  if (isProcessing) return <Loading />;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center" width="100%" height="100vh">
        <Typography variant="caption" color="error">
          {error}
        </Typography>

        <Box width={'30%'}>
          <Typography>ログインID（メールアドレス）</Typography>
          <TextFieldElement name="email" control={control} type="email" required fullWidth />
        </Box>
        <Box width={'30%'}>
          <Typography>パスワード</Typography>
          <TextFieldElement name="password" control={control} type="password" required fullWidth />
        </Box>
        <Box width={'30%'}>
          <Typography>パスワードの確認</Typography>
          <TextFieldElement name="checkPassword" control={control} type="password" required fullWidth />
        </Box>
        <Box display="flex" width={'30%'} justifyContent="flex-end">
          <Button type="submit">登録</Button>
        </Box>
      </Stack>
    </form>
  );
};
