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
import { selectNone } from '../../_ui/form-box';
import { getFilteredOrderList } from '../_lib/funcs';
import { OrderListTableValues, OrderSearchValues } from '../_lib/types';
import { OrderTable } from './order-table';

/** 受注一覧画面 */
export const OrderList = ({
  orders,
  customers,
}: {
  orders: OrderListTableValues[] | undefined;
  customers: { kokyakuId: number; kokyakuNam: string }[] | undefined;
}) => {
  /* useState -------------------------------------------- */
  /* 受注一覧 */
  const [orderList, setOrderList] = useState<OrderListTableValues[]>(orders ? orders : []);
  /* テーブルのページ */
  const [page, setPage] = useState(1);
  /* ローディングかどうか */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------------------------------ */
  const { control, handleSubmit, watch } = useForm<OrderSearchValues>({
    mode: 'onBlur',
    defaultValues: {
      criteria: 1,
      selectedDate: { value: '1', range: { from: null, to: null } },
      customer: 0,
      customerSort: '1',
      stageName: '',
      orderStartDate: null,
      orderFinishDate: null,
    },
  });
  const sortOrder = watch('customerSort');

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

  // 検索条件のラジオボタンとdatepickerを制御
  const selectedDateValue = watch('selectedDate.value');
  useEffect(() => {
    if (selectedDateValue !== undefined) {
      console.log('selectedDateが変わった:', selectedDateValue);
    }
  }, [selectedDateValue]);

  //
  const customerList = useMemo(() => {
    if (!customers) return [];

    if (sortOrder === '1') {
      return customers.toSorted((a, b) => a.kokyakuId - b.kokyakuId);
    } else if (sortOrder === '2') {
      return customers.toSorted((a, b) => a.kokyakuNam.localeCompare(b.kokyakuNam, 'ja'));
    } else {
      return customers;
    }
  }, [sortOrder, customers]);
  const customerOptions = useMemo(() => {
    return customerList.map(({ kokyakuId, kokyakuNam }) => ({
      id: kokyakuId,
      label: kokyakuNam,
    }));
  }, [customerList]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      dateFormats={{ year: 'YYYY年', month: 'MM' }} // カレンダー内の年一覧のフォーマット
      adapterLocale="ja"
      localeText={{
        previousMonth: '前月を表示',
        nextMonth: '翌月を表示',
      }}
    >
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
                        render={({ field }) => <SearchDateX value={field.value} onChange={field.onChange} />}
                      />
                      <span>～</span>
                      <Controller
                        control={control}
                        name="selectedDate.range.to"
                        render={({ field }) => <SearchDateX value={field.value} onChange={field.onChange} />}
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
                          {[selectNone, ...customerOptions].map((opt) => (
                            <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
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
                    <Grid2 size={{ sm: 12, md: 'grow' }}>
                      <SelectElement
                        name="customerSort"
                        control={control}
                        options={[
                          { id: '1', label: '顧客名簿' },
                          { id: '2', label: '顧客名' },
                        ]}
                        sx={{ minWidth: 150 }}
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
                        render={({ field }) => <SearchDateX value={field.value} onChange={field.onChange} />}
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
                        render={({ field }) => <SearchDateX value={field.value} onChange={field.onChange} />}
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
    </LocalizationProvider>
  );
};

/** ラヂオボタン用データ */
const radioData = [
  {
    id: '1',
    label: '先月全て',
    FormControlLabelProps: {
      sx: {
        '& .MuiFormControlLabel-label': {
          fontSize: '0.5rem',
        },
      },
    },
  },
  { id: '2', label: '今月全て' },
  { id: '3', label: '昨日' },
  { id: '4', label: '今日' },
  { id: '5', label: '明日' },
  { id: '6', label: '明日以降' },
  { id: '7', label: '指定期間' },
];

/**
 * 日付を選択し取得するコンポーネント
 * @param props sx スタイル disbled disabledかどうか
 * @returns {JSX.Element} MUIX DatePickerコンポーネント
 */
const SearchDateX = ({
  sx,
  disabled,
  value,
  onChange,
}: {
  sx?: object;
  disabled?: boolean;
  value?: Date | null;
  onChange?: (date: Date | null) => void;
}) => {
  const [error, setError] = useState<DateValidationError | null>(null);

  const errorMessage = useMemo(() => {
    switch (error) {
      case 'maxDate':
      case 'minDate': {
        return 'Please select a date';
      }

      case 'invalidDate': {
        return 'Your date is not valid';
      }

      default: {
        return '';
      }
    }
  }, [error]);

  return (
    <DatePicker
      name="date"
      format="YYYY/MM/DD" // テキストエリア内のフォーマット
      slotProps={{
        field: {
          clearable: true,
        },
        textField: {
          helperText: errorMessage,
          size: 'small',
          sx: {
            bgcolor: disabled ? grey[200] : 'white',
            width: 200,
            padding: 0,
            '.Mui-disabled': {
              WebkitTextFillColor: 'black',
            },
            ...sx,
          },
        },
        calendarHeader: { format: 'YYYY年MM月' },
      }} // カレンダーヘッダーのフォーマット
      onError={(newError: DateValidationError) => setError(newError)}
      views={['year', 'month', 'day']}
      disabled={disabled}
      value={value ? dayjs(value) : null}
      onChange={(newValue: Dayjs | null) => {
        onChange!(newValue ? newValue.toDate() : null);
      }}
    />
  );
};
