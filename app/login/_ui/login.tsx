import { Button, Stack, TextField, Typography } from '@mui/material';

const Login = () => {
  return (
    <Stack display="flex" justifyContent="center" alignItems="center" bgcolor="lightgray" width="100%" height="100vh">
      <Typography>ログインID（メールアドレス）</Typography>
      <TextField sx={{ bgcolor: 'white', width: '30%' }} size="small"></TextField>
      <Typography marginTop={4}>パスワード</Typography>
      <TextField sx={{ bgcolor: 'white', width: '30%' }} size="small"></TextField>
      <Button variant="contained" href="/new-order" sx={{ marginTop: 4 }}>
        次へ
      </Button>
    </Stack>
  );
};
export default Login;
