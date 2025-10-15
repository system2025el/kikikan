'use client';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Button,
  Container,
  Divider,
  FormControl,
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
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { FormDateX, TwoDatePickers } from '../../_ui/date';
import { selectNone, SelectTypes } from '../../_ui/form-box';
import { FAKE_NEW_ID } from '../../(masters)/_lib/constants';
import { getFilteredQuotList } from '../_lib/funcs';
import { QuotTableValues } from '../_lib/types';
import { QuotationListTable } from './quotation-list-table';

export const QuotationList = ({
  quots,
  options,
}: {
  quots: QuotTableValues[];
  options: {
    sts: SelectTypes[];
    custs: SelectTypes[];
    nyuryokuUser: SelectTypes[];
  };
}) => {
  /* useState -------------------------------------------- */
  /* 受注一覧 */
  const [quotList, setQuotList] = useState<QuotTableValues[]>(quots ?? []);
  /* テーブルのページ */
  const [page, setPage] = useState(1);
  /* ローディングかどうか */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------------------------------- */
  const { control, handleSubmit } = useForm({
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
  /* */
  const onSubmit = async (data: {
    mituId: number | null;
    juchuId: number | null;
    mituSts: number | null;
    mituHeadNam: string | null;
    kokyaku: string | null;
    mituDat: { strt: Date | null; end: Date | null };
    nyuryokuUser: string | null;
  }) => {
    setIsLoading(true);
    setPage(1);
    const orders = await getFilteredQuotList(data);
    if (orders) {
      setQuotList(orders);
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
                  <TextFieldElement name="mituId" control={control} type="number" sx={{ width: 120 }} />
                </Grid2>
                <Grid2 size={{ sm: 12, md: 6 }} sx={styles.container}>
                  <Typography noWrap mr={5}>
                    受注番号
                  </Typography>
                  <TextFieldElement name="juchuId" control={control} type="number" sx={{ width: 120 }} />
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
                  render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} sx={{ mr: 1 }} />}
                />
                <span>～</span>
                <Controller
                  control={control}
                  name="mituDat.end"
                  render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} sx={{ ml: 1 }} />}
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
