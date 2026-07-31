'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

// import { supabase } from '@/app/_lib/db/supabase';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';

import { signup } from '../_lib/funcs';
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

    setIsProcessing(true);
    setError('');

    try {
      const result = await signup(data.password, data.email);

      if (result.error) {
        setError(result.error);
        setIsProcessing(false);
      } else {
        router.replace('/login');
      }
    } catch (e) {
      setError('通信エラーが発生しました。');
      setIsProcessing(false);
    }

    // const {
    //   data: { user },
    //   error: userError,
    // } = await supabase.auth.getUser();

    // if (userError || !user) {
    //   setError('セッションが切断されました。再度メールから開き直してください。');
    //   return;
    // }

    // if (user?.email === data.email) {
    //   const { error: updateError } = await supabase.auth.updateUser({ password: data.password });

    //   if (updateError) {
    //     setError(`登録に失敗しました: ${updateError.message}`);
    //   } else {
    //     await supabase.auth.signOut();
    //     router.replace('/login');
    //   }
    // } else {
    //   setError('入力されたメールアドレスが登録情報と一致しません。');
    // }
  };

  // useEffect(() => {
  //   const supabase = createClient();

  //   const handleAuth = async () => {
  //     // 1. URLのハッシュを取得
  //     const hash = window.location.hash;
  //     if (!hash) {
  //       console.log('URLにハッシュがありません');
  //       return;
  //     }

  //     // 2. ハッシュから access_token と refresh_token を抽出
  //     const params = new URLSearchParams(hash.substring(1));
  //     const accessToken = params.get('access_token');
  //     const refreshToken = params.get('refresh_token');

  //     if (accessToken && refreshToken) {
  //       console.log('ハッシュからトークンを抽出しました。セットします...');

  //       // 3. SDKにセッションを強制セット
  //       const { data, error } = await supabase.auth.setSession({
  //         access_token: accessToken,
  //         refresh_token: refreshToken,
  //       });

  //       if (error) {
  //         console.error('セッションセット失敗:', error.message);
  //       } else {
  //         console.log('セッションセット成功！イベントを確認します...');
  //         // ここで F12 の Cookie / LocalStorage を確認してください
  //       }
  //     }
  //   };

  //   handleAuth();
  // }, []);

  if (isProcessing) return <LoadingOverlay />;

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
