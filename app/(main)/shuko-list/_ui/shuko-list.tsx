'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { TestDate } from '../../_ui/date';
import { Loading } from '../../_ui/loading';
import { getShukoList } from '../_lib/funcs';
import { ShukoListSearchValues, ShukoTableValues } from '../_lib/types';
import { PdfModel, usePdf } from '../shuko/_lib/hooks/usePdf';
import { ShukoListTable } from './shuko-list-table';

export const ShukoList = (props: { shukoData: ShukoTableValues[] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<ShukoTableValues[]>([]);
  const [shukoList, setShukoList] = useState<ShukoTableValues[]>(props.shukoData);

  /* useForm ------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      juchuHeadId: null,
      shukoDat: new Date(),
      shukoBasho: 0,
    },
  });

  const onSubmit = async (data: ShukoListSearchValues) => {
    setIsLoading(true);
    const newShukoList = await getShukoList(data);
    setShukoList(newShukoList);
    setIsLoading(false);
  };

  /* 納品書出力(PDF) ------------------- */
  // PDFデータ生成フック
  const [printShuko] = usePdf();

  // ボタン押下
  const handleOutput = async () => {
    console.log(selected);
    //// チェックされた行を取り出し
    //const selectList = selected.map((index) => shukoList[index]);
    //console.log('selectList', selectList);

    //if (selectList.length === 0) return;

    // PdfModelの配列を作成
    const pdfModels: PdfModel[] = selected.map((row) => ({
      item1: row.juchuHeadId,
      item2: row.shukoDat,
      item3: row.kokyakuNam,
      item4: row.koenNam,
      item5: new Date(), //row.kashidashiDat ?? new Date(),
      item6: new Date(), //row.henkyakuDat ?? new Date(),
      item7: '', //row.koenbasho ?? '',
      item8: 0, //row.honbanNissu ?? 0,
      item9: '', //row.tanto ?? '',
      item10: '', //row.mem ?? '',
      item11: '', //row.gotantosha ?? '',
      item12: '',
      /*
      (() => {
        const dates = Array.isArray(row.honbanDat) ? row.honbanDat : row.honbanDat ? [row.honbanDat] : [new Date()];
        return dates
          .map((d) => {
            const date = new Date(d);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          })
          .join(', ');
      })(),
      */
      //item13: [], //row.kizaiData ?? [],
    }));

    console.log('pdfModels', pdfModels);

    // PDF生成
    const blob = await printShuko(pdfModels);

    // ブラウザ表示
    const url = URL.createObjectURL(blob);
    window.open(url);
  };

  return (
    <Box>
      <Paper variant="outlined">
        <Box alignItems="center" p={2}>
          <Typography>出庫検索・出庫一覧</Typography>
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} p={2} spacing={4}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>受注番号</Typography>
              <TextFieldElement
                name="juchuHeadId"
                control={control}
                type="number"
                inputMode="numeric"
                sx={{
                  maxWidth: 180,
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
              <Typography mr={2}>出庫日</Typography>
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
              <Typography mr={2}>出庫場所</Typography>
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
            <Button type="submit">
              <SearchIcon fontSize="small" />
              検索
            </Button>
          </Grid2>
        </form>
        <Divider />
        {isLoading ? (
          <Loading />
        ) : (
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'100%'} p={1}>
              <Typography>全{shukoList ? shukoList.length : 0}件</Typography>
              <Box>
                <Button onClick={handleOutput}>納品書出力</Button>
              </Box>
            </Box>
            {shukoList.length > 0 ? (
              <ShukoListTable datas={shukoList} onSelectionChange={setSelected} />
            ) : (
              <Typography p={1}>該当するデータがありません</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
