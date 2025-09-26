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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const { control, handleSubmit } = useForm<BillSearchValues>({
    defaultValues: {},
  });

  const onSubmit = async (data: BillSearchValues) => {
    console.log(data);
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography noWrap>請求検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container direction={'column'} spacing={1} width={'100%'}>
              <Grid2 container size={'grow'} display={'flex'} alignItems={'baseline'}>
                <Grid2 size={3} display={'flex'} alignItems={'baseline'}>
                  <Typography noWrap mr={5}>
                    請求番号
                  </Typography>
                  <TextFieldElement name="kokyaku" control={control} type="text" sx={{ width: 200 }} />
                </Grid2>
                <Grid2 size={'grow'} display={'flex'} alignItems={'baseline'}>
                  <Typography noWrap mr={3}>
                    請求ステータス
                  </Typography>
                  <TextFieldElement name="kokyaku" control={control} type="text" sx={{ width: 200 }} />
                </Grid2>
                <Grid2></Grid2>
              </Grid2>

              <Grid2 size={'auto'} display={'flex'} alignItems={'baseline'}>
                <Typography noWrap mr={1}>
                  請求書発行日
                </Typography>

                <Controller
                  control={control}
                  name="range.str"
                  render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} sx={{ mr: 1 }} />}
                />
                <span>～</span>
                <Controller
                  control={control}
                  name="range.end"
                  render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} sx={{ ml: 1 }} />}
                />
              </Grid2>
              <Grid2 display={'flex'} size={'grow'} alignItems={'baseline'}>
                <Typography noWrap mr={9}>
                  相手
                </Typography>
                <TextFieldElement name="kokyaku" control={control} />
              </Grid2>
              <Grid2 container size={12} display={'flex'} alignItems={'baseline'}>
                <Grid2 display={'flex'} size={'grow'} alignItems={'baseline'}>
                  <Typography noWrap mr={3}>
                    相手担当者
                  </Typography>
                  <TextFieldElement name="kokyakuTantoNam" control={control} />
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
        page={page}
        custs={selectOptions.custs}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
