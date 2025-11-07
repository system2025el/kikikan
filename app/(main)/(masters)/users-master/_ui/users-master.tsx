'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, Typography } from '@mui/material';
import { JSX, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '../../../_ui/buttons';
import { getFilteredUsers } from '../_lib/funcs';
import { UsersMasterTableValues } from '../_lib/types';
import { UserssMasterTable } from './users-master-table';

/**
 * 担当者マスタ画面
 * @returns {JSX.Element} 担当者マスタ画面コンポーネント
 */
export const UsersMaster = ({ users }: { users: UsersMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  /** 表示する担当者の配列 */
  const [theUsers, setTheUsers] = useState(users);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* methods ------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredUsers(data.query!);
    setPage(1);
    setTheUsers(newList);
    console.log('theLocs : ', theUsers);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>担当者マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'baseline'}>
                <Typography>担当者名キーワード</Typography>
                <TextFieldElement name="query" control={control} helperText={'名前の部分一致検索'} />
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
      <UserssMasterTable
        users={theUsers}
        isLoading={isLoading}
        page={page}
        searchParams={getValues()}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
