'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, Grid2, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { toISOStringYearMonthDay, toJapanDateString } from '../../_lib/date-conversion';
import { TestDate } from '../../_ui/date';
import { Loading } from '../../_ui/loading';
import { getIdoList } from '../_lib/funcs';
import { IdoTableValues } from '../_lib/types';
import { IdoListTable } from './ido-list-table';

export const IdoList = (props: { idoData: IdoTableValues[] }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [idoList, setIdoList] = useState<IdoTableValues[]>(props.idoData);

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
    setIsLoading(true);

    const idoData = await getIdoList(toJapanDateString(data.idoDat, '-'));
    if (idoData) {
      setIdoList(idoData);
    }

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
            <IdoListTable datas={idoList} />
          </Box>
        )}
      </Paper>
    </Box>
  );
};
