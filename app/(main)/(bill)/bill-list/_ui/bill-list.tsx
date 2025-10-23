'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';
import { SetStateAction, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CheckboxButtonGroup, TextFieldElement } from 'react-hook-form-mui';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { BillSearchValues, BillsListTableValues } from '../_lib/types';
import { BillListTable } from './bill-list-table';

export const BillList = ({
  bills,
  selectOptions,
}: {
  bills: BillsListTableValues[];
  selectOptions: { custs: SelectTypes[]; sts: SelectTypes[] };
}) => {
  /* useState ---------------------------------------------------- */
  /* 初期表示用 */
  const [isFirst, setIsFirst] = useState<boolean>(true);
  /* ローディング状態 */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /* ページ  */
  const [page, setPage] = useState<number>(1);

  /* useForm ----------------------------------------------------- */
  const { control, handleSubmit } = useForm<BillSearchValues>({
    defaultValues: {},
  });

  const onSubmit = async (data: BillSearchValues) => {
    console.log(data);
    setIsFirst(false);
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography noWrap>請求検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container direction={'column'} spacing={1} width={'100%'}>
              <Grid2 container display={'flex'} alignItems={'baseline'}>
                <Grid2 size={5} display={'flex'} alignItems={'baseline'}>
                  <Typography noWrap mr={7}>
                    請求番号
                  </Typography>
                  <TextFieldElement name="kokyaku" control={control} type="text" sx={{ width: 200 }} />
                </Grid2>
                <Grid2 display={'flex'} alignItems={'baseline'}>
                  <Typography noWrap mr={3}>
                    請求ステータス
                  </Typography>
                  <TextFieldElement name="kokyaku" control={control} type="text" sx={{ width: 200 }} />
                </Grid2>
              </Grid2>
              <Grid2 display={'flex'} alignItems={'baseline'}>
                <Typography noWrap mr={7}>
                  請求書名
                </Typography>
                <TextFieldElement name="seikyuHeadNam" control={control} />
              </Grid2>
              <Grid2 display={'flex'} alignItems={'baseline'}>
                <Typography noWrap mr={3}>
                  請求書発行日
                </Typography>
                <Controller
                  control={control}
                  name="range.str"
                  render={({ field, fieldState: { error } }) => (
                    <FormDateX
                      value={field.value}
                      onChange={field.onChange}
                      sx={{ mr: 1 }}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <span>～</span>
                <Controller
                  control={control}
                  name="range.end"
                  render={({ field, fieldState: { error } }) => (
                    <FormDateX
                      value={field.value}
                      onChange={field.onChange}
                      sx={{ ml: 1 }}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Grid2>

              <Grid2 container display={'flex'} alignItems={'baseline'}>
                <Grid2 display={'flex'} size={'grow'} alignItems={'baseline'}>
                  <Typography noWrap mr={11}>
                    相手
                  </Typography>
                  <TextFieldElement name="kokyaku" control={control} />
                </Grid2>
                <Grid2 alignSelf={'end'}>
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Grid2>
              </Grid2>
            </Grid2>
          </form>
        </Box>
      </Paper>
      <BillListTable
        bills={bills}
        isLoading={isLoading}
        isFirst={isFirst}
        page={page}
        custs={selectOptions.custs}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
