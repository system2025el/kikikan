'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';

import { BackButton } from '../../../_ui/buttons';
import { getFilteredBumons } from '../_lib/funcs';
import { BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterTable } from './bumons-master-table';
/**
 * 部門マスタ画面
 * @param {bumons} 部門リスト
 * @returns {JSX.Element} 部門マスタコンポーネント
 */

export const BumonsMaster = ({
  bumons,
  options,
}: {
  bumons: BumonsMasterTableValues[] | undefined;
  options:
    | {
        d: SelectTypes[];
        s: SelectTypes[];
      }
    | undefined;
}) => {
  /* useState ------------------ */
  const [theBumons, setTheBumons] = useState(bumons);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '', daibumonQuery: 0, shukeiQuery: 0 },
  });

  /* 検索ボタン押下 */
  const onSubmit = async (data: {
    query: string | undefined;
    daibumonQuery: number | undefined;
    shukeiQuery: number | undefined;
  }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredBumons({
      q: data.query!,
      d: data.daibumonQuery!,
      s: data.shukeiQuery!,
    });
    setPage(1);
    setTheBumons(newList?.data);
    console.log('theLocs : ', theBumons);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>部門マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <Stack>
            <Typography variant="body2">検索</Typography>
          </Stack>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack alignItems={'center'}>
              <Typography noWrap width={140}>
                部門名キーワード
              </Typography>
              <TextFieldElement name="query" control={control} />
            </Stack>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack mt={1} spacing={1}>
                <Typography noWrap width={140}>
                  大部門名
                </Typography>
                <Controller
                  name="daibumonQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.d].map((opt) => (
                        <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <Box width={50}></Box>
                <Typography noWrap width={100}>
                  集計部門名
                </Typography>
                <Controller
                  name="shukeiQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.s].map((opt) => (
                        <MenuItem key={opt.id} value={opt.id} sx={opt.id === 0 ? { color: grey[600] } : {}}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </Stack>
              <Box alignSelf={'end'}>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Paper>
      <BumonsMasterTable
        bumons={theBumons}
        page={page}
        isLoading={isLoading}
        setPage={setPage}
        setIsLoading={setIsLoading}
      />
    </Container>
  );
};
