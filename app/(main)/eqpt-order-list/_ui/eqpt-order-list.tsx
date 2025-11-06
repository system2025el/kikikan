'use client';

import 'dayjs/locale/ja';

import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  Grid2,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { RadioButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { FormDateX } from '../../_ui/date';
import { selectNone, SelectTypes } from '../../_ui/form-box';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { radioData } from '../_lib/datas';
import { getFilteredOrderList } from '../_lib/funcs';
import { EqptOrderListTableValues, EqptOrderSearchValues } from '../_lib/types';
import { EqptOrderTable } from './eqpt-order-table';

/**
 * 受注明細一覧画面
 * @param param0
 * @returns {JSX.Element} 受注明細一覧画面コンポーネント
 */
export const EqptOrderList = ({
  orders,
  customers,
  locs,
}: {
  /** 明細一覧 */
  orders: EqptOrderListTableValues[] | undefined;
  /** 顧客選択肢 */
  customers: SelectTypes[] | undefined;
  /** 個↑場所選択肢 */
  locs: SelectTypes[] | undefined;
}) => {
  /* useState -------------------------------------------- */
  /* 受注一覧 */
  const [orderList, setOrderList] = useState<EqptOrderListTableValues[]>(orders ?? []);
  /* テーブルのページ */
  const [page, setPage] = useState(1);
  /* ローディングかどうか */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------------------------------ */
  const { control, handleSubmit, watch } = useForm<EqptOrderSearchValues>({
    defaultValues: {
      radio: 'shuko',
      range: { from: new Date(), to: new Date() },
      kokyaku: FAKE_NEW_ID,
      koenbashoNam: '',
      listSort: { sort: 'shuko', order: 'asc' },
    },
  });

  /* methods ---------------------------------------- */
  /** 検索押下時の処理 */
  const onSubmit = async (data: EqptOrderSearchValues) => {
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
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>受注明細検索</Typography>
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container px={4} pt={2} pb={2} spacing={1}>
            <Grid2 sx={styles.container}>
              <Stack direction="row" spacing={2} sx={styles.container}>
                <Typography noWrap minWidth={90}>
                  期間
                </Typography>
                <Controller
                  control={control}
                  name="range.from"
                  render={({ field, fieldState: { error } }) => (
                    <FormDateX
                      value={field.value}
                      onChange={field.onChange}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
                <span>～</span>
                <Controller
                  control={control}
                  name="range.to"
                  render={({ field, fieldState: { error } }) => (
                    <FormDateX
                      value={field.value}
                      onChange={field.onChange}
                      error={!!error}
                      helperText={error?.message}
                    />
                  )}
                />
              </Stack>
              <Stack ml={7}>
                <RadioButtonGroup row name="radio" control={control} options={radioData} />
              </Stack>
            </Grid2>
            <Grid2 container width={'100%'}>
              <Grid2 container direction={'column'} size={5.5}>
                <Stack direction="row" spacing={2} sx={styles.container}>
                  <Typography noWrap minWidth={90}>
                    受注番号
                  </Typography>
                  <TextFieldElement name="juchuId" control={control} sx={{ width: 120 }} />
                </Stack>
                <Stack direction="row" spacing={2} sx={styles.container}>
                  <Typography noWrap minWidth={90}>
                    受注明細名
                  </Typography>
                  <TextFieldElement name="headNam" control={control} sx={{ width: 300 }} />
                </Stack>
                <Stack direction="row" spacing={2} sx={styles.container}>
                  <Typography noWrap minWidth={90}>
                    顧客
                  </Typography>
                  <Controller
                    name="kokyaku"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} sx={{ width: 300 }}>
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
                </Stack>
              </Grid2>
              <Grid2 container direction={'column'} size={'grow'}>
                <Stack direction="row" spacing={2} sx={styles.container}>
                  <Typography noWrap minWidth={90}>
                    公演名
                  </Typography>
                  <TextFieldElement name="koenNam" control={control} sx={{ width: 300 }} />
                </Stack>
                <Stack direction="row" spacing={2} sx={styles.container}>
                  <Typography noWrap minWidth={90}>
                    公演場所
                  </Typography>
                  <Controller
                    name="koenbashoNam"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        {...field}
                        onChange={(_, value) => {
                          const label = typeof value === 'string' ? value : (value?.label ?? '');
                          field.onChange(label);
                        }}
                        freeSolo
                        autoSelect
                        sx={{ width: 300 }}
                        renderInput={(params) => <TextField {...params} />}
                        options={locs ?? []}
                        getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                      />
                    )}
                  />
                </Stack>
                <Stack direction="row" spacing={2} sx={styles.container}>
                  <Typography noWrap minWidth={90}>
                    ソート
                  </Typography>
                  <SelectElement
                    name="listSort.sort"
                    control={control}
                    options={[
                      { id: 'shuko', label: '出庫日' },
                      { id: 'nyuko', label: '入庫日' },
                      { id: 'juchuId', label: '受注番号' },
                      { id: 'headNam', label: '受注明細名' },
                      { id: 'juchuDat', label: '受注日' },
                      { id: 'koenNam', label: '公演名' },
                      { id: 'kokyakuNam', label: '顧客名' },
                    ]}
                    sx={{ minWidth: 150 }}
                  />
                  <Box width={10} />
                  <RadioButtonGroup
                    control={control}
                    name="listSort.order"
                    options={[
                      { id: 'asc', label: '昇順' },
                      { id: 'desc', label: '降順' },
                    ]}
                    row
                  />
                  <Grid2 size={'grow'} alignItems={'self-end'}>
                    <Box justifySelf={'end'}>
                      <Button type="submit">
                        <SearchIcon />
                        検索
                      </Button>
                    </Box>
                  </Grid2>
                </Stack>
              </Grid2>
            </Grid2>
          </Grid2>
        </form>
      </Paper>
      <EqptOrderTable
        orderList={orderList}
        isLoading={isLoading}
        page={page}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
  },
};
