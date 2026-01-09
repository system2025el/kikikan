'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { SetStateAction, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CheckboxButtonGroup, TextFieldElement } from 'react-hook-form-mui';

import { permission } from '@/app/(main)/_lib/permission';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funcs';

import { getBillingStsSelection, getFilteredBills } from '../_lib/funcs';
import { BillSearchValues, BillsListTableValues } from '../_lib/types';
import { BillListTable } from './bill-list-table';

/**
 * 請求一画面の検索部のUI
 * @returns {JSX.Element} 請求一覧コンポーネント
 */
export const BillList = () => {
  /* useState ---------------------------------------------------- */
  /* 初期表示用 */
  const [isFirst, setIsFirst] = useState<boolean>(true);
  /* ローディング状態 */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /* ページ  */
  const [page, setPage] = useState<number>(1);
  /** 選択肢一覧 */
  const [options, setOptions] = useState<{ custs: SelectTypes[]; sts: SelectTypes[] }>({ custs: [], sts: [] });
  /** 請求一覧 */
  const [bills, setBills] = useState<BillsListTableValues[]>([]);

  /* useForm ----------------------------------------------------- */
  const { control, reset, handleSubmit, getValues, setValue } = useForm<BillSearchValues>({
    defaultValues: {
      billId: null,
      billingSts: FAKE_NEW_ID,
      range: {
        str: null,
        end: null,
      },
      kokyaku: '未選択',
      seikyuHeadNam: null,
    },
  });

  /** 検索ボタン押下 */
  const onSubmit = async (data: BillSearchValues) => {
    console.log('検索ーーーーーーーーーーーーーーーー', data);
    setIsLoading(true);
    // 検索条件保持
    sessionStorage.setItem('billListSearchParams', JSON.stringify(getValues()));
    setIsFirst(false);
    setPage(1);
    const q = await getFilteredBills(data);
    if (q) {
      setBills(q);
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  /** useEffect ------------------------------------------------------------- */
  useEffect(() => {
    // メモリ上に検索条件があるか確認
    const searchPramsString = sessionStorage.getItem('billListSearchParams');
    const searchParams = searchPramsString ? JSON.parse(searchPramsString) : null;

    const getList = async () => {
      // 読み込み中
      setIsLoading(true);
      // 初期表示ではない
      setIsFirst(false);

      // 検索
      const q = await getFilteredBills(getValues());
      if (q) {
        setBills(q);
      }
      setIsLoading(false);
    };

    const getOptions = async () => {
      // 選択肢取得
      const [custs, sts] = await Promise.all([getCustomerSelection(), getBillingStsSelection()]);
      setOptions({ custs: custs, sts: sts });
    };

    // 選択肢取得
    getOptions();

    // メモリ上に検索条件があればセットして実行
    if (searchParams) {
      reset(searchParams);
      // 実行
      getList();
    }
    setIsLoading(false);
  }, [getValues, reset]);

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
            <Typography noWrap>請求検索</Typography>
          </Box>
          <Divider />
          <Grid2
            component={'form'}
            onSubmit={handleSubmit(onSubmit)}
            container
            direction={'column'}
            spacing={0.5}
            width={'100%'}
            px={2}
            py={0.5}
          >
            <Grid2 container spacing={1}>
              <Grid2 size={{ sm: 12, md: 3 }} sx={styles.container}>
                <Typography noWrap mr={7}>
                  請求番号
                </Typography>
                <TextFieldElement
                  name="billId"
                  control={control}
                  sx={{
                    width: 120,
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  type="number"
                />
              </Grid2>
              <Grid2 sx={styles.container}>
                <Typography noWrap mr={3}>
                  請求ステータス
                </Typography>
                <Controller
                  name="billingSts"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 200 }}>
                      {[selectNone, ...options!.sts].map((opt) => (
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
            </Grid2>
            <Grid2 sx={styles.container}>
              <Typography noWrap mr={7}>
                請求書名
              </Typography>
              <TextFieldElement name="seikyuHeadNam" control={control} />
            </Grid2>
            <Grid2 sx={styles.container}>
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

            <Grid2 container sx={styles.container}>
              <Grid2 display={'flex'} size={'grow'} alignItems={'baseline'}>
                <Typography noWrap mr={11}>
                  相手
                </Typography>
                <Controller
                  name="kokyaku"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.custs].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.label}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
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
        <BillListTable
          bills={bills}
          isLoading={isLoading}
          isFirst={isFirst}
          page={page}
          custs={options.custs}
          setBillList={setBills}
          searchParams={getValues()}
          setIsLoading={setIsLoading}
          setIsFirst={setIsFirst}
          setPage={setPage}
        />
      </Container>
    </PermissionGuard>
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
