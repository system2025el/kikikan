'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useRouter } from 'next/navigation';
import { TextFieldElement, useForm } from 'react-hook-form-mui';
import Column from 'rsuite/esm/Table/TableColumn';

import { UserSchema, UserValues } from '../_lib/types';

const Login = () => {
  const router = useRouter();

  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(UserSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: UserValues) => {
    console.log(data);
    // if (true) {
    //   // OKの場合。
    router.push('/dashboard');
    // } else {
    //   // NGの場合
    // }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="column" spacing={4} justifyContent="center" alignItems="center" width="100%" height="100vh">
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
          <Button /*type="submit"*/ href="/dashboard">次へ</Button>
        </Box>
      </Stack>
    </form>
  );
};
export default Login;
