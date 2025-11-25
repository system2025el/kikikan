'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { CheckboxButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
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
  /** */
  const [custs, setCusts] = useState<SelectTypes[]>([]);

  /* useForm --------------------------------------------------------------- */
  const { control, reset, handleSubmit, getValues } = useForm<BillingStsSearchValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { kokyaku: null, kokyakuTantoNam: null, sts: ['1'] },
  });

  // const kokyakuId = getValues('kokyaku');
  const kokyakuId = useWatch({ control, name: 'kokyaku' });
  const tantou = useWatch({ control, name: 'kokyakuTantoNam' });

  /* method --------------------------------------------------------------- */
  /* 検索ボタンを押したときの処理 */
  const onSubmit = async (data: BillingStsSearchValues) => {
    setIsLoading(true);
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
      // メモリ上に検索条件があるか確認
      sessionStorage.removeItem('billingStsSearchParams');
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
          spacing={1}
          width={'100%'}
          p={2}
          component={'form'}
          onSubmit={handleSubmit(onSubmit)}
        >
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Grid2 size={0.5}>
              <Typography
                color="error.main"
                variant="body2"
                pr={0.5}
                display={{ xs: 'none', md: 'flex' }}
                justifySelf={'end'}
              >
                *必須
              </Typography>
              <Typography color="error.main" variant="body2" pr={0.5} display={{ md: 'none' }} justifySelf={'end'}>
                *
              </Typography>
            </Grid2>
            <Typography noWrap mr={9}>
              相手
            </Typography>
            <SelectElement
              name="kokyaku"
              control={control}
              options={custs}
              sx={{ width: 500 }}
              rules={{ required: '必須項目です。' }}
            />
          </Grid2>
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Grid2 size={0.5} />
            <Typography noWrap mr={3}>
              相手担当者
            </Typography>
            <TextFieldElement name="kokyakuTantoNam" control={control} type="text" sx={{ width: 200 }} />
          </Grid2>

          <Grid2 size={12} display={'flex'} alignItems={'baseline'}>
            <Grid2 container size={'grow'} alignItems={'baseline'}>
              <Grid2 size={0.5} />
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
              <Button type="submit">
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
        kokyakuId={Number(kokyakuId)}
        tantouNam={tantou}
        billSts={billSts}
        isFirst={isFirst}
        searchParams={getValues()}
        setPage={setPage}
        refetch={refetch}
      />
    </Container>
  );
};
