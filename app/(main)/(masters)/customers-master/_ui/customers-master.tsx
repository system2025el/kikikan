'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';
import { JSX, SetStateAction, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

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

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    // const newList = await GetFilteredCustomers(data.query!);
    // setTheCustomers(newList);
    console.log('theLocs : ', theCustomers);
  };

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
          <form /*onSubmit={handleSubmit(onSubmit)}*/>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'baseline'}>
                <Typography>顧客キーワード</Typography>
                <TextFieldElement
                  name="query"
                  control={control}
                  helperText={'社名、かな、住所、TEL、FAX、メモから部分一致検索'}
                />
              </Stack>
              <Box alignSelf={'end'}>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Paper>
      <CustomersMasterTable customers={theCustomers} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
