import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import Column from 'rsuite/esm/Table/TableColumn';

const Login = () => {
  return (
    <Stack
      direction="column"
      spacing={4}
      justifyContent="center"
      bgcolor={grey[300]}
      alignItems="center"
      width="100%"
      height="100vh"
    >
      <Box width={'30%'}>
        <Typography>ログインID（メールアドレス）</Typography>
        <TextField sx={{ bgcolor: 'white', width: '100%' }}></TextField>
      </Box>
      <Box width={'30%'}>
        <Typography>パスワード</Typography>
        <TextField sx={{ bgcolor: 'white', width: '100%' }}></TextField>
      </Box>
      <Box display="flex" width={'30%'} justifyContent="flex-end">
        <Button href="/dashboard">次へ</Button>
      </Box>
    </Stack>
  );
};
export default Login;
