'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';

import { BackButton } from '../../../_ui/buttons';
import { getFilteredEqpts } from '../_lib/funcs';
import { EqptsMasterTableValues } from '../_lib/types';
import { EqptMasterTable } from './eqpt-master-table';

export const EqptMaster = ({
  eqpts,
  options,
}: {
  eqpts: EqptsMasterTableValues[] | undefined;
  options:
    | {
        d: SelectTypes[];
        s: SelectTypes[];
        b: SelectTypes[];
      }
    | undefined;
}) => {
  // useState
  const [theEqpts, setTheEqpts] = useState<EqptsMasterTableValues[] | undefined>(eqpts);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);

  /* 検索useForm-------------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '', bumonQuery: 0, daibumonQuery: 0, shukeiQuery: 0 },
  });

  /* methods ------------------------------------------ */
  /* 検索ボタン押下時 */
  const onSubmit = async (data: {
    query: string | undefined;
    bumonQuery: number | undefined;
    daibumonQuery: number | undefined;
    shukeiQuery: number | undefined;
  }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredEqpts({
      q: data.query!,
      d: data.daibumonQuery!,
      s: data.shukeiQuery!,
      b: data.bumonQuery!,
    });
    setPage(1);
    setTheEqpts(newList?.data);
    console.log('theEqpt : ', theEqpts);
  };
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>機材マスタ一覧</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack>
                <Typography noWrap>機材名キーワード</Typography>
                <TextFieldElement name={'query'} control={control} />
              </Stack>
            </Stack>
            <Grid2 container justifyContent={'space-between'} alignItems={'start'} mt={1} spacing={1}>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Typography width={100}>部門</Typography>
                <Controller
                  name="bumonQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.b!].map((opt) => (
                        <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </Grid2>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Typography width={100}>大部門</Typography>
                <Controller
                  name="daibumonQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.d!].map((opt) => (
                        <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </Grid2>
              <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
                <Typography width={100}>集計部門</Typography>
                <Controller
                  name="shukeiQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.s!].map((opt) => (
                        <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </Grid2>
            </Grid2>
            <Box mt={1} alignSelf={'end'} justifySelf={'end'}>
              <Button type="submit">
                <SearchIcon />
                検索
              </Button>
            </Box>
          </form>
          <Typography></Typography>
        </Box>
      </Paper>
      <EqptMasterTable
        eqpts={theEqpts}
        page={page}
        isLoading={isLoading}
        setPage={setPage}
        setIsLoading={setIsLoading}
      />
    </Container>
  );
};
