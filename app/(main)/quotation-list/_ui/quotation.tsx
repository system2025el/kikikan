'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PrintIcon from '@mui/icons-material/Print';
import SaveAsIcon from '@mui/icons-material/SaveAs';
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
  Fab,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { FormDateX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';

import { addLock, delLock, getLock } from '../../_lib/funcs';
import { useUnsavedChangesWarning } from '../../_lib/hook';
import { LockValues } from '../../_lib/types';
import { BackButton } from '../../_ui/buttons';
import { IsDirtyAlertDialog, useDirty } from '../../_ui/dirty-context';
import { getCustomerSelection } from '../../(masters)/_lib/funcs';
import { getMituStsSelection, getUsersSelection } from '../_lib/funcs';
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
export const Quotation = ({ order, isNew, quot }: { order: JuchuValues; isNew: boolean; quot: QuotHeadValues }) => {
  /** ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  /** ページのルーター */
  const router = useRouter();
  /* useState ----------------------------------------------------------------- */
  /** ローディング中かどうか */
  const [isLoading, setIsLoading] = useState(true);
  /** 処理中かどうか */
  const [isProcessing, setIsProcessing] = useState(false);
  /** 受注選択アコーディオン制御 */
  const [juchuExpanded, setJuchuExpanded] = useState(false);
  /** 見積ヘッダアコーディオン制御 */
  const [mitsuExpanded, setMitsuExpanded] = useState(true);
  /** 選択肢 */
  const [options, setOptions] = useState<{ users: SelectTypes[]; mituSts: SelectTypes[]; custs: SelectTypes[] }>({
    users: [],
    mituSts: [],
    custs: [],
  });
  /** テーブル追加ダイアログ開閉 */
  const [kizaiMeisaiaddDialogOpen, setKizaimeisaiaddDialogOpen] = useState(false);
  /** テーブル自動生成ダイアログ開閉 */
  const [showSecond, setShowSecond] = useState(false);

  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');
  /** 編集内容が未保存ダイアログ制御 */
  const [dirtyOpen, setDirtyOpen] = useState(false);

  /** ロックデータ */
  const [lockData, setLockData] = useState<LockValues | null>(null);
  /** 全体の編集状態 */
  const [editable, setEditable] = useState(isNew ? true : false);

  /** 値引きの編集状態 */
  const [nebikiEditing, setNebikiEditing] = useState(false);
  /** 税の編集状態 */
  const [zeiEditing, setZeiEditing] = useState(false);

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
    setValue,
    formState: { errors, isDirty },
  } = quotForm;

  // formfield
  /** 機材明細 */
  const kizaiFields = useFieldArray({ control, name: 'meisaiHeads.kizai' });
  /** 人件費明細 */
  const laborFields = useFieldArray({ control, name: 'meisaiHeads.labor' });
  /** その他の明細 */
  const otherFields = useFieldArray({ control, name: 'meisaiHeads.other' });

  // 監視
  /** 機材の明細ヘッダ */
  const kizaiHeads = useWatch({ control, name: 'meisaiHeads.kizai' });
  /** 人件費の明細ヘッダ */
  const laborHeads = useWatch({ control, name: 'meisaiHeads.labor' });
  /** その他の明細ヘッダ */
  const otherHeads = useWatch({ control, name: 'meisaiHeads.other' });
  /** 現在の機材中計金額の値 */
  const currentKizaiChukei = useWatch({ control, name: 'kizaiChukeiAmt' });
  /** 現在の中計金額の値 */
  const currentChukei = useWatch({ control, name: 'chukeiAmt' });
  /** 値引き金額の値 */
  const tokuNebikiAmt = useWatch({ control, name: 'tokuNebikiAmt' });
  /** 現在の税抜き合計金額の値 */
  const currentPreTaxGokei = useWatch({ control, name: 'preTaxGokeiAmt' });
  /** 現在の税金額の値 */
  const currentZeiAmt = useWatch({ control, name: 'zeiAmt' });
  /** 現在の税率の値 */
  const zeiRat = useWatch({ control, name: 'zeiRat' });
  /** 現在の合計金額の値 */
  const currentGokeiAmt = useWatch({ control, name: 'gokeiAmt' });

  // context
  const { setIsDirty, setLock } = useDirty();
  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty);

  /* methods ------------------------------------------------------ */
  /** 保存ボタン押下 */
  const onSubmit = async (data: QuotHeadValues) => {
    console.log('新規？', isNew, 'isDirty', isDirty);
    setIsLoading(true);
    if (isNew) {
      // 登録された見積ヘッダID
      const id = await addQuot(data, user?.name ?? '');
      //setIsLoading(true);
      router.replace(`/quotation-list/edit/${id}`);
    } else {
      const result = await updateQuot(data, user?.name ?? '');
      console.log('更新したのは', result, '番の見積');
    }
    setSnackBarMessage('保存しました');
    setSnackBarOpen(true);
    reset(data);
    setIsLoading(false);
  };

  /** 編集モード変更 */
  const handleEdit = async () => {
    // 編集→閲覧
    if (editable) {
      if (isDirty) {
        setDirtyOpen(true);
        return;
      }
      await delLock(2, quot.mituHeadId ?? 0);
      setLockData(null);
      setEditable(false);
      // 閲覧→編集
    } else {
      if (!user) return;
      const lockData = await getLock(2, quot.mituHeadId ?? 0);
      setLockData(lockData);
      if (lockData === null) {
        await addLock(2, quot.mituHeadId ?? 0, user.name);
        const newLockData = await getLock(2, quot.mituHeadId ?? 0);
        setLockData(newLockData);
        setEditable(true);
      } else if (lockData !== null && lockData.addUser === user.name) {
        setEditable(true);
      }
    }
  };

  /**
   * 警告ダイアログの押下ボタンによる処理
   * @param result 結果
   */
  const handleResultDialog = async (result: boolean) => {
    if (result) {
      if (!isNew) {
        await delLock(2, quot.mituHeadId ?? 0);
        setLockData(null);
      }
      setEditable(false);
      reset();
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
    }
  };

  /* useMemo ---------------------------------------------------------- */
  const kChukei = useMemo(
    () => (kizaiHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0),
    [kizaiHeads]
  );

  const chukeiSum = useMemo(() => {
    const kChukei = (kizaiHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);
    const lChukei = (laborHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);
    const oChukei = (otherHeads ?? []).reduce((acc, item) => acc + (item.nebikiAftAmt ?? 0), 0);

    return kChukei + lChukei + oChukei;
  }, [kizaiHeads, laborHeads, otherHeads]);

  const sum = useMemo(() => chukeiSum - (tokuNebikiAmt ?? 0), [chukeiSum, tokuNebikiAmt]);

  const zei = useMemo(() => Math.round((sum * (zeiRat ?? 0)) / 100), [sum, zeiRat]);

  /* useEffect ------------------------------------------------------------ */
  /** 初期表示とログインユーザを取得とセット */
  useEffect(() => {
    const getOptions = async () => {
      // 選択肢取得
      const [users, mituSts, custs] = await Promise.all([
        getUsersSelection(),
        getMituStsSelection(),
        getCustomerSelection(),
      ]);
      setOptions({ users: users, mituSts: mituSts, custs: custs });
    };

    /** ロック確認 */
    const asyncProcess = async () => {
      const lockData = await getLock(2, quot.mituHeadId ?? 0);
      setLockData(lockData);
      if (lockData === null) {
        await addLock(2, quot.mituHeadId ?? 0, user?.name ?? '');
        const newLockData = await getLock(2, quot.mituHeadId ?? 0);
        setLockData(newLockData);
      } else if (lockData !== null && lockData.addUser !== user?.name) {
        setEditable(false);
      }
    };

    getOptions();

    if (isNew) {
      // 新規なら入力者をログインアカウントから取得する
      if (user?.name) {
        setValue('nyuryokuUser', user.name);
      }
    } else {
      // 編集でログインユーザがあるときロックデータを確認する
      if (user && quot.mituHeadId) asyncProcess();
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 5000); // setValue待ち
  }, [user, isNew, quot, setValue]);

  // 機材中計計算
  useEffect(() => {
    if (currentKizaiChukei !== kChukei) {
      setValue('kizaiChukeiAmt', kChukei, { shouldDirty: false });
    }
  }, [kChukei, currentKizaiChukei, setValue]);

  // 見積全体計算
  useEffect(() => {
    if (chukeiSum !== currentChukei) {
      setValue('chukeiAmt', chukeiSum, { shouldDirty: false });
    }

    if (sum !== currentPreTaxGokei) {
      setValue('preTaxGokeiAmt', sum, { shouldDirty: false });
    }

    const currentZei = Math.round(currentZeiAmt ?? 0);
    if (zei !== currentZei) {
      setValue('zeiAmt', zei === 0 ? null : zei, { shouldDirty: false });
    }

    const gokei = sum + zei;

    if (gokei !== currentGokeiAmt) {
      setValue('gokeiAmt', gokei, { shouldDirty: false });
    }
  }, [chukeiSum, sum, zei, currentChukei, currentPreTaxGokei, currentZeiAmt, currentGokeiAmt, setValue]);

  // ロック
  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  // 変更あるかどうか
  useEffect(() => {
    const dirty = isDirty;
    setIsDirty(dirty);
  }, [isDirty, setIsDirty]);

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
    if (isProcessing) return;

    setIsProcessing(true);

    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
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
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    setPdfModel(quot);
  }, [quot]); // <- 変更の契機

  /* ---------------------------------------------------------------------- */

  return (
    <Container disableGutters sx={{ minWidth: '100%', pb: 10 }} maxWidth={'xl'}>
      <Grid2 container spacing={4} display={'flex'} justifyContent={'end'} mb={1}>
        {lockData !== null && lockData.addUser !== user?.name && (
          <Grid2 container alignItems={'center'} spacing={2}>
            <Typography>{lockData.addDat && toJapanTimeString(new Date(lockData.addDat))}</Typography>
            <Typography>{lockData.addUser}</Typography>
            <Typography>編集中</Typography>
          </Grid2>
        )}
        {/* {fixFlag && (
          <Box display={'flex'} alignItems={'center'}>
            <Typography>出庫済</Typography>
          </Box>
        )} */}
        <Grid2 container alignItems={'center'} spacing={1}>
          {!editable || (lockData !== null && lockData?.addUser !== user?.name) ? (
            <Typography>閲覧モード</Typography>
          ) : (
            <Typography>編集モード</Typography>
          )}
          <Button
            disabled={(lockData && lockData?.addUser !== user?.name ? true : false) && isNew}
            onClick={handleEdit}
          >
            変更
          </Button>
        </Grid2>
        <BackButton label={'戻る'} />
      </Grid2>
      <FormProvider {...quotForm}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Paper variant="outlined">
            <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={1}>
              <Typography margin={1}>見積書</Typography>
              <Box>
                <Button sx={{ margin: 1 }} onClick={hundlePrintPdf} disabled={isNew || isDirty} loading={isProcessing}>
                  <PrintIcon fontSize="small" sx={{ mr: 0.5 }} />
                  見積書印刷
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
                    <TextField value={order.juchuDat ? toJapanYMDString(order.juchuDat) : ''} disabled />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>入力者</Typography>
                    <TextField value={order.nyuryokuUser ?? ''} disabled />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>受注開始</Typography>
                    <TextField value={order.juchuRange.strt ? toJapanYMDString(order.juchuRange.strt) : ''} disabled />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>受注終了</Typography>
                    <TextField value={order.juchuRange.end ? toJapanYMDString(order.juchuRange.end) : ''} disabled />
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
                        disabled={!editable}
                      />
                    </Grid2>
                    <Grid2 display="flex" direction="row" alignItems="center">
                      <Typography marginRight={3}>見積ステータス</Typography>
                      <SelectElement
                        name="mituSts"
                        control={control}
                        sx={{ width: 180 }}
                        options={options.mituSts}
                        disabled={!editable}
                      />
                    </Grid2>
                  </Grid2>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>見積件名</Typography>
                    <TextFieldElement name="mituHeadNam" control={control} sx={{ width: 300 }} disabled={!editable} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>見積日</Typography>
                    <Controller
                      name="mituDat"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <FormDateX
                          value={field.value}
                          onChange={field.onChange}
                          sx={{ width: 242.5 }}
                          error={!!error}
                          helperText={error?.message}
                          disabled={!editable}
                        />
                      )}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={3}>見積作成者</Typography>
                    <Controller
                      name="nyuryokuUser"
                      control={control}
                      disabled={!editable}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={options.users}
                          getOptionLabel={(option) => option.label}
                          value={options.users.find((opt: SelectTypes) => opt.label === field.value) || null}
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
                      disabled={!editable}
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
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={1}>見積先担当者</Typography>
                    <TextFieldElement name="kokyakuTantoNam" control={control} disabled={!editable} />
                  </Box>
                </Grid2>
                <Grid2 size={5.5}>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>作品名</Typography>
                    <TextFieldElement name="koenNam" control={control} sx={{ width: 300 }} disabled={!editable} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>実施場所</Typography>
                    <TextFieldElement name="koenbashoNam" control={control} sx={{ width: 300 }} disabled={!editable} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={5}>貸出期間</Typography>
                    <Controller
                      name="mituRange.strt"
                      control={control}
                      disabled={!editable}
                      render={({ field, fieldState: { error } }) => (
                        <FormDateX
                          value={field.value}
                          onChange={field.onChange}
                          sx={{ width: 242.5 }}
                          error={!!error}
                          helperText={error?.message}
                          disabled={!editable}
                        />
                      )}
                    />
                    ～
                    <Controller
                      name="mituRange.end"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <FormDateX
                          value={field.value}
                          onChange={field.onChange}
                          sx={{ width: 242.5 }}
                          error={!!error}
                          helperText={error?.message}
                          disabled={!editable}
                        />
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
                      type="number"
                      disabled={!editable}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={9}>備考</Typography>
                    <TextFieldElement name="biko" control={control} sx={{ width: 300 }} disabled={!editable} />
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
                    <MeisaiTblHeader index={index} sectionNam="kizai" sectionFields={kizaiFields} editable={editable}>
                      <MeisaiLines index={index} sectionNam="kizai" editable={editable} />
                    </MeisaiTblHeader>
                  </Box>
                ))}
                <Box m={1}>
                  <Button size="small" onClick={() => setKizaimeisaiaddDialogOpen(true)} disabled={!editable}>
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
                  <Grid2 size={4.5}>
                    <Divider sx={{ my: 1 }} />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
                <Grid2 container px={2} alignItems={'center'} spacing={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1} textAlign={'end'}>
                    機材費：
                  </Grid2>
                  <Grid2 size={1.5}>
                    <TextFieldElement name="kizaiChukeiMei" control={control} disabled={!editable} />
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="kizaiChukeiAmt" />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
              </Box>
              {/* 人件費テーブル ------------------------------------------------------------ */}
              <Box margin={0.5} padding={0.8} borderTop={1} borderBottom={1} borderColor={'divider'}>
                <Typography variant="h6" pt={1} pl={2}>
                  人件費
                </Typography>
                {laborFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    {/* {index > 0 && <Divider sx={{ mx: 5 }} />} */}
                    <MeisaiTblHeader index={index} sectionNam="labor" sectionFields={laborFields} editable={editable}>
                      <MeisaiLines index={index} sectionNam="labor" editable={editable} />
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
                    disabled={!editable}
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
                    <MeisaiTblHeader index={index} sectionNam="other" sectionFields={otherFields} editable={editable}>
                      <MeisaiLines index={index} sectionNam="other" editable={editable} />
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
                    disabled={!editable}
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
                  <TextFieldElement name="comment" control={control} multiline fullWidth disabled={!editable} />
                </Grid2>
                <Grid2 size={'grow'} />
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5}>
                  <TextFieldElement name="chukeiMei" control={control} disabled={!editable} />
                </Grid2>
                <Grid2 size={2}>
                  <ReadOnlyYenNumberElement name="chukeiAmt" />
                </Grid2>
                <Grid2 size={1} />
              </Grid2>
              <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                <Grid2 size={'grow'} />
                <Grid2 size={1.5}>
                  <TextFieldElement name="tokuNebikiMei" control={control} disabled={!editable} />
                </Grid2>
                <Grid2 size={2}>
                  <Controller
                    name={'tokuNebikiAmt'}
                    control={control}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        value={
                          nebikiEditing
                            ? (field.value ?? '')
                            : typeof field.value === 'number' && !isNaN(field.value)
                              ? `¥-${Math.abs(field.value).toLocaleString()}`
                              : `¥0`
                        }
                        type="text"
                        onFocus={(e) => {
                          setNebikiEditing(true);
                          const rawValue = String(field.value ?? '');
                          setTimeout(() => {
                            e.target.value = rawValue;
                          }, 1);
                        }}
                        onBlur={(e) => {
                          const rawValue = e.target.value.replace(/[¥,]/g, '');
                          const numericValue = Math.abs(Number(rawValue));
                          field.onChange(numericValue);
                          setNebikiEditing(false);
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
                        disabled={!editable}
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
                          zeiEditing
                            ? (field.value ?? '')
                            : typeof field.value === 'number' && !isNaN(field.value)
                              ? `¥${Math.abs(field.value).toLocaleString()}`
                              : `¥0`
                        }
                        type="text"
                        onFocus={(e) => {
                          setZeiEditing(true);
                          const rawValue = String(field.value ?? '');
                          e.target.value = rawValue;
                        }}
                        onBlur={(e) => {
                          const rawValue = e.target.value.replace(/[¥,]/g, '');
                          const numericValue = Math.abs(Number(rawValue));
                          field.onChange(numericValue);
                          setZeiEditing(false);
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
                        disabled={!editable}
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
                    disabled={!editable}
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
          {/** 固定ボタン 保存＆ページトップ */}
          <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
            <Fab variant="extended" color="primary" type="submit" sx={{ mr: 2 }} disabled={!editable || isLoading}>
              <SaveAsIcon sx={{ mr: 1 }} />
              保存
            </Fab>
            <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowUpwardIcon />
            </Fab>
          </Box>
        </form>
      </FormProvider>
      <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
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
