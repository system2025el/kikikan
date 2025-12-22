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
import { useEffect, useState } from 'react';
import { Controller, FormProvider, useFieldArray, useForm, useWatch } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { addLock, delLock, getLock } from '@/app/(main)/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { LockValues } from '@/app/(main)/_lib/types';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { getUsersSelection } from '@/app/(main)/quotation-list/_lib/funcs';

import { getBillingStsSelection } from '../_lib/funcs';
import { usePdf } from '../_lib/hooks/usePdf';
import { BillHeadSchema, BillHeadValues } from '../_lib/types';
import { addBill } from '../create/_lib/funcs';
import { updateBill } from '../edit/[id]/_lib/funcs';
import { FirstDialogPage, SecondDialogPage } from './create-tbl-dialogs';
import { MeisaiLines } from './meisai';
import { MeisaiTblHeader } from './meisai-tbl-header';
import { ReadOnlyYenNumberElement } from './yen';

/**
 * 請求書作成画面
 * @param param0
 * @returns {JSX.Element} 請求書作成画面コンポーネント
 */
export const Bill = ({ isNew, bill }: { isNew: boolean; bill: BillHeadValues }) => {
  /* ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  /* useState ----------------------------------------------------------------- */
  /* ローディング中かどうか */
  const [isLoading, setIsLoading] = useState(true); /** 処理中かどうか */
  const [isProcessing, setIsProcessing] = useState(false);
  /** 選択肢 */
  const [options, setOptions] = useState<{ users: SelectTypes[]; sts: SelectTypes[] }>({ users: [], sts: [] });
  // 請求ヘッダアコーディオン制御
  const [seikyuExpanded, setSeikyuExpanded] = useState(true);

  // ダイアログ開閉
  const [kizaiMeisaiaddDialogOpen, setKizaimeisaiaddDialogOpen] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');
  /** 編集内容が未保存ダイアログ制御 */
  const [dirtyOpen, setDirtyOpen] = useState(false);

  /** ロックデータ */
  const [lockData, setLockData] = useState<LockValues | null>(null);
  /** 全体の編集状態 */
  const [editable, setEditable] = useState(isNew ? true : false);

  /* useForm -------------------------------------------------------------- */
  const billForm = useForm<BillHeadValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(BillHeadSchema),
    defaultValues: bill,
  });
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { isDirty, dirtyFields },
  } = billForm;

  const meisaiHeadFields = useFieldArray({ control, name: 'meisaiHeads' });
  const kokyaku = useWatch({ control, name: 'aite' });

  // 監視
  const meisaiHeads = useWatch({ control, name: 'meisaiHeads' });
  const currentChukei = useWatch({ control, name: 'chukeiAmt' });
  const currentPreTaxGokei = useWatch({ control, name: 'preTaxGokeiAmt' });
  const currentZeiAmt = useWatch({ control, name: 'zeiAmt' });
  const zeiRat = useWatch({ control, name: 'zeiRat' });
  const currentGokeiAmt = useWatch({ control, name: 'gokeiAmt' });

  // context
  const { setIsDirty, setLock } = useDirty();
  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty);

  /* methods ------------------------------------------------------ */
  /* 保存ボタン押下 */
  const onSubmit = async (data: BillHeadValues) => {
    console.log('新規？', isNew, 'isDirty', isDirty);
    setIsLoading(true);
    if (isNew) {
      const id = await addBill(data, user?.name ?? '');
      // setIsLoading(true);
      router.replace(`/bill-list/edit/${id}`);
    } else {
      await updateBill(data, user?.name ?? '');
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
      await delLock(3, bill.seikyuHeadId ?? 0);
      setLockData(null);
      setEditable(false);
      // 閲覧→編集
    } else {
      if (!user) return;
      const lockData = await getLock(3, bill.seikyuHeadId ?? 0);
      setLockData(lockData);
      if (lockData === null) {
        await addLock(3, bill.seikyuHeadId ?? 0, user.name);
        const newLockData = await getLock(3, bill.seikyuHeadId ?? 0);
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
        await delLock(3, bill.seikyuHeadId ?? 0);
        setLockData(null);
      }
      setEditable(false);
      reset();
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
    }
  };

  /* useEffect ------------------------------------------------------------ */
  // 初期表示とログインユーザを取得とセット
  useEffect(() => {
    console.log('請求画面開いた', bill, 'isNew?', isNew, user?.name);
    const getOptions = async () => {
      const [users, sts] = await Promise.all([getUsersSelection(), getBillingStsSelection()]);
      setOptions({ users: users, sts: sts });
    };

    /** ロック確認 */
    const asyncProcess = async () => {
      const lockData = await getLock(3, bill.seikyuHeadId ?? 0);
      setLockData(lockData);
      if (lockData === null) {
        await addLock(3, bill.seikyuHeadId ?? 0, user?.name ?? '');
        const newLockData = await getLock(3, bill.seikyuHeadId ?? 0);
        setLockData(newLockData);
      } else if (lockData !== null && lockData.addUser !== user?.name) {
        setEditable(false);
      }
    };

    getOptions();

    if (isNew) {
      // 新規なら入力者をログインアカウントから取得する
      if (user?.name) {
        console.log({ ...bill, nyuryokuUser: user.name });
        setValue('nyuryokuUser', user.name);
      }
    } else {
      // 編集でログインユーザがあるときロックデータを確認する
      if (user && bill.seikyuHeadId) asyncProcess();
    }
    setTimeout(() => {
      setIsLoading(false);
    }, 5000); // setValue待ち
  }, [user, isNew, bill, setValue]);

  // 見積全体計算
  useEffect(() => {
    const chukei = (meisaiHeads ?? []).reduce((acc, item) => acc + (item?.nebikiAftAmt ?? 0), 0);

    if (chukei !== currentChukei) {
      setValue('chukeiAmt', chukei, { shouldDirty: false });
    }

    const preTax = (meisaiHeads ?? [])
      .filter((d) => d?.zeiFlg)
      .reduce((acc, item) => acc + (item?.nebikiAftAmt ?? 0), 0);
    if (preTax !== currentPreTaxGokei) {
      setValue('preTaxGokeiAmt', preTax, { shouldDirty: false });
    }

    const zei = Math.round((preTax * (zeiRat ?? 0)) / 100);
    const currentZei = Math.round(currentZeiAmt ?? 0);
    if (zei !== currentZei) {
      setValue('zeiAmt', zei === 0 ? null : zei, { shouldDirty: false });
    }

    const gokei = chukei + zei;

    if (gokei !== currentGokeiAmt) {
      setValue('gokeiAmt', gokei, { shouldDirty: false });
    }
  }, [meisaiHeads, currentChukei, currentPreTaxGokei, zeiRat, currentZeiAmt, currentGokeiAmt, setValue]);

  // ロック
  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  // 変更あるかどうか
  useEffect(() => {
    const dirty = isDirty;
    setIsDirty(dirty);
  }, [isDirty, setIsDirty]);

  /* print pdf ------------------------------------------------------------ */

  // PDF出力用のモデル
  const [pdfModel, setPdfModel] = useState(getValues());
  // フォーム全体を監視
  const watchedValues = useWatch({ control });
  // PDFデータ生成フック
  const [printBill] = usePdf();

  useEffect(() => {
    // getValues() を使うことで setValue() の直後の値も確実に拾える
    setPdfModel(getValues());
  }, [watchedValues, getValues, setValue]);

  // ボタン押下
  const hundlePrintPdf = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    // PDF作成処理でボタン制御がかからないのでメインスレッドを一旦空ける
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      // PDFデータ生成
      const blob = await printBill(pdfModel);
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

  // useEffect(() => {
  //   setPdfModel(bill);
  // }, [bill]); // <- 変更の契機

  /* ---------------------------------------------------------------------- */
  return (
    <>
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
        <FormProvider {...billForm}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Paper variant="outlined">
              <Grid2
                container
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                px={2}
                sx={{
                  minHeight: '30px',
                  maxHeight: '30px',
                }}
              >
                <Typography>請求書</Typography>
                <Box>
                  <Button onClick={hundlePrintPdf} disabled={isNew || isDirty || isProcessing}>
                    <PrintIcon fontSize="small" sx={{ mr: 0.5 }} />
                    請求書印刷
                  </Button>
                </Box>
              </Grid2>
            </Paper>

            {isLoading && <LoadingOverlay />}

            {/* 請求ヘッダー ----------------------------------------------------------------------------------*/}
            <Accordion
              expanded={seikyuExpanded}
              onChange={() => setSeikyuExpanded(!seikyuExpanded)}
              sx={{
                borderRadius: 1,
                overflow: 'hidden',
                marginTop: 1,
              }}
              variant="outlined"
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  minHeight: '30px',
                  maxHeight: '30px',
                  '&.Mui-expanded': {
                    minHeight: '30px',
                    maxHeight: '30px',
                  },
                }}
              >
                <Typography component="span">請求ヘッダー</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0, pb: 1 }}>
                <Divider />
                <Grid2 container direction={'column'} spacing={1} my={1}>
                  <Grid2 container spacing={1}>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={3}>請求番号</Typography>
                      <TextFieldElement
                        name="seikyuHeadId"
                        control={control}
                        sx={{
                          width: 120,
                          pointerEvents: 'none', // クリック不可にする
                          backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
                          color: '#888',
                          '& .MuiInputBase-input': {
                            textAlign: 'right',
                          },
                          '& input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                        }}
                        slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
                        disabled={!editable}
                      />
                    </Grid2>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={1}>相手</Typography>
                      <TextFieldElement
                        name="aite.nam"
                        control={control}
                        sx={{
                          width: 400,
                          pointerEvents: 'none', // クリック不可にする
                          backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
                          color: '#888',
                        }}
                        slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
                        disabled={!editable}
                      />
                    </Grid2>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={{ xl: 1, lg: 3 }}>請求書名</Typography>
                      <TextFieldElement
                        name="seikyuHeadNam"
                        control={control}
                        sx={{ width: 400 }}
                        disabled={!editable}
                      />
                    </Grid2>
                    <Grid2 sx={styles.container}>
                      <Typography marginRight={1}>請求ステータス</Typography>
                      <SelectElement
                        name="seikyuSts"
                        control={control}
                        sx={{ width: 180 }}
                        options={options.sts}
                        disabled={!editable}
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={5}>発行日</Typography>
                    <Controller
                      name="seikyuDat"
                      control={control}
                      render={({ field, fieldState: { error } }) => (
                        <FormDateX
                          value={field.value}
                          onChange={field.onChange}
                          sx={{ width: 200 }}
                          error={!!error}
                          helperText={error?.message}
                          disabled={!editable}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={5}>作成者</Typography>
                    <Controller
                      name="nyuryokuUser"
                      control={control}
                      render={({ field }) => (
                        <Autocomplete
                          {...field}
                          options={options.users}
                          getOptionLabel={(option) => option.label}
                          value={options.users.find((opt: SelectTypes) => opt.label === field.value) || null}
                          onChange={(_, value) => field.onChange(value?.label ?? '')}
                          renderInput={(params) => <TextField {...params} />}
                          sx={{ width: 242.5 }}
                          disabled={!editable}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={1}>請求先住所</Typography>
                    <TextFieldElement name="adr1" control={control} sx={{ width: 100, mr: 2 }} disabled={!editable} />
                    <Controller
                      name="adr2"
                      control={control}
                      rules={{
                        validate: (value) => {
                          const totalLength =
                            (value!.shozai ?? '').length +
                            (value!.tatemono ?? '').length +
                            (value!.sonota ?? '').length;
                          return totalLength <= 80 || validationMessages.maxStringLength(80);
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          value={`${field.value!.shozai ?? ''} ${field.value!.tatemono ?? ''} ${field.value!.sonota ?? ''}`}
                          onChange={(e) => {
                            const [adrA, adrB] = e.target.value.split(' ');
                            field.onChange({ adrA, adrB });
                          }}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          sx={{ width: 500 }}
                          disabled={!editable}
                        />
                      )}
                    />
                  </Grid2>
                  <Grid2 sx={styles.container}>
                    <Typography marginRight={3}>請求先名</Typography>
                    <TextFieldElement name="kokyaku" control={control} sx={{ width: 400 }} disabled={!editable} />
                  </Grid2>
                </Grid2>
              </AccordionDetails>
            </Accordion>

            {/* 請求明細 ----------------------------------------------------------------------------------*/}
            <Paper sx={{ marginTop: 1 }} variant="outlined">
              <Box
                display={'flex'}
                alignItems={'center'}
                px={2}
                sx={{
                  minHeight: '30px',
                  maxHeight: '30px',
                }}
              >
                <Typography>請求明細</Typography>
              </Box>
              <Box sx={{ padding: 0, pb: 1 }}>
                <Divider />
                <Box margin={0.5} padding={0.8}>
                  {meisaiHeadFields.fields.map((field, index) => (
                    <Box key={field.id}>
                      <MeisaiTblHeader index={index} fields={meisaiHeadFields} editable={editable}>
                        <MeisaiLines index={index} editable={editable} />
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
                        addTbl={() =>
                          meisaiHeadFields.append({
                            juchuHeadId: null,
                            juchuKizaiHeadId: null,
                            koenNam: null,
                            koenbashoNam: null,
                            kokyakuTantoNam: null,
                            nebikiAmt: null,
                            nebikiAftAmt: null,
                            seikyuRange: { strt: null, end: null },
                            seikyuMeisaiHeadNam: null,
                            zeiFlg: false,
                            meisai: [],
                          })
                        }
                        toSecondPage={setShowSecond}
                      />
                    )}
                    {showSecond && (
                      <SecondDialogPage
                        handleClose={() => setKizaimeisaiaddDialogOpen(false)}
                        setSnackBarOpen={() => setSnackBarOpen(true)}
                        setSnackBarMessage={setSnackBarMessage}
                        kokyakuId={kokyaku.id}
                        kokyakuNam={kokyaku.nam}
                        headsField={meisaiHeadFields}
                      />
                    )}
                  </Dialog>
                </Box>
              </Box>
            </Paper>

            {/* まとめ ------------------------------------------------------------------------------------ */}
            <Paper sx={{ marginTop: 1 }} variant="outlined">
              <Box margin={0.5} padding={0.8}>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={1} my={0.5}>
                  <Grid2 size={0.5} justifyItems={'end'}>
                    <Typography>中計</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="chukeiAmt" />
                  </Grid2>
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>消費税対象合計</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="preTaxGokeiAmt" />
                  </Grid2>
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={1} my={0.5}>
                  <Grid2 size={2.5} />
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>消費税</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <ReadOnlyYenNumberElement name="zeiAmt" />
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
                <Grid2 container display={'flex'} alignItems={'center'} spacing={1} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>請求金額</Typography>
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
    </>
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
    marginLeft: 2,
    marginRight: 2,
  },
};
