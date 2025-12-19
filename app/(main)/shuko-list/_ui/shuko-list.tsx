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
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckboxButtonGroup, Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { toJapanTimeStampString, toJapanTimeString, toJapanYMDString } from '../../_lib/date-conversion';
import { TestDate } from '../../_ui/date';
import { SelectTypes } from '../../_ui/form-box';
import { Loading } from '../../_ui/loading';
import { getSectionShortSelections } from '../../(masters)/sections-master/_lib/funcs';
import { getPdfData, getShukoList } from '../_lib/funcs';
import { ShukoKizai, ShukoListSearchValues, ShukoTableValues } from '../_lib/types';
import { PdfModel, usePdf } from '../shuko/_lib/hooks/usePdf';
import { ShukoListTable } from './shuko-list-table';

export const ShukoList = (/*props: { shukoData: ShukoTableValues[] }*/) => {
  // ローディング制御
  const [isLoading, setIsLoading] = useState(true);
  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);
  // 選択行インデックス配列
  const [selected, setSelected] = useState<number[]>([]);
  // 出庫一覧データ
  const [shukoList, setShukoList] = useState<ShukoTableValues[]>(/*props.shukoData*/ []);
  // 課選択肢
  const [options, setOptions] = useState<SelectTypes[]>([]);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useForm ------------------- */
  const { control, handleSubmit, getValues, reset } = useForm<ShukoListSearchValues>({
    mode: 'onSubmit',
    defaultValues: {
      juchuHeadId: null,
      shukoDat: { from: new Date(), to: new Date() },
      shukoBasho: 0,
      section: [],
    },
  });

  /**
   * 検索ボタン押下
   * @param data 検索データ(受注番号、出庫日、出庫場所)
   */
  const onSubmit = async (data: ShukoListSearchValues) => {
    setIsLoading(true);
    sessionStorage.setItem('shukoListSearchParams', JSON.stringify(getValues()));
    const newShukoList = await getShukoList(data);
    setShukoList(newShukoList);
    setIsLoading(false);
  };

  /** 選択肢の取得 */
  const getOptions = async () => {
    const radio = await getSectionShortSelections();
    setOptions(radio);
  };

  /* 納品書出力(PDF) ------------------- */
  // PDFデータ生成フック
  const [printShuko] = usePdf();

  /**
   * 納品書出力ボタン押下
   */
  const handleOutput = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    console.log(selected);
    // チェックされた行を取り出し
    const selectList = selected.map((index) => shukoList[index]);
    console.log('selectList', selectList);

    if (selectList.length === 0) return;

    // PdfModelの配列
    const pdfModels: PdfModel[] = [];

    try {
      // チェックされた行分データ取得
      for (const data of selectList) {
        const headNamv = data.headNamv;
        const nyushukoDat = toJapanTimeStampString(data.nyushukoDat);
        const pdfData: PdfModel | null = await getPdfData(
          data.juchuHeadId,
          data.juchuKizaiHeadIdv,
          data.nyushukoBashoId,
          nyushukoDat
        );
        if (pdfData !== null) {
          pdfData.item13 = headNamv;
          pdfModels.push(pdfData);
        }
      }
      console.log('pdfModels', pdfModels);

      // PDF生成
      const blob = await printShuko(pdfModels);

      // ブラウザ表示
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (e) {
      console.error(e);
      setSnackBarMessage('納品書の出力に失敗しました');
      setSnackBarOpen(true);
    } finally {
      setIsProcessing(false);
    }
  };

  /* useEffect --------------------------------- */
  useEffect(() => {
    const searchPramsString = sessionStorage.getItem('shukoListSearchParams');
    const searchParams: ShukoListSearchValues = searchPramsString ? JSON.parse(searchPramsString) : null;

    getOptions();

    const getList = async (searchParams: ShukoListSearchValues) => {
      const newShukoList = await getShukoList(searchParams);
      setShukoList(newShukoList);
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
        <Box alignItems="center" px={2}>
          <Typography>出庫検索・出庫一覧</Typography>
        </Box>
        <Divider />
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems={'center'} p={0.5} px={2} spacing={1}>
            <Grid2 display={'flex'} alignItems={'center'}>
              <Typography mr={1}>受注番号</Typography>
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
              <Typography mr={1}>出庫日</Typography>
              <Controller
                name="shukoDat.from"
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
              ～
              <Controller
                name="shukoDat.to"
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
              <Typography mr={1}>出庫場所</Typography>
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
            </Grid2>
            <Grid2 display={'flex'} alignItems={'center'}>
              <Typography noWrap mr={1}>
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
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'100%'} p={0.5}>
              <Typography>全{shukoList ? shukoList.length : 0}件</Typography>
              <Box>
                <Button onClick={handleOutput} disabled={selected.length === 0} loading={isProcessing}>
                  納品書出力
                </Button>
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
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </Box>
  );
};
