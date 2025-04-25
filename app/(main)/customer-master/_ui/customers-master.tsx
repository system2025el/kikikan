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
        <Button variant="contained">あ</Button>
        <Button variant="contained">か</Button>
        <Button variant="contained">さ</Button>
        <Button variant="contained">た</Button>
        <Button variant="contained">な</Button>
        <Button variant="contained">は</Button>
        <Button variant="contained">ま</Button>
        <Button variant="contained">や</Button>
        <Button variant="contained">ら</Button>
        <Button variant="contained">わ</Button>
        <Button variant="contained">英数</Button>
        <Button variant="contained">全て</Button>

        <TextField fullWidth placeholder="検索" size="small"></TextField>
      </Stack>
    </Paper>
  );
};
