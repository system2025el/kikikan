'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';
import { JSX, SetStateAction, useState } from 'react';

import { BackButton } from '../../../_ui/buttons';
import { CustomerMasterTableValues } from '../_lib/types';
import { CustomersMasterTable } from './customers-master-table';
/**
 * 顧客マスタ画面
 * @returns {JSX.Element} 顧客マスタ画面コンポーネント
 */
export const CustomersMaster = ({ customers }: { customers: CustomerMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theCustomers, setTheCustomers] = useState(customers);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>顧客マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack>
                <Typography noWrap>顧客キーワード</Typography>
                <TextField />
                <Typography noWrap variant="body2">
                  社名、かな、住所、TEL、FAX、メモから部分一致検索
                </Typography>
              </Stack>
              <Box>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
          <Typography></Typography>
        </Box>
      </Paper>
      <CustomersMasterTable customers={theCustomers} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
