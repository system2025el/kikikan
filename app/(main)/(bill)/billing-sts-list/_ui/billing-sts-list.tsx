'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Typography } from '@mui/material';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { CheckboxButtonGroup, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { SelectTypes } from '@/app/(main)/_ui/form-box';

import { getFilteredBillingSituations } from '../_lib/funcs';
import { BillingStsSearchValues, BillingStsTableValues } from '../_lib/types';
import { BillingStsListTable } from './billing-sts-list-table';

/**
 * 受注請求状況一覧画面
 * @param param0
 * @returns {JAX.Element} 受注請求状況一覧画面のコンポーネント
 */
export const BillingStsList = ({ custs }: { custs: SelectTypes[] }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [billSts, setBillSts] = useState<BillingStsTableValues[]>([]);

  const { control, handleSubmit, getValues } = useForm<BillingStsSearchValues>({
    mode: 'onBlur',
    reValidateMode: 'onBlur',
    defaultValues: { kokyaku: null, kokyakuTantoNam: null, sts: ['1'] },
  });

  // const kokyakuId = getValues('kokyaku');
  const kokyakuId = useWatch({ control, name: 'kokyaku' });

  /* method --------------------------------------------------------------- */
  const onSubmit = async (data: BillingStsSearchValues) => {
    setIsLoading(true);
    console.log(data);
    const theSts = await getFilteredBillingSituations(data);
    setBillSts(theSts);
    setIsLoading(false);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography noWrap>受注請求状況検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container direction={'column'} spacing={1} width={'100%'}>
              <Grid2 size={'auto'} display={'flex'} alignItems={'baseline'}>
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

              <Grid2 size={'auto'} display={'flex'} alignItems={'baseline'}>
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
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Grid2>
              </Grid2>
            </Grid2>
          </form>
        </Box>
      </Paper>
      <BillingStsListTable
        isLoading={isLoading}
        page={page}
        kokyakuId={Number(kokyakuId)}
        billSts={billSts}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
