'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { BackButton } from '../../../_ui/buttons';
import { BumonsMasterDialogValues, BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterTable } from './bumons-master-table';
/**
 * 部門マスタ画面
 * @param {bumons} 部門リスト
 * @returns {JSX.Element} 部門マスタコンポーネント
 */

export const BumonsMaster = ({ bumons }: { bumons: BumonsMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theBumons, setTheBumons] = useState(bumons);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '', daibumonQuery: '', shukeiQuery: '' },
  });

  /* 検索ボタン押下 */
  const onSubmit = async (data: {
    query: string | undefined;
    daibumonQuery: string | undefined;
    shukeiQuery: string | undefined;
  }) => {
    setIsLoading(true);
    console.log('data : ', data);
    // const newList = await getFilteredBumons(data.query!);
    // setTheBumons(newList);
    console.log('theLocs : ', theBumons);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>部門マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <Stack>
            <Typography variant="body2">検索</Typography>
          </Stack>
          <form /*onSubmit={handleSubmit(onSubmit)}*/>
            <Stack alignItems={'center'}>
              <Typography noWrap width={100}>
                部門名
              </Typography>
              <TextFieldElement name="query" control={control} />
            </Stack>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack mt={1} spacing={1}>
                <Typography noWrap width={100}>
                  大部門名
                </Typography>
                <SelectElement name="daibumonQuery" control={control} sx={{ width: 250 }} />
                <Box width={50}></Box>
                <Typography noWrap width={100}>
                  集計部門名
                </Typography>
                <SelectElement name="shukeiQuery" control={control} sx={{ width: 250 }} />
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
      <BumonsMasterTable bumons={theBumons} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
