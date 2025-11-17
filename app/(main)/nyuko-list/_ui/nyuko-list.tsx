'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, FormControl, Grid2, MenuItem, Paper, Select, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckboxButtonGroup, Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { TestDate } from '../../_ui/date';
import { Loading } from '../../_ui/loading';
import { getNyukoList } from '../_lib/funcs';
import { NyukoListSearchValues, NyukoTableValues } from '../_lib/types';
import { NyukoListTable } from './nyuko-list-table';

export const NyukoList = (/*props: { shukoData: NyukoTableValues[] }*/) => {
  const [isLoading, setIsLoading] = useState(true);
  const [nyukoList, setNyukoList] = useState<NyukoTableValues[]>(/*props.shukoData*/ []);

  /* useForm ------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      juchuHeadId: null,
      shukoDat: new Date(),
      shukoBasho: 0,
      section: [],
    },
  });

  /**
   * 検索ボタン押下
   * @param data 検索データ(受注番号、出庫日、出庫場所)
   */
  const onSubmit = async (data: NyukoListSearchValues) => {
    setIsLoading(true);
    const newNyukoList = await getNyukoList(data);
    console.log(newNyukoList);
    setNyukoList(newNyukoList);
    setIsLoading(false);
  };

  /* useEffect --------------------------------- */
  useEffect(() => {
    onSubmit(getValues());
  }, [getValues]);

  return (
    <Box>
      <Paper variant="outlined">
        <Box alignItems="center" p={2}>
          <Typography>入庫検索・入庫一覧</Typography>
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} px={2} pt={1} spacing={4}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>受注番号</Typography>
              <TextFieldElement
                name="juchuHeadId"
                control={control}
                type="number"
                inputMode="numeric"
                sx={{
                  maxWidth: 120,
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
              />
            </Box>
            <Box display={'flex'} alignItems={'center'} width={'fit-content'}>
              <Typography mr={2}>入庫日</Typography>
              <Controller
                name="shukoDat"
                control={control}
                render={({ field, fieldState }) => (
                  <TestDate
                    onBlur={field.onBlur}
                    date={field.value}
                    onChange={(newDate) => field.onChange(newDate?.toDate())}
                    fieldstate={fieldState}
                    onClear={() => field.onChange(null)}
                  />
                )}
              />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>入庫場所</Typography>
              <FormControl size="small" sx={{ width: 120 }}>
                <Controller
                  name="shukoBasho"
                  control={control}
                  render={({ field }) => (
                    <Select {...field}>
                      <MenuItem value={0}>　</MenuItem>
                      <MenuItem value={1}>KICS</MenuItem>
                      <MenuItem value={2}>YARD</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography noWrap mr={2}>
                課
              </Typography>
              <Box border={1} borderColor={'divider'} borderRadius={1} pl={1}>
                <CheckboxButtonGroup
                  name="section"
                  control={control}
                  options={[
                    { id: 'Ⅰ', label: 'Ⅰ' },
                    { id: 'Ⅱ', label: 'Ⅱ' },
                    { id: 'Ⅲ', label: 'Ⅲ' },
                    { id: 'Ⅳ', label: 'Ⅳ' },
                    { id: 'Ⅴ', label: 'Ⅴ' },
                  ]}
                  row
                />
              </Box>
            </Box>
          </Grid2>
          <Box alignItems={'end'} justifySelf={'end'} px={2} pb={1}>
            <Button type="submit">
              <SearchIcon fontSize="small" />
              検索
            </Button>
          </Box>
        </form>
        <Divider />
        {isLoading ? (
          <Loading />
        ) : (
          <Box width={'100%'}>
            <Box display={'flex'} alignItems={'center'} width={'100%'} p={1}>
              <Typography>全{nyukoList ? nyukoList.length : 0}件</Typography>
            </Box>
            {nyukoList.length > 0 ? (
              <NyukoListTable datas={nyukoList} />
            ) : (
              <Typography p={1}>該当するデータがありません</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
