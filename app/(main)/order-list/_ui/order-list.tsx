'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid2,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RadioButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';
import { DatePickerElement } from 'react-hook-form-mui/date-pickers';

import { BackButton } from '../../_ui/back-button';
import { TwoDatePickers } from '../../_ui/date';
import { customers } from '../../(masters)/customers-master/_lib/types';
import { OrderSchema, OrderSearchValues } from '../_lib/types';
import { OrderTable } from './order-table';

/** 受注一覧画面 */
export const OrderList = () => {
  const [criteria, setCriteria] = useState('');
  const handleSelect = (event: SelectChangeEvent) => {
    setCriteria(event.target.value);
  };
  const [val, setVal] = useState('yesterday');
  const handleChange = (value: string) => {
    setVal(value);
  };
  const valIsSelect = val === 'select';

  const [orderStatus, setOrderStatus] = useState('');
  const handleOrder = (event: SelectChangeEvent) => {
    setOrderStatus(event.target.value);
  };

  const [customer, setCustomer] = useState('');
  const handleCustomerSelect = (event: SelectChangeEvent) => {
    setCustomer(event.target.value);
  };

  const [custSort, setCustSort] = useState('顧客名簿');
  const handleCustSortSelect = (event: SelectChangeEvent) => {
    setCustSort(event.target.value);
  };

  const { control, getValues, handleSubmit, watch } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      criteria: '',
      selectedDate: '4',
      customer: '',
      customerSort: '1',
      stageName: '',
      orderStartDate: '',
      orderFinishDate: '',
    },
  });

  const onSubmit = (data: OrderSearchValues) => {
    console.log(data);
  };

  // 検索条件のラジオボタンとdatepickerを制御
  const selectedDate = watch('selectedDate');
  useEffect(() => {
    if (selectedDate !== undefined) {
      console.log('selectedDateが変わった:', selectedDate);
    }
  }, [selectedDate]);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>受注検索</Typography>
          <BackButton label="戻る" />
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container p={2} spacing={1}>
            <Grid2 container justifyContent={'space-between'} size={{ sm: 12, md: 12 }}>
              <Typography variant="body2">検索</Typography>
              <Button type="submit">
                <SearchIcon />
                検索
              </Button>
            </Grid2>

            <Grid2 size={{ sm: 12, md: 12 }}>
              <SelectElement
                name="criteria"
                label="検索条件"
                control={control}
                options={[
                  { id: '1', label: '出庫日が' },
                  { id: '2', label: '入庫日が' },
                  { id: '3', label: '受注日が' },
                ]}
                sx={{ bgcolor: 'white', minWidth: 150 }}
              />
            </Grid2>

            <Grid2 container direction={'row'} width={'100%'} alignItems={'center'}>
              <Grid2 alignItems={'center'} mx={1}>
                <RadioButtonGroup control={control} name="selectedDate" options={radioData} row />
                {/* <FormControl>
                <Box display={'flex'} alignItems={'center'}>
                  <RadioGroup defaultValue={'past'} row>
                    {radioData.map((data) => (
                      <FormControlLabel
                        key={data.id}
                        value={data.id}
                        control={<Radio />}
                        onChange={() => handleChange(data.id)}
                        label={data.label}
                      />
                    ))}
                  </RadioGroup>
                </Box>
              </FormControl> */}
              </Grid2>
              {selectedDate === '7' && (
                <Grid2 display={'flex'} alignItems={'center'}>
                  <TwoDatePickers />
                </Grid2>
              )}
            </Grid2>

            <Grid2 container width={'100%'}>
              <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 5 }}>
                <Typography noWrap minWidth={110}>
                  顧客
                </Typography>
                <SelectElement
                  name="customer"
                  control={control}
                  options={customers.map(({ kokyakuId, kokyakuNam }) => ({
                    id: kokyakuId.toString(),
                    label: kokyakuNam,
                  }))}
                  sx={{ minWidth: 250 }}
                />
                {/* <FormControl>
                  <Select value={customer} sx={{ minWidth: 300, bgcolor: 'white' }} onChange={handleCustomerSelect}>
                    {customers.map((customer) => (
                      <MenuItem key={customer.id} value={customer.name}>
                        {customer.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl> */}
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} size={{ md: 'grow' }}>
                <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 4 }}>
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
                <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 4 }}>
                  <Typography>受注開始日～終了日</Typography>
                </Grid2>
                <Grid2 display={'flex'} alignItems={'center'} size={{ sm: 12, md: 'grow' }}>
                  {/* <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  dateFormats={{ year: 'YYYY年', month: 'MM' }} // カレンダー内の年一覧のフォーマット
                  adapterLocale="ja"
                  localeText={{
                    previousMonth: '前月を表示',
                    nextMonth: '翌月を表示',
                  }}
                >
                  <DatePickerElement
                    name="orderStartDate"
                    control={control}
                    slotProps={{
                      calendarHeader: { format: 'YYYY年MM月' },
                      toolbar: { format: '' }
                    }}
                  />
                  ～
                  <DatePickerElement name="orderFinishDate" control={control} />
                </LocalizationProvider> */}
                  <TwoDatePickers />
                </Grid2>
              </Grid2>
            </Grid2>
          </Grid2>
        </form>
      </Paper>
      <OrderTable />
    </Container>
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
