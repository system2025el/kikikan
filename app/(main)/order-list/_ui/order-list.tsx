'use client';

import 'dayjs/locale/ja';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { DatePicker, DateValidationError, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RadioButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { BackButton } from '../../_ui/buttons';
import { FormDateX } from '../../_ui/date';
import { selectNone, SelectTypes } from '../../_ui/form-box';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { radioData } from '../_lib/datas';
import { getFilteredOrderList } from '../_lib/funcs';
import { OrderListTableValues, OrderSearchValues } from '../_lib/types';
import { OrderTable } from './order-table';

/** 受注一覧画面 */
export const OrderList = ({
  orders,
  customers,
}: {
  orders: OrderListTableValues[] | undefined;
  customers: SelectTypes[] | undefined;
}) => {
  /* useState -------------------------------------------- */
  /* 受注一覧 */
  const [orderList, setOrderList] = useState<OrderListTableValues[]>(orders ?? []);
  /* テーブルのページ */
  const [page, setPage] = useState(1);
  /* ローディングかどうか */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------------------------------ */
  const { control, handleSubmit, watch } = useForm<OrderSearchValues>({
    defaultValues: {
      criteria: 1,
      selectedDate: { value: '1', range: { from: null, to: null } },
      customer: FAKE_NEW_ID,
      listSort: { sort: 'shuko', order: 'asc' },
      stageName: '',
      orderStartDate: null,
      orderFinishDate: null,
    },
  });
  const selectedDateValue = watch('selectedDate.value');

  /* methods ---------------------------------------- */
  /* 検索押下時の処理 */
  const onSubmit = async (data: OrderSearchValues) => {
    setIsLoading(true);
    setPage(1);
    const orders = await getFilteredOrderList(data);
    if (orders) {
      setOrderList(orders);
      setIsLoading(false);
    }
    setIsLoading(false);
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
          <Typography>受注検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container spacing={1}>
              <Grid2>
                <SelectElement
                  name="criteria"
                  label="検索条件"
                  control={control}
                  options={[
                    { id: 1, label: '出庫日が' },
                    { id: 2, label: '入庫日が' },
                    { id: 3, label: '受注日が' },
                  ]}
                  sx={{ bgcolor: 'white', minWidth: 150 }}
                />
              </Grid2>
              <Grid2 container direction={'row'} alignItems={'center'} ml={1}>
                <RadioButtonGroup control={control} name="selectedDate.value" options={radioData} row />
                {selectedDateValue === '7' && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Controller
                      control={control}
                      name="selectedDate.range.from"
                      render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} />}
                    />
                    <span>～</span>
                    <Controller
                      control={control}
                      name="selectedDate.range.to"
                      render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} />}
                    />
                  </Stack>
                )}
              </Grid2>

              <Grid2 container width={'100%'}>
                <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 5 }}>
                  <Typography noWrap minWidth={110}>
                    顧客
                  </Typography>
                  <Controller
                    name="customer"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} sx={{ width: 250 }}>
                        {[selectNone, ...(customers ?? [])].map((opt) => (
                          <MenuItem
                            key={opt.id}
                            value={opt.id}
                            sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                          >
                            {opt.label}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} size={{ md: 'grow' }}>
                  <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 3 }}>
                    <Typography noWrap minWidth={110}>
                      ソート
                    </Typography>
                  </Grid2>
                  <Grid2 size={{ sm: 12, md: 3 }}>
                    <SelectElement
                      name="listSort.sort"
                      control={control}
                      options={[
                        { id: 'shuko', label: '出庫日' },
                        { id: 'nyuko', label: '入庫日' },
                        { id: 'juchuId', label: '受注番号' },
                        { id: 'juchuDat', label: '受注日' },
                        { id: 'koenNam', label: '作品名 (公演名)' },
                        { id: 'kokyakuNam', label: '顧客名' },
                      ]}
                      sx={{ minWidth: 150 }}
                    />
                  </Grid2>
                  <Grid2 size={{ sm: 12, md: 'grow' }}>
                    <RadioButtonGroup
                      control={control}
                      name="listSort.order"
                      options={[
                        { id: 'asc', label: '昇順' },
                        { id: 'desc', label: '降順' },
                      ]}
                      row
                    />
                  </Grid2>
                </Grid2>
              </Grid2>

              <Grid2 container spacing={1} width={'100%'}>
                <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 5 }}>
                  <Typography noWrap minWidth={110}>
                    公演名
                  </Typography>
                  <TextFieldElement name="stageName" control={control} sx={{ minWidth: 250 }} />
                </Grid2>
                <Grid2 container size={{ sm: 12, md: 'grow' }}>
                  <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 3 }}>
                    <Typography>受注開始日～終了日</Typography>
                  </Grid2>
                  <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 'grow' }}>
                    <Controller
                      control={control}
                      name="orderStartDate"
                      rules={{
                        validate: (value) => {
                          return value === null || value instanceof Date || '日付が正しくありません';
                        },
                      }}
                      render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} />}
                    />
                    ～
                    <Controller
                      control={control}
                      name="orderFinishDate"
                      rules={{
                        validate: (value) => {
                          return value === null || value instanceof Date || '日付が正しくありません';
                        },
                      }}
                      render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} />}
                    />
                  </Grid2>
                </Grid2>
              </Grid2>
            </Grid2>
            <Box mt={1} alignSelf={'end'} justifySelf={'end'}>
              <Button type="submit">
                <SearchIcon />
                検索
              </Button>
            </Box>
          </form>
        </Box>
      </Paper>
      <OrderTable
        orderList={orderList}
        isLoading={isLoading}
        page={page}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
