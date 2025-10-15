'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, Grid2, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { toISOStringYearMonthDay } from '../../_lib/date-conversion';
import { TestDate } from '../../_ui/date';
import { Loading } from '../../_ui/loading';
import { IdoListTable } from './ido-list-table';

export const IdoList = () => {
  const [isLoading, setIsLoading] = useState(false);

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      idoDat: new Date(),
    },
  });

  /**
   * 検索ボタン押下
   * @param data 検索データ(受注番号、出庫日、出庫場所)
   */
  const onSubmit = async (data: { idoDat: Date }) => {
    console.log(toISOStringYearMonthDay(data.idoDat));
    setIsLoading(true);
    setIsLoading(false);
  };

  return (
    <Box>
      <Paper variant="outlined">
        <Box alignItems="center" p={2}>
          <Typography>移動検索</Typography>
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} p={2} spacing={4}>
            <Box display={'flex'} alignItems={'center'} width={'fit-content'}>
              <Typography mr={2}>移動日</Typography>
              <Controller
                name="idoDat"
                control={control}
                render={({ field, fieldState }) => (
                  <TestDate
                    onBlur={field.onBlur}
                    date={field.value}
                    onChange={(newDate) => field.onChange(newDate?.toDate())}
                    fieldstate={fieldState}
                  />
                )}
              />
            </Box>
            <Button type="submit">
              <SearchIcon fontSize="small" />
              検索
            </Button>
          </Grid2>
        </form>
        <Divider />
        {isLoading ? (
          <Loading />
        ) : (
          <Box width={'100%'} mt={4}>
            <IdoListTable /*datas={IdoList}*/ />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
