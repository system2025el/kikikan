'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
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
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CheckboxButtonGroup, RadioButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';
import { set } from 'zod';

import { permission } from '@/app/(main)/_lib/permission';
import { FormDateX } from '@/app/(main)/_ui/date';
import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funcs';

import { radioData } from '../_lib/datas';
import { getFilteredBillingSituations } from '../_lib/funcs';
import { BillingStsSearchValues, BillingStsTableValues } from '../_lib/types';
import { BillingStsListTable } from './billing-sts-list-table';
import { UnbilledCustsDialog } from './unbilled-Custs-dialog';

/**
 * 受注請求状況一覧画面
 * @param param0
 * @returns {JAX.Element} 受注請求状況一覧画面のコンポーネント
 */
export const BillingStsList = () => {
  /* useState --------------------------------------------------------------- */
  /* ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /* ページ */
  const [page, setPage] = useState<number>(1);
  /* 受注請求状況一覧 */
  const [billSts, setBillSts] = useState<BillingStsTableValues[]>([]);
  /* テーブル初期表示 */
  const [isFirst, setIsFirst] = useState<boolean>(true);
  /** 顧客選択肢 */
  const [custs, setCusts] = useState<SelectTypes[]>([]);
  // /** 未請求顧客 */
  // const [unbilledCusts, setUnbilledCusts] = useState<string[]>([]);
  /** 未請求顧客ダイアログ開閉 */
  const [unbilledCustsDialog, setUnbilledCustsDialog] = useState<boolean>(false);

  /* useForm --------------------------------------------------------------- */
  const { control, reset, handleSubmit, getValues, setValue, watch } = useForm<BillingStsSearchValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: {
      kokyaku: '',
      radioKokyaku: 'single',
      unbilledCusts: [],
      radio: 'shuko',
      selectedDate: { value: '4', range: { from: null, to: null } },
      kokyakuTantoNam: null,
      sts: ['1'],
    },
  });

  const selectedDateValue = watch('selectedDate.value');
  const selectRadioKokyakuValue = watch('radioKokyaku');
  // const kokyakuId = getValues('kokyaku');
  //const kokyakuId = useWatch({ control, name: 'kokyaku' });
  //const tantou = useWatch({ control, name: 'kokyakuTantoNam' });

  /* method --------------------------------------------------------------- */
  /* 検索ボタンを押したときの処理 */
  const onSubmit = async (data: BillingStsSearchValues) => {
    setIsLoading(true);
    // 検索条件保持
    sessionStorage.setItem('billingStsSearchParams', JSON.stringify(data));
    setIsFirst(false);
    console.log(data);
    const theSts = await getFilteredBillingSituations(data);
    setBillSts(theSts);
    setIsLoading(false);
  };

  /* 再検索関数 */
  const refetch = async () => {
    setIsLoading(true);
    const theSts = await getFilteredBillingSituations(getValues());
    setBillSts(theSts);
    setIsLoading(false);
  };

  const handleCloseUnbilledCustsDialog = async () => {
    setUnbilledCustsDialog(false);
  };

  const handleConfirmed = (selectedCusts: string[]) => {
    console.log(selectedCusts);
    setValue('unbilledCusts', selectedCusts);
    setUnbilledCustsDialog(false);
  };

  /** useEffect ------------------------------------------------------------- */
  useEffect(() => {
    const searchPramsString = sessionStorage.getItem('billingStsSearchParams');
    const searchParams = searchPramsString ? JSON.parse(searchPramsString) : null;

    const getList = async () => {
      // 読み込み中
      setIsLoading(true);
      // 初期表示ではない
      setIsFirst(false);

      // 検索
      const q = await getFilteredBillingSituations(searchParams);
      if (q) {
        setBillSts(q);
      }
      setIsLoading(false);
    };

    const getOptions = async () => {
      // 選択肢取得
      const [clist] = await Promise.all([getCustomerSelection()]);
      setCusts(clist);
    };

    // 選択肢取得
    getOptions();

    // メモリ上に検索条件があれば実行
    if (searchParams) {
      reset(searchParams);
      getList();
    }

    setIsLoading(false);
  }, [reset]);

  return (
    <PermissionGuard category={'juchu'} required={permission.juchu_ref}>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        {isFirst && isLoading && <LoadingOverlay />}
        <Paper variant="outlined">
          <Box
            width={'100%'}
            display={'flex'}
            alignItems={'center'}
            px={2}
            sx={{
              minHeight: '30px',
              maxHeight: '30px',
            }}
          >
            <Typography noWrap>受注請求状況検索</Typography>
          </Box>
          <Divider />
          <Grid2
            container
            direction={'column'}
            spacing={0.5}
            width={'100%'}
            px={2}
            py={0.5}
            component={'form'}
            onSubmit={handleSubmit(onSubmit)}
          >
            <Grid2 display={'flex'} alignItems={'center'}>
              <RadioButtonGroup
                control={control}
                name="radioKokyaku"
                options={[
                  { id: 'single', label: '相手' },
                  { id: 'multi', label: '複数' },
                ]}
                row
              />
              {/* <Typography noWrap mr={9}>
                相手
              </Typography> */}
              {selectRadioKokyakuValue === 'single' ? (
                <Controller
                  name="kokyaku"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      getOptionKey={(option) => (typeof option === 'string' ? option : option.id)}
                      onChange={(_, value) => {
                        const label = typeof value === 'string' ? value : (value?.label ?? '');
                        field.onChange(label);
                      }}
                      // onInputChange={(_, newInputValue) => {
                      //   field.onChange(newInputValue);
                      // }}
                      freeSolo
                      autoSelect
                      sx={{ width: 300 }}
                      renderInput={(params) => <TextField {...params} />}
                      options={custs ?? []}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                    />
                  )}
                />
              ) : (
                <Button onClick={() => setUnbilledCustsDialog(true)}>未請求顧客</Button>
              )}
              <TextFieldElement name="unbilledCusts" control={control} type="hidden" sx={{ display: 'none' }} />

              {/* <Controller
                name="kokyaku"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <Select {...field} sx={{ width: 400 }}>
                    {[selectNone, ...custs].map((opt) => (
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
              /> */}
            </Grid2>
            <Grid2 display={'flex'} alignItems={'baseline'}>
              <Typography noWrap mr={3}>
                相手担当者
              </Typography>
              <TextFieldElement name="kokyakuTantoNam" control={control} type="text" sx={{ width: 200 }} />
            </Grid2>
            <Grid2 container spacing={1}>
              <SelectElement
                name="radio"
                label="検索条件"
                control={control}
                options={[
                  { id: 'shuko', label: '出庫日が' },
                  { id: 'nyuko', label: '入庫日が' },
                ]}
                sx={{ bgcolor: 'white', minWidth: 150 }}
              />
              <Grid2 container sx={{ display: 'flex', alignItems: 'center' }} ml={1}>
                <RadioButtonGroup control={control} name="selectedDate.value" options={radioData} row />
                {selectedDateValue === '7' && (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Controller
                      control={control}
                      name="selectedDate.range.from"
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
                      name="selectedDate.range.to"
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
                )}
              </Grid2>
            </Grid2>
            <Grid2 size={12} display={'flex'} alignItems={'baseline'}>
              <Grid2 container size={'grow'} alignItems={'baseline'}>
                <Typography noWrap mr={5}>
                  請求状況
                </Typography>
                <CheckboxButtonGroup
                  name="sts"
                  control={control}
                  options={[
                    {
                      id: '1',
                      label: '請求未完了',
                    },
                    {
                      id: '2',
                      label: '請求完了',
                    },
                  ]}
                  row
                />
              </Grid2>
              <Grid2 alignSelf={'end'}>
                <Button type="submit" loading={isLoading}>
                  <SearchIcon />
                  検索
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Paper>
        <BillingStsListTable
          isLoading={isLoading}
          page={page}
          custs={custs}
          //kokyakuId={Number(kokyakuId)}
          //tantouNam={tantou}
          billSts={billSts}
          isFirst={isFirst}
          setPage={setPage}
          refetch={refetch}
        />
      </Container>
      <Dialog open={unbilledCustsDialog}>
        <UnbilledCustsDialog
          unbilledCusts={getValues('unbilledCusts')}
          handleConfirmed={handleConfirmed}
          onClose={handleCloseUnbilledCustsDialog}
        />
      </Dialog>
    </PermissionGuard>
  );
};
