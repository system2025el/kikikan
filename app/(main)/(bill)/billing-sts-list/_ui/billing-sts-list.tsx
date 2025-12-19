'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, MenuItem, Paper, Select, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { CheckboxButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { FAKE_NEW_ID } from '@/app/(main)/(masters)/_lib/constants';
import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funcs';

import { getFilteredBillingSituations } from '../_lib/funcs';
import { BillingStsSearchValues, BillingStsTableValues } from '../_lib/types';
import { BillingStsListTable } from './billing-sts-list-table';

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

  /* useForm --------------------------------------------------------------- */
  const { control, reset, handleSubmit, getValues } = useForm<BillingStsSearchValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { kokyaku: -100, kokyakuTantoNam: null, sts: ['1'] },
  });

  // const kokyakuId = getValues('kokyaku');
  const kokyakuId = useWatch({ control, name: 'kokyaku' });
  const tantou = useWatch({ control, name: 'kokyakuTantoNam' });

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
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      {isFirst && isLoading && <LoadingOverlay />}
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
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
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Typography noWrap mr={9}>
              相手
            </Typography>
            <Controller
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
            />
          </Grid2>
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Typography noWrap mr={3}>
              相手担当者
            </Typography>
            <TextFieldElement name="kokyakuTantoNam" control={control} type="text" sx={{ width: 200 }} />
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
        kokyakuId={Number(kokyakuId)}
        tantouNam={tantou}
        billSts={billSts}
        isFirst={isFirst}
        setPage={setPage}
        refetch={refetch}
      />
    </Container>
  );
};
