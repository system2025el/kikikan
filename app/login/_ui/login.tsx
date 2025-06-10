'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { TextFieldElement, useForm } from 'react-hook-form-mui';
import Column from 'rsuite/esm/Table/TableColumn';

import { UserSchema } from '../_lib/types';

const Login = () => {
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(UserSchema),
    defaultValues: { email: '', password: '' },
  });
  return (
    <Stack direction="column" spacing={4} justifyContent="center" alignItems="center" width="100%" height="100vh">
      <Box width={'30%'}>
        <Typography>ログインID（メールアドレス）</Typography>
        <TextFieldElement name="email" control={control} type="email" required fullWidth />
      </Box>
      <Box width={'30%'}>
        <Typography>パスワード</Typography>
        <TextFieldElement name="password" control={control} type="password" required fullWidth />
      </Box>
      <Box display="flex" width={'30%'} justifyContent="flex-end">
        <Button type="submit">次へ</Button>
      </Box>
    </Stack>
  );
};
export default Login;
