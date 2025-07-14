'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';
import { JSX, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '../../../_ui/buttons';
import { ManagersMasterDialogValues, ManagersMasterTableValues } from '../_lib/types';
import { ManagerssMasterTable } from './managers-master-table';
/**
 * 担当者マスタ画面
 * @returns {JSX.Element} 担当者マスタ画面コンポーネント
 */
export const ManagersMaster = ({ managers }: { managers: ManagersMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theManagers, setTheManagers] = useState(managers);
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
    // const newList = await GetFilteredManagers(data.query!);
    // setTheManagers(newList);
    console.log('theLocs : ', theManagers);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>担当者マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form /*onSubmit={handleSubmit(onSubmit)}*/>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'baseline'}>
                <Typography>担当者キーワード</Typography>
                <TextFieldElement name="query" control={control} helperText={'～から部分一致検索'} />
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
      <ManagerssMasterTable managers={theManagers} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
