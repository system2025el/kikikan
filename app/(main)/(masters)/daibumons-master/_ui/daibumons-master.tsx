'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { getFilteredDaibumons } from '../_lib/funcs';
import { DaibumonsMasterDialogValues, DaibumonsMasterTableValues } from '../_lib/types';
import { DaibumonsMasterTable } from './daibumons-master-table';

/**
 * 大部門マスタ画面
 * @param {daibumons} 大部門リスト
 * @returns {JSX.Element} 大部門マスタコンポーネント
 */
export const DaibumonsMaster = ({ daibumons }: { daibumons: DaibumonsMasterTableValues[] | undefined }) => {
  /* useState ------------------------------------- */
  /** 表示する大部門の配列 */
  const [theDaibumons, setTheDaibumons] = useState(daibumons);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------------------------ */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* methods ------------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query?: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredDaibumons(data.query!);
    setPage(1);
    setTheDaibumons(newList);
    console.log('theLocs : ', theDaibumons, '検索終了検索終了');
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>大部門マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'baseline'}>
                <Typography noWrap width={200}>
                  大部門名キーワード
                </Typography>
                <TextFieldElement name="query" control={control} helperText={''} />
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
      <DaibumonsMasterTable
        daibumons={theDaibumons}
        page={page}
        isLoading={isLoading}
        setPage={setPage}
        setIsLoading={setIsLoading}
      />
    </Container>
  );
};
