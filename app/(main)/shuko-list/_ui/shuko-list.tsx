'use client';

import AutorenewIcon from '@mui/icons-material/Autorenew';
import SearchIcon from '@mui/icons-material/Search';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
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
import { CheckboxButtonGroup, Controller, RadioButtonGroup, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { toJapanTimeStampString } from '../../_lib/date-conversion';
import { permission } from '../../_lib/permission';
import { TestDate } from '../../_ui/date';
import { SelectTypes } from '../../_ui/form-box';
import { Loading } from '../../_ui/loading';
import { PermissionGuard } from '../../_ui/permission-guard';
import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { getSectionShortSelections } from '../../(masters)/sections-master/_lib/funcs';
import { radioData } from '../_lib/datas';
import { getPdfData, getShukoList } from '../_lib/funcs';
import { ShukoKizai, ShukoListSearchValues, ShukoTableValues } from '../_lib/types';
import { ShukoPdfModel, usePdf } from '../shuko/_lib/hooks/usePdf';
import { ShukoListTable } from './shuko-list-table';

export const ShukoList = (/*props: { shukoData: ShukoTableValues[] }*/) => {
  // user情報
  const user = useUserStore((state) => state.user);

  // ローディング制御
  const [isLoading, setIsLoading] = useState(true);
  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);
  // エラーハンドリング
  const [error, setError] = useState<Error | null>(null);

  // 選択行インデックス配列
  const [selected, setSelected] = useState<number[]>([]);
  // 出庫一覧データ
  const [shukoList, setShukoList] = useState<ShukoTableValues[]>(/*props.shukoData*/ []);
  // 選択肢(顧客、課)
  const [options, setOptions] = useState<{ custs: SelectTypes[]; sect: SelectTypes[] }>({
    custs: [],
    sect: [],
  });
  // 員数票変換フラグ
  const [conversionFlag, setConversionFlag] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useForm ------------------- */
  const { control, handleSubmit, getValues, reset, watch } = useForm<ShukoListSearchValues>({
    mode: 'onSubmit',
    defaultValues: {
      selectedDate: { value: '2', range: { from: null, to: null } },
      juchuHeadId: null,
      shukoBasho: 0,
      kokyaku: '',
      section: [],
    },
  });

  /** 検索条件の種別の監視 */
  const selectedDateValue = watch('selectedDate.value');

  /**
   * 検索ボタン押下
   * @param data 検索データ(受注番号、出庫日、出庫場所)
   */
  const onSubmit = async (data: ShukoListSearchValues) => {
    setIsLoading(true);
    sessionStorage.setItem('shukoListSearchParams', JSON.stringify(getValues()));
    try {
      const newShukoList = await getShukoList(data);
      setShukoList(newShukoList);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
    setIsLoading(false);
  };

  /** 選択肢の取得 */
  const getOptions = async () => {
    try {
      const [custs, sect] = await Promise.all([getCustomerSelection(), getSectionShortSelections()]);
      setOptions({ custs: custs, sect: sect });
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
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

    // チェックされた行を取り出し
    const selectList = selected.map((index) => shukoList[index]);

    if (selectList.length === 0) return;

    // ShukoPdfModelの配列
    const pdfModels: ShukoPdfModel[] = [];

    try {
      // チェックされた行分データ取得
      for (const data of selectList) {
        const headNamv = data.headNamv;
        const pdfData: ShukoPdfModel | null = await getPdfData(
          data.juchuHeadId,
          data.juchuKizaiHeadIdv,
          data.nyushukoBashoId,
          data.nyushukoDat
        );
        if (pdfData !== null) {
          pdfData.item13 = headNamv;
          pdfModels.push(pdfData);
        }
      }

      // PDF生成
      const blob = await printShuko(pdfModels, conversionFlag);

      // ブラウザ表示
      const url = URL.createObjectURL(blob);
      window.open(url);
    } catch (e) {
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
      try {
        const newShukoList = await getShukoList(searchParams);
        setShukoList(newShukoList);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
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

  if (error) throw error;

  return (
    <PermissionGuard category={'nyushuko'} required={permission.nyushuko_ref}>
      <Box>
        <Paper variant="outlined">
          <Box alignItems="center" px={2}>
            <Typography>出庫検索・出庫一覧</Typography>
          </Box>
          <Divider />
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid2 container alignItems={'center'} ml={3} my={selectedDateValue === '4' ? 1 : 2} spacing={1}>
              <RadioButtonGroup control={control} name="selectedDate.value" options={radioData} row />
              {selectedDateValue === '4' && (
                <Grid2 display={'flex'} alignItems={'center'} width={'fit-content'}>
                  <Controller
                    name="selectedDate.range.from"
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
                    name="selectedDate.range.to"
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
              )}
            </Grid2>
            <Grid2 container alignItems={'center'} ml={2} my={1} spacing={2}>
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
                <Typography mr={1}>顧客</Typography>
                <Controller
                  name="kokyaku"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      getOptionKey={(option) => (typeof option === 'string' ? option : option.id)}
                      onChange={(_, value) => {
                        const label = typeof value === 'string' ? value : (value?.label ?? '');
                        field.onChange(label);
                      }}
                      freeSolo
                      autoSelect
                      sx={{ width: 300 }}
                      renderInput={(params) => <TextField {...params} />}
                      options={options.custs ?? []}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                    />
                  )}
                />
              </Grid2>
              <Grid2 display={'flex'} alignItems={'center'}>
                <Typography noWrap mr={1}>
                  課
                </Typography>
                <Box border={1} borderColor={'divider'} borderRadius={1} pl={1}>
                  <CheckboxButtonGroup name="section" control={control} options={options.sect} row />
                </Box>
              </Grid2>
              <Grid2 size={'auto'} ml={'auto'} mr={1}>
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
                <Box display={'flex'} alignItems={'center'}>
                  <Checkbox
                    checked={conversionFlag}
                    onChange={() => setConversionFlag(!conversionFlag)}
                    disabled={user?.permission.nyushuko === permission.nyushuko_ref}
                    sx={{ p: 0.5 }}
                  />
                  <Typography sx={{ mr: 3 }}>タイトルを「員数票」にする</Typography>
                  <Button
                    onClick={handleOutput}
                    disabled={selected.length === 0 || user?.permission.nyushuko === permission.nyushuko_ref}
                    loading={isProcessing}
                  >
                    納品書出力
                  </Button>
                </Box>
              </Box>
              {shukoList.length > 0 ? (
                <ShukoListTable user={user} datas={shukoList} onSelectionChange={setSelected} />
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
    </PermissionGuard>
  );
};
