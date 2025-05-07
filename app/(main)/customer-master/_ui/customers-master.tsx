'use client';
import { Button, Paper, Stack, TextField, Typography, useMediaQuery } from '@mui/material';
import { grey } from '@mui/material/colors';

import { CustomersTableHead } from './customers-tableui';

export const CustomersMaster = () => {
  return (
    <>
      <SearchArea />
      <CustomersTableHead />
    </>
  );
};

const SearchArea = () => {
  return (
    <Paper sx={{ p: 1, m: 1, bgcolor: grey[300] }} variant="outlined">
      <Typography variant="body1">検索条件</Typography>
      <Stack direction={'row'} justifyContent={'space-between'} spacing={1}>
        <Button>あ</Button>
        <Button>か</Button>
        <Button>さ</Button>
        <Button>た</Button>
        <Button>な</Button>
        <Button>は</Button>
        <Button>ま</Button>
        <Button>や</Button>
        <Button>ら</Button>
        <Button>わ</Button>
        <Button>英数</Button>
        <Button>全て</Button>

        <TextField fullWidth placeholder="検索"></TextField>
      </Stack>
    </Paper>
  );
};
