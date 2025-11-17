'use client';
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
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormDateX } from '../../_ui/date';
import { selectNone, SelectTypes } from '../../_ui/form-box';
import { LoadingOverlay } from '../../_ui/loading';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { getFilteredQuotList, getMituStsSelection, getUsersSelection } from '../_lib/funcs';
import { QuotSearchValues, QuotTableValues } from '../_lib/types';
import { QuotationListTable } from './quotation-list-table';

export const QuotationList = () => {
  /* useState -------------------------------------------- */
  /* 受注一覧 */
  const [quotList, setQuotList] = useState<QuotTableValues[]>([]);
  /* テーブルのページ */
  const [page, setPage] = useState<number>(1);
  /* ローディングかどうか */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /* テーブル初期表示 */
  const [isFirst, setIsFirst] = useState<boolean>(true);
  /* 選択肢 */
  const [options, setOptions] = useState<{ sts: SelectTypes[]; custs: SelectTypes[]; nyuryokuUser: SelectTypes[] }>({
    sts: [],
    custs: [],
    nyuryokuUser: [],
  });

  /* useForm ------------------------------------------- */
  const { control, reset, handleSubmit, getValues } = useForm<QuotSearchValues>({
    mode: 'onSubmit',
    defaultValues: {
      mituId: null,
      juchuId: null,
      mituSts: FAKE_NEW_ID,
      mituHeadNam: null,
      kokyaku: null,
      mituDat: { strt: null, end: null },
      nyuryokuUser: '未選択',
    },
  });

  /* methods ------------------------------------------ */
  /* 検索ボタン押下時処理 */
  const onSubmit = async (data: QuotSearchValues) => {
    console.log(data);
    setIsLoading(true);
    setIsFirst(false);
    setPage(1);
    const q = await getFilteredQuotList(data);
    if (q) {
      setQuotList(q);
      setIsLoading(false);
    }
    setIsLoading(false);
  };

  /* useEffect --------------------------------------- */
  useEffect(() => {
    // メモリ上に検索条件があるか確認
    const searchPramsString = sessionStorage.getItem('quotListSearchParams');
    const searchParams = searchPramsString ? JSON.parse(searchPramsString) : null;

    const getList = async () => {
      // メモリ開放
      sessionStorage.removeItem('quotListSearchParams');
      // 読み込み中
      setIsLoading(true);
      // 初期表示ではない
      setIsFirst(false);

      // 検索
      const q = await getFilteredQuotList(searchParams);
      if (q) {
        setQuotList(q);
      }
      setIsLoading(false);
    };

    const getOptions = async () => {
      // 選択肢取得
      const [sts, custs, nyuryokuUser] = await Promise.all([
        getMituStsSelection(),
        getCustomerSelection(),
        getUsersSelection(),
      ]);
      setOptions({ sts: sts, custs: custs, nyuryokuUser: nyuryokuUser });
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
          <Typography noWrap>見積検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container direction={'column'} spacing={1} width={'100%'}>
              <Grid2 container spacing={1}>
                <Grid2 size={{ sm: 12, md: 3 }} sx={styles.container}>
                  <Typography noWrap mr={7}>
                    見積番号
                  </Typography>
                  <TextFieldElement
                    name="mituId"
                    control={control}
                    type="number"
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
                  />
                </Grid2>
                <Grid2 size={{ sm: 12, md: 6 }} sx={styles.container}>
                  <Typography noWrap mr={5}>
                    受注番号
                  </Typography>
                  <TextFieldElement
                    name="juchuId"
                    control={control}
                    type="number"
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
                  />
                </Grid2>
              </Grid2>
              <Grid2 sx={styles.container}>
                <Typography noWrap mr={1}>
                  見積ステータス
                </Typography>
                <Controller
                  name="mituSts"
                  control={control}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options.sts].map((opt) => (
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
              <Grid2 sx={styles.container}>
                <Typography noWrap mr={7}>
                  見積件名
                </Typography>
                <TextFieldElement name="mituHeadNam" control={control} sx={{ width: 300 }} />
              </Grid2>
              <Grid2 sx={styles.container}>
                <Typography noWrap mr={7}>
                  見積相手
                </Typography>
                <Controller
                  name="kokyaku"
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
                      options={options.custs}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                    />
                  )}
                />
              </Grid2>
              <Grid2 sx={styles.container}>
                <Typography noWrap mr={9}>
                  見積日
                </Typography>
                <Controller
                  control={control}
                  name="mituDat.strt"
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
                  name="mituDat.end"
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
              <Grid2 container justifyContent={'space-between'}>
                <Grid2 sx={styles.container}>
                  <Typography noWrap mr={9}>
                    入力者
                  </Typography>
                  <Controller
                    name="nyuryokuUser"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} sx={{ width: 250 }}>
                        {[selectNone, ...options.nyuryokuUser].map((opt) => (
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
                <Grid2 alignSelf={'end'} justifySelf={'end'}>
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
      <QuotationListTable
        quots={quotList}
        isLoading={isLoading}
        isFirst={isFirst}
        page={page}
        queries={getValues()}
        searchParams={getValues()}
        setQuotList={setQuotList}
        setIsLoading={setIsLoading}
        setIsFirst={setIsFirst}
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
