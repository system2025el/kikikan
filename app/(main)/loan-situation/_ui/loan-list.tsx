'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { BackButton } from '../../_ui/buttons';
import { getFilteredEqpts } from '../_lib/funcs';
import { LoanEqTableValues } from '../_lib/types';
import { LoanListTable } from './loan-list-table';

export const LoanList = ({ eqpts }: { eqpts: LoanEqTableValues[] | undefined }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<LoanEqTableValues[]>(eqpts ?? []);

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* 検索ボタン押下時 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredEqpts(data.query!);
    setPage(1);
    setRows(newList);
    console.log('newList : ', newList);
    setIsLoading(false);
  };

  // 行移動
  // const moveRow = (index: number, direction: number) => {
  //   console.log(index);
  //   const newIndex = index + direction;
  //   if (newIndex < 0 || newIndex >= rows.length) return;

  //   const updatedRows = [...rows];
  //   [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
  //   setRows(updatedRows);
  // };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      {/*貸出状況検索*/}
      <Paper variant="outlined">
        <Grid2 container spacing={2} alignItems="center" p={2}>
          <Typography>貸出状況</Typography>
          <Typography>機材検索</Typography>
        </Grid2>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} p={2} spacing={2}>
            <Grid2 container display={'flex'} alignItems={'center'}>
              <Typography>受注機材名キーワード</Typography>
              <TextFieldElement name="query" control={control} />
            </Grid2>
            <Button type="submit">
              <SearchIcon fontSize="small" />
              検索
            </Button>
          </Grid2>
        </form>
      </Paper>
      <LoanListTable
        datas={rows}
        page={page}
        isLoading={isLoading}
        setPage={setPage}
        /*moveRow={moveRow}*/
      />
    </Box>
  );
};
