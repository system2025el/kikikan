'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, FieldPath, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';
import { FormDateX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';

import { usePdf } from '../_lib/hooks/usePdf';
import { JuchuValues, QuotHeadSchema, QuotHeadValues } from '../_lib/types';
import { addQuot } from '../create/_lib/funcs';
import { updateQuot } from '../edit/[id]/_lib/funcs';
import { FirstDialogPage, SecondDialogPage } from './create-tbl-dialogs';
import { MeisaiLines } from './meisai';
import { MeisaiTblHeader } from './meisai-tbl-header';
import { ReadOnlyYenNumberElement } from './yen';

/**
 * 見積書作成画面
 * @returns {JSX.Element} 見積書作成ページ
 */
export const Quotation = ({
  selectOptions,
  order,
  isNew,
  quot,
}: {
  selectOptions: { users: SelectTypes[]; mituSts: SelectTypes[]; custs: SelectTypes[] };
  order: JuchuValues;
  isNew: boolean;
  quot: QuotHeadValues;
}) => {
  /* ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  /* useState ----------------------------------------------------------------- */
  /* ローディング中かどうか */
  const [isLoading, setIsLoading] = useState(false);
  // 受注選択アコーディオン制御
  const [juchuExpanded, setJuchuExpanded] = useState(false);
  // 見積ヘッダアコーディオン制御
  const [mitsuExpanded, setMitsuExpanded] = useState(true);

  // ダイアログ開閉
  const [kizaiMeisaiaddDialogOpen, setKizaimeisaiaddDialogOpen] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  /* useForm -------------------------------------------------------------- */
  const quotForm = useForm<QuotHeadValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(QuotHeadSchema),
    defaultValues: { ...quot },
  });
  const {
    control,
    handleSubmit,
    reset,
    getValues,

    setValue,
    formState: { errors, isDirty },
  } = quotForm;

  // formfield
  const kizaiFields = useFieldArray({ control, name: 'meisaiHeads.kizai' });
  const laborFields = useFieldArray({ control, name: 'meisaiHeads.labor' });
  const otherFields = useFieldArray({ control, name: 'meisaiHeads.other' });

  // 監視
  const kizaiHeads = useWatch({ control, name: 'meisaiHeads.kizai' });
  const laborHeads = useWatch({ control, name: 'meisaiHeads.labor' });
  const otherHeads = useWatch({ control, name: 'meisaiHeads.other' });
  const currentKizaiChukei = useWatch({ control, name: 'kizaiChukeiAmt' });
  const currentChukei = useWatch({ control, name: 'chukeiAmt' });
  const tokuNebikiAmt = useWatch({ control, name: 'tokuNebikiAmt' });
  const currentPreTaxGokei = useWatch({ control, name: 'preTaxGokeiAmt' });
  const currentZeiAmt = useWatch({ control, name: 'zeiAmt' });
  const zeiRat = useWatch({ control, name: 'zeiRat' });
  const currentGokeiAmt = useWatch({ control, name: 'gokeiAmt' });

  /* methods ------------------------------------------------------ */
  /* 保存ボタン押下 */
  const onSubmit = async (data: QuotHeadValues) => {
    console.log('新規？', isNew, 'isDirty', isDirty);
    if (isNew) {
      await addQuot(data, user?.name ?? '');
    } else {
      const result = await updateQuot(data, user?.name ?? '');
      console.log('更新したのは', result, '番の見積');
    }
    setSnackBarMessage('保存しました');
    setSnackBarOpen(true);
    reset(data);
  };

  /* useEffect ------------------------------------------------------------ */
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (isNew) {
      // 新規なら入力者をログインアカウントから取得する
      if (user?.name) {
        reset({ ...quot, nyuryokuUser: user.name });
      }
    } else {
      reset(quot);
    }
  }, [user]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // 機材中計計算
  useEffect(() => {
    const kChukei = (kizaiHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);
    if (currentKizaiChukei !== kChukei) {
      setValue('kizaiChukeiAmt', kChukei, { shouldDirty: false });
    }
  }, [kizaiHeads, currentKizaiChukei, setValue]);

  // 見積全体計算
  useEffect(() => {
    const kChukei = (kizaiHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);
    const lChukei = (laborHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);
    const oChukei = (otherHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);

    const chukeiSum = kChukei + lChukei + oChukei;

    if (chukeiSum !== currentChukei) {
      setValue('chukeiAmt', chukeiSum, { shouldDirty: false });
    }

    const sum = chukeiSum - (tokuNebikiAmt ?? 0);
    if (sum !== currentPreTaxGokei) {
      setValue('preTaxGokeiAmt', sum, { shouldDirty: false });
    }

    const zei = Math.round((sum * (zeiRat ?? 0)) / 100);
    const currentZei = Math.round(currentZeiAmt ?? 0);
    if (zei !== currentZei) {
      setValue('zeiAmt', zei === 0 ? null : zei, { shouldDirty: false });
    }

    const gokei = sum + zei;

    if (gokei !== currentGokeiAmt) {
      setValue('gokeiAmt', gokei, { shouldDirty: false });
    }
  }, [
    kizaiHeads,
    laborHeads,
    otherHeads,
    currentChukei,
    tokuNebikiAmt,
    currentPreTaxGokei,
    zeiRat,
    currentZeiAmt,
    currentGokeiAmt,
    setValue,
  ]);

  // デバッグ用
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('入力エラー', Object.entries(errors));
    }
  }, [errors]);

  /* print pdf ------------------------------------------------------------ */

  // PDF出力用のモデル
  const [pdfModel, setPdfModel] = useState(quot);
  // PDFデータ生成フック
  const [printQuotation] = usePdf();

  // ボタン押下
  const hundlePrintPdf = async () => {
    // PDFデータ生成
    const blob = await printQuotation(pdfModel);
    // ダウンロードもしくはブラウザ表示するためのURL
    const url = URL.createObjectURL(blob);

    // ダウンロードの場合
    // const a = document.createElement('a');
    // a.download = 'data.pdf';
    // a.href = url;
    // a.click();

    // 別タブ表示の場合
    window.open(url);
  };

  useEffect(() => {
    setPdfModel(quot);
  }, [quot]); // <- 変更の契機

  /* ---------------------------------------------------------------------- */

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <Button onClick={() => router.push('/quotation-list')}>戻る</Button>
      </Box>
      <FormProvider {...quotForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper variant="outlined">
            <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={1}>
              <Typography margin={1}>見積書</Typography>
              <Box>
                <Button sx={{ margin: 1 }} onClick={hundlePrintPdf} disabled={isNew || isDirty}>
                  見積書印刷
                </Button>
                <Button sx={{ margin: 1 }} type="submit">
                  保存
                </Button>
              </Box>
            </Grid2>
          </Paper>
          {isLoading && <LoadingOverlay />}
          {/* 受注選択 ---------------------------------------------------------------------------------- */}
          <Accordion
            expanded={juchuExpanded}
            onChange={() => setJuchuExpanded(!juchuExpanded)}
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              marginTop: 1,
            }}
            variant="outlined"
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Grid2 container alignItems={'center'} width={'100%'}>
                <Grid2 size={3}>
                  <Typography component="span">受注選択</Typography>
                </Grid2>
                {!juchuExpanded && (
                  <Grid2 size={'grow'} alignItems={'center'} display={'flex'}>
                    <Typography marginRight={2}>公演名</Typography>
                    <Typography>{order.koenNam}</Typography>
                  </Grid2>
                )}
              </Grid2>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0, pb: 1 }}>
              <Divider />
              <Grid2 container>
                <Grid2 size={6.5}>
                  <Grid2 container mx={2} my={1} spacing={6}>
                    <Grid2 display="flex" alignItems="center">
                      <Typography marginRight={5}>受注番号</Typography>
                      <TextField value={order.juchuHeadId ?? ''} disabled sx={{ width: 120 }} />
                    </Grid2>
                    <Grid2 display="flex" alignItems="center">
                      <Typography marginRight={3}>受注ステータス</Typography>
                      <TextField value={order.juchuSts ?? ''} disabled sx={{ width: 180 }} />
                    </Grid2>
                  </Grid2>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>受注日</Typography>
                    <TextField value={order.juchuDat ? toJapanDateString(order.juchuDat) : ''} disabled />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>入力者</Typography>
                    <TextField value={order.nyuryokuUser ?? ''} disabled />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>受注開始</Typography>
                    <TextField value={order.juchuRange.strt ? toJapanDateString(order.juchuRange.strt) : ''} disabled />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>受注終了</Typography>
                    <TextField value={order.juchuRange.end ? toJapanDateString(order.juchuRange.end) : ''} disabled />
                  </Box>
                </Grid2>
                <Grid2 size={5.5}>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>公演名</Typography>
                    <TextField value={order.koenNam ?? ''} disabled sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>公演場所</Typography>
                    <TextField value={order.koenbashoNam ?? ''} disabled sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={9}>相手</Typography>
                    <TextField value={order.kokyaku.name ?? ''} disabled sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>担当者</Typography>
                    <TextField value={order.kokyakuTantoNam ?? ''} disabled sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>受注メモ</Typography>
                    <TextField multiline value={order.mem ?? ''} disabled sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={3}>受注値引き</Typography>
                    <TextField value={order.nebikiAmt ?? ''} disabled sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>税区分</Typography>
                    <TextField value={order.zeiKbn ?? ''} disabled sx={{ width: 120 }} />
                  </Box>
                </Grid2>
              </Grid2>
            </AccordionDetails>
          </Accordion>
          {/* 見積ヘッダー ----------------------------------------------------------------------------------*/}
          <Accordion
            expanded={mitsuExpanded}
            onChange={() => setMitsuExpanded(!mitsuExpanded)}
            sx={{
              borderRadius: 1,
              overflow: 'hidden',
              marginTop: 1,
            }}
            variant="outlined"
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="span">見積ヘッダー</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0, pb: 1 }}>
              <Divider />
              <Grid2 container>
                <Grid2 size={6.5}>
                  <Grid2 container mx={2} my={1} spacing={6}>
                    <Grid2 display="flex" alignItems="center">
                      <Typography marginRight={5}>見積番号</Typography>
                      <TextFieldElement
                        name="mituHeadId"
                        control={control}
                        sx={{
                          width: 120,
                          pointerEvents: 'none', // クリック不可にする
                          backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
                          color: '#888',
                        }}
                        slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
                      />
                    </Grid2>
                    <Grid2 display="flex" direction="row" alignItems="center">
                      <Typography marginRight={3}>見積ステータス</Typography>
                      <SelectElement
                        name="mituSts"
                        control={control}
                        sx={{ width: 180 }}
                        options={selectOptions.mituSts}
                      />
                    </Grid2>
                  </Grid2>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>見積件名</Typography>
                    <TextFieldElement name="mituHeadNam" control={control} sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>見積日</Typography>
                    <Controller
                      name="mituDat"
                      control={control}
                      render={({ field }) => (
                        <FormDateX value={field.value} onChange={field.onChange} sx={{ width: 242.5 }} />
                      )}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={3}>見積作成者</Typography>
                    <Controller
                      name="nyuryokuUser"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={selectOptions.users}
                          getOptionLabel={(option) => option.label}
                          value={selectOptions.users.find((opt: SelectTypes) => opt.label === field.value) || null}
                          onChange={(_, value) => field.onChange(value?.label ?? '')}
                          renderInput={(params) => <TextField {...params} />}
                          sx={{ width: 242.5 }}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>見積先</Typography>
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
                          options={selectOptions.custs}
                          getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={1}>見積先担当者</Typography>
                    <TextFieldElement name="kokyakuTantoNam" control={control} />
                  </Box>
                </Grid2>
                <Grid2 size={5.5}>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>作品名</Typography>
                    <TextFieldElement name="koenNam" control={control} sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>実施場所</Typography>
                    <TextFieldElement name="koenbashoNam" control={control} sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>貸出期間</Typography>
                    <Controller
                      name="mituRange.strt"
                      control={control}
                      render={({ field }) => (
                        <FormDateX value={field.value} onChange={field.onChange} sx={{ width: 242.5 }} />
                      )}
                    />
                    ～
                    <Controller
                      name="mituRange.end"
                      control={control}
                      render={({ field }) => (
                        <FormDateX value={field.value} onChange={field.onChange} sx={{ width: 242.5 }} />
                      )}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>本番日数</Typography>
                    <TextFieldElement
                      name="mituHonbanbiQty"
                      control={control}
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
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={9}>備考</Typography>
                    <TextFieldElement name="biko" control={control} sx={{ width: 300 }} />
                  </Box>
                </Grid2>
              </Grid2>
            </AccordionDetails>
          </Accordion>
          {/* 見積明細 ----------------------------------------------------------------------------------*/}
          <Paper sx={{ marginTop: 1 }} variant="outlined">
            <Box p={1}>
              <Typography margin={1}>見積明細</Typography>
            </Box>
            <Box sx={{ padding: 0, pb: 1 }}>
              <Divider />
              {/* 機材費テーブル ------------------------------------------------------------ */}
              <Box margin={0.5} padding={0.8} borderBottom={1} borderColor={'divider'}>
                <Typography variant="h6" pt={1} pl={2}>
                  機材費
                </Typography>
                {kizaiFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    <MeisaiTblHeader index={index} sectionNam="kizai" sectionFields={kizaiFields}>
                      <MeisaiLines index={index} sectionNam="kizai" />
                    </MeisaiTblHeader>
                  </Box>
                ))}
                <Box m={1}>
                  <Button size="small" onClick={() => setKizaimeisaiaddDialogOpen(true)}>
                    <AddIcon fontSize="small" />
                    テーブル
                  </Button>
                </Box>
                <Dialog
                  open={kizaiMeisaiaddDialogOpen}
                  onClose={() => {
                    setKizaimeisaiaddDialogOpen(false);
                    setShowSecond(false);
                  }}
                  slotProps={{
                    transition: {
                      onExited: () => {
                        setShowSecond(false);
                      },
                    },
                  }}
                  fullWidth
                >
                  {!showSecond && (
                    <FirstDialogPage
                      handleClose={() => setKizaimeisaiaddDialogOpen(false)}
                      addKizaiTbl={() =>
                        kizaiFields.append({
                          mituMeisaiHeadNam: null,
                          headNamDspFlg: false,
                          mituMeisaiKbn: 0,
                          nebikiNam: '値引き',
                          nebikiAftNam: '機材費',
                        })
                      }
                      toSecondPage={setShowSecond}
                    />
                  )}
                  {showSecond && (
                    <SecondDialogPage
                      field={kizaiFields}
                      handleClose={() => setKizaimeisaiaddDialogOpen(false)}
                      juchuId={order.juchuHeadId}
                      setSnackBarOpen={() => setSnackBarOpen(true)}
                      setSnackBarMessage={setSnackBarMessage}
                    />
                  )}
                </Dialog>
                <Grid2 container px={2} alignItems={'center'} spacing={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1} textAlign={'end'}>
                    機材費：
                  </Grid2>
                  <Grid2 size={1.5}>
                    <TextFieldElement name="kizaiChukeiMei" control={control} />
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="kizaiChukeiAmt" />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
              </Box>
              {/* 人権費テーブル ------------------------------------------------------------ */}
              <Box margin={0.5} padding={0.8} borderTop={1} borderBottom={1} borderColor={'divider'}>
                <Typography variant="h6" pt={1} pl={2}>
                  人権費
                </Typography>
                {laborFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    {/* {index > 0 && <Divider sx={{ mx: 5 }} />} */}
                    <MeisaiTblHeader index={index} sectionNam="labor" sectionFields={laborFields}>
                      <MeisaiLines index={index} sectionNam="labor" />
                    </MeisaiTblHeader>
                  </Box>
                ))}
                <Box m={1}>
                  <Button
                    size="small"
                    onClick={() =>
                      laborFields.append({
                        headNamDspFlg: false,
                        mituMeisaiHeadNam: null,
                        mituMeisaiKbn: 1,
                        nebikiNam: '値引き',
                        nebikiAftNam: '人件費',
                      })
                    }
                  >
                    <AddIcon fontSize="small" />
                    テーブル
                  </Button>
                </Box>
              </Box>
              {/* その他テーブル ------------------------------------------------------------ */}
              <Box margin={0.5} padding={0.8} borderTop={1} borderColor={'divider'}>
                <Typography variant="h6" pt={1} pl={2}>
                  その他
                </Typography>
                {otherFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    <MeisaiTblHeader index={index} sectionNam="other" sectionFields={otherFields}>
                      <MeisaiLines index={index} sectionNam="other" />
                    </MeisaiTblHeader>
                  </Box>
                ))}
                <Box m={1}>
                  <Button
                    size="small"
                    onClick={() =>
                      otherFields.append({
                        headNamDspFlg: false,
                        mituMeisaiHeadNam: null,
                        mituMeisaiKbn: 2,
                        nebikiNam: '値引き',
                        nebikiAftNam: 'その他',
                      })
                    }
                  >
                    <AddIcon fontSize="small" />
                    テーブル
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* まとめ ------------------------------------------------------------------------------------ */}
          <Paper sx={{ marginTop: 2, pt: 1 }} variant="outlined">
            <Box margin={0.5} padding={0.8}>
              <Grid2 container display={'flex'} alignItems={'baseline'} spacing={0.5}>
                <Grid2 size={1} alignItems={'baseline'}>
                  <Typography textAlign={'center'}>コメント</Typography>
                </Grid2>
                <Grid2 size={6}>
                  <TextFieldElement name="comment" control={control} multiline fullWidth />
                </Grid2>
                <Grid2 size={'grow'} />
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5}>
                  <TextFieldElement name="chukeiMei" control={control} />
                </Grid2>
                <Grid2 size={2}>
                  <ReadOnlyYenNumberElement name="chukeiAmt" />
                </Grid2>
                <Grid2 size={1} />
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5}>
                  <TextFieldElement name="tokuNebikiMei" control={control} />
                </Grid2>
                <Grid2 size={2}>
                  <Controller
                    name={'tokuNebikiAmt'}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        value={
                          isEditing
                            ? (field.value ?? '')
                            : typeof field.value === 'number' && !isNaN(field.value)
                              ? `${'-'}¥${Math.abs(field.value).toLocaleString()}`
                              : `${'-'}¥0`
                        }
                        type="text"
                        onFocus={(e) => {
                          setIsEditing(true);
                          const rawValue = String(field.value ?? '');
                          setTimeout(() => {
                            e.target.value = rawValue;
                          }, 1);
                        }}
                        onBlur={(e) => {
                          const rawValue = e.target.value.replace(/[¥,]/g, '');
                          const numericValue = Math.abs(Number(rawValue));
                          field.onChange(numericValue);
                          setIsEditing(false);
                        }}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, '');
                          if (/^\d*$/.test(raw)) {
                            field.onChange(Number(raw));
                            e.target.value = raw;
                          }
                        }}
                        sx={(theme) => ({
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: fieldState.error?.message && theme.palette.error.main,
                          },
                          '.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: fieldState.error?.message && theme.palette.error.main,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: fieldState.error?.message && theme.palette.error.main,
                          },
                          '& .MuiInputBase-input': {
                            textAlign: 'right',
                          },
                          '.MuiFormHelperText-root': {
                            color: theme.palette.error.main,
                          },
                          '& input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                        })}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid2>
                <Grid2 size={1} />
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5} justifyItems={'end'}>
                  <Typography>合計</Typography>
                </Grid2>
                <Grid2 size={2}>
                  <ReadOnlyYenNumberElement name="preTaxGokeiAmt" />
                </Grid2>
                <Grid2 size={1} />
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5} justifyItems={'end'}>
                  <Typography>消費税</Typography>
                </Grid2>
                <Grid2 size={2}>
                  <Controller
                    name="zeiAmt"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        value={
                          isEditing
                            ? (field.value ?? '')
                            : typeof field.value === 'number' && !isNaN(field.value)
                              ? `¥${Math.abs(field.value).toLocaleString()}`
                              : `¥0`
                        }
                        type="text"
                        onFocus={(e) => {
                          setIsEditing(true);
                          const rawValue = String(field.value ?? '');
                          e.target.value = rawValue;
                        }}
                        onBlur={(e) => {
                          const rawValue = e.target.value.replace(/[¥,]/g, '');
                          const numericValue = Math.abs(Number(rawValue));
                          field.onChange(numericValue);
                          setIsEditing(false);
                        }}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/[^\d]/g, '');
                          if (/^\d*$/.test(raw)) {
                            field.onChange(Number(raw));
                            e.target.value = raw;
                          }
                        }}
                        sx={(theme) => ({
                          '.MuiOutlinedInput-notchedOutline': {
                            borderColor: fieldState.error?.message && theme.palette.error.main,
                          },
                          '.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: fieldState.error?.message && theme.palette.error.main,
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: fieldState.error?.message && theme.palette.error.main,
                          },
                          '& .MuiInputBase-input': {
                            textAlign: 'right',
                          },
                          '.MuiFormHelperText-root': {
                            color: theme.palette.error.main,
                          },
                          '& input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                        })}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                </Grid2>
                <Grid2 size={1} display={'flex'}>
                  <TextFieldElement
                    name="zeiRat"
                    control={control}
                    sx={{
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                    type="number"
                  />
                  <Typography alignSelf={'center'}>%</Typography>
                </Grid2>
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5} justifyItems={'end'}>
                  <Typography>合計金額</Typography>
                </Grid2>
                <Grid2 size={2}>
                  <ReadOnlyYenNumberElement name="gokeiAmt" />
                </Grid2>
                <Grid2 size={1} />
              </Grid2>
            </Box>
          </Paper>
        </form>
      </FormProvider>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
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
    margin: 1,
    marginLeft: 2,
  },
};
