'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, FormControl, Grid2, MenuItem, Paper, Select, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckboxButtonGroup, Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { TestDate } from '../../_ui/date';
import { SelectTypes } from '../../_ui/form-box';
import { Loading } from '../../_ui/loading';
import { getSectionShortSelections } from '../../(masters)/sections-master/_lib/funcs';
import { getNyukoList } from '../_lib/funcs';
import { NyukoListSearchValues, NyukoTableValues } from '../_lib/types';
import { NyukoListTable } from './nyuko-list-table';

export const NyukoList = (/*props: { shukoData: NyukoTableValues[]}*/) => {
  const [isLoading, setIsLoading] = useState(true);
  const [nyukoList, setNyukoList] = useState<NyukoTableValues[]>(/*props.shukoData*/ []);
  const [options, setOptions] = useState<SelectTypes[]>([]);

  /* useForm ------------------- */
  const { control, handleSubmit, getValues, reset } = useForm<NyukoListSearchValues>({
    mode: 'onSubmit',
    defaultValues: {
      juchuHeadId: null,
      nyukoDat: new Date(),
      nyukoBasho: 0,
      section: [],
    },
  });

  /**
   * 検索ボタン押下
   * @param data 検索データ(受注番号、出庫日、出庫場所)
   */
  const onSubmit = async (data: NyukoListSearchValues) => {
    setIsLoading(true);
    sessionStorage.setItem('nyukoListSearchParams', JSON.stringify(getValues()));
    const newNyukoList = await getNyukoList(data);
    setNyukoList(newNyukoList);
    setIsLoading(false);
  };

  /** 選択肢の取得 */
  const getOptions = async () => {
    const radio = await getSectionShortSelections();
    setOptions(radio);
  };

  /* useEffect --------------------------------- */
  useEffect(() => {
    const searchPramsString = sessionStorage.getItem('nyukoListSearchParams');
    const searchParams: NyukoListSearchValues = searchPramsString ? JSON.parse(searchPramsString) : null;
    getOptions();

    const getList = async (searchParams: NyukoListSearchValues) => {
      const newNyukoList = await getNyukoList(searchParams);
      setNyukoList(newNyukoList);
      setIsLoading(false);
    };

    if (searchParams) {
      reset(searchParams);
      getList(searchParams);
    } else {
      getList(getValues());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box>
      <Paper variant="outlined">
        <Box alignItems="center" p={2}>
          <Typography>入庫検索・入庫一覧</Typography>
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} px={2} py={1} spacing={2}>
            <Grid2 display={'flex'} alignItems={'center'}>
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
            </Grid2>
            <Grid2 display={'flex'} alignItems={'center'} width={'fit-content'}>
              <Typography mr={2}>入庫日</Typography>
              <Controller
                name="nyukoDat"
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
            </Grid2>
            <Grid2 display={'flex'} alignItems={'center'}>
              <Typography mr={2}>入庫場所</Typography>
              <FormControl size="small" sx={{ width: 120 }}>
                <Controller
                  name="nyukoBasho"
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
            </Grid2>
            <Grid2 display={'flex'} alignItems={'center'}>
              <Typography noWrap mr={2}>
                課
              </Typography>
              <Box border={1} borderColor={'divider'} borderRadius={1} pl={1}>
                <CheckboxButtonGroup name="section" control={control} options={options} row />
              </Box>
            </Grid2>
            <Grid2 size={'grow'} alignItems={'end'} justifyContent={'end'}>
              <Box alignSelf={'end'} justifySelf={'end'}>
                <Button type="submit" loading={isLoading}>
                  <SearchIcon fontSize="small" />
                  検索
                </Button>
              </Box>
            </Grid2>
          </Grid2>
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
