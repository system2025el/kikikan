'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  AutocompleteRenderInputParams,
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime';
import { SetStateAction, useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { AutocompleteElement, CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { BackButton, CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';
import { SelectTable } from '@/app/(main)/_ui/table';
import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funs';
import { getJuchuHead } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';
import { FormDateX } from '@/app/(main)/order-list/_ui/order-list';

import { quotation, quotationHeaders, quotationRows, terms } from '../_lib/data';
import { getMituStsSelection, getOrderForQuotation, getUsersSelection } from '../_lib/func';
import { JuchuValues, QuotHeadSchema, QuotHeadValues } from '../_lib/types';
import { FirstDialogPage, SecondDialogPage } from './dialogs';
import { MeisaiLines } from './meisai';
import { MeisaiTblHeader } from './meisai-tbl-header';

export const Quotation = () => {
  /* ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  /* debug用、レンダリング回数取得に使用 */
  const hasRun = useRef(false);
  /* useState ----------------------------------------------------------------- */
  /* ローディング中かどうか */
  const [isLoading, setIsLoading] = useState(true);
  /* 新規かどうか */
  const [isNew, setIsNew] = useState(true);
  /* フォーム内の選択肢 */
  const [selectOptions, setSelectOptions] = useState<{ user: SelectTypes[]; mituSts: SelectTypes[] }>({
    user: [],
    mituSts: [],
  });
  /* 受注選択に表示する受注情報 */
  const [order, setOrder] = useState<JuchuValues>({
    juchuHeadId: null,
    juchuSts: null,
    juchuDat: null,
    juchuRange: { strt: null, end: null },
    nyuryokuUser: null,
    koenNam: null,
    koenbashoNam: null,
    kokyaku: { id: null, name: null },
    kokyakuTantoNam: null,
    mem: null,
    nebikiAmt: null,
    zeiKbn: null,
  });

  // 受注選択アコーディオン制御
  const [juchuExpanded, setJuchuExpanded] = useState(false);
  // 見積ヘッダアコーディオン制御
  const [mitsuExpanded, setMitsuExpanded] = useState(false);

  // ダイアログ開閉
  const [kizaiMeisaiaddDialogOpen, setKizaimeisaiaddDialogOpen] = useState(false);
  const [showSecond, setShowSecond] = useState(false);

  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useForm -------------------------------------------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<QuotHeadValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(QuotHeadSchema),
    defaultValues: {
      mituHeadId: null,
      juchuHeadId: null,
      mituSts: null,
      mituDat: new Date(),
      mituHeadNam: '',
      kokyaku: null,
      nyuryokuUser: { id: String(user?.id), name: user?.name },
      mituRange: { strt: null, end: null },
      kokyakuTantoNam: null,
      koenNam: null,
      koenbashoNam: null,
      mituHonbanbiQty: null,
      biko: null,
      meisaiHeads: {
        kizai: [{ mituMeisaiHeadNam: '', headNamDspFlg: false, meisai: [{ nam: null }] }],
      },
    },
  });

  const kizaiFields = useFieldArray({ control, name: 'meisaiHeads.kizai' });
  const laborFields = useFieldArray({ control, name: 'meisaiHeads.labor' });
  const otherFields = useFieldArray({ control, name: 'meisaiHeads.other' });

  /* methods ------------------------------------------------------ */
  /* 保存ボタン押下 */
  const onSubmit = async (data: QuotHeadValues) => {
    console.log('新規？', isNew);
    console.log('取得した', data);
    setIsNew(false);
  };

  // 受注選択アコーディオン開閉
  const handleJuchuExpansion = () => {
    setJuchuExpanded(!juchuExpanded);
  };
  // 見積ヘッダアコーディオン開閉
  const handleMitsuExpansion = () => {
    setMitsuExpanded(!mitsuExpanded);
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  /* useEffect ------------------------------------------------------------ */
  /* 画面初期 */
  useEffect(() => {
    const getOptions = async () => {
      const [users, mituSts] = await Promise.all([getUsersSelection(), getMituStsSelection()]);
      setSelectOptions({ user: users, mituSts: mituSts });
    };
    getOptions();
    const savedOrderData = sessionStorage.getItem('currentOrder');
    if (savedOrderData) {
      const savedData = JSON.parse(savedOrderData);
      setOrder(savedData);
      // 画面更新後維持？ reset({
      //   mituRange: { strt: savedData.juchuRange.strt, end: savedData.juchuRange.end },
      //   ...savedData,
      // });
      setIsNew(false); // 新規じゃない
      setIsLoading(false);
      return; // 保存されたデータがあれば、それで処理を終了
    }
    if (!hasRun.current) {
      // デバッグ用のレンダリング二回目を避ける処理
      hasRun.current = true;
      const juchuId = sessionStorage.getItem('juchuHeadId');
      const quotId = sessionStorage.getItem('mitsumoriId');
      console.log('ダイアログで選んだID', juchuId);
      console.log('テーブルで選んだID', quotId);
      if (!juchuId && !quotId) {
        // 手動入力で入ってきている
        console.log('null');
        setIsLoading(false);
        return;
      } else {
        if (juchuId && juchuId !== '') {
          // 受注ヘッド番号から自動生成時
          const getjuchu = async (id: number) => {
            const data = await getOrderForQuotation(id);
            if (!data) {
              setSnackBarMessage(`受注番号${juchuId}の受注はありません`);
              setSnackBarOpen(true);
              setIsLoading(false);
              return;
            }
            reset({
              juchuHeadId: data.juchuHeadId,
              kokyakuTantoNam: data.kokyakuTantoNam,
              kokyaku: data.kokyaku.name,
              koenNam: data.koenNam,
              koenbashoNam: data.koenbashoNam,
              nyuryokuUser: { id: String(user?.id), name: user?.name },
              mituRange: { strt: data.juchuRange.strt, end: data.juchuRange.end },
            });
            console.log('DB', data);
            setOrder(data);
            sessionStorage.setItem('currentOrder', JSON.stringify(data));
            sessionStorage.removeItem('juchuHeadId');
            await setIsLoading(false);
          };
          getjuchu(Number(juchuId));
        } else if (quotId && quotId !== '') {
          // 見積一覧テーブルから選択して開いている
          setIsNew(false); // 新規じゃない
          const getMitsumori = async (id: number) => {
            console.log('DB, the QuoteId is ', id);
            // setOrder(orderData);
            // sessionStorage.setItem('currentOrder', JSON.stringify(orderData));
            sessionStorage.removeItem('mitsuHeadId');
            setIsLoading(false);
          };
          getMitsumori(Number(quotId));
        }
      }
    }
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log('入力エラー', Object.entries(errors));
    }
  }, [errors]);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Paper variant="outlined">
          <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={1}>
            <Typography margin={1}>見積書</Typography>
            <Box>
              {/* <Button sx={{ margin: 1 }}>編集</Button> */}
              <Button sx={{ margin: 1 }}>見積書印刷</Button>
              {/* <Button sx={{ margin: 1 }}>複製</Button> */}
              <Button sx={{ margin: 1 }} type="submit">
                保存
              </Button>
            </Box>
          </Grid2>
        </Paper>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          dateFormats={{ year: 'YYYY年', month: 'MM' }} // カレンダー内の年一覧のフォーマット
          adapterLocale="ja"
          localeText={{
            previousMonth: '前月を表示',
            nextMonth: '翌月を表示',
          }}
        >
          {isLoading && <LoadingOverlay />}

          {/* 受注選択 ---------------------------------------------------------------------------------- */}
          <Accordion expanded={juchuExpanded} onChange={handleJuchuExpansion} sx={{ marginTop: 1 }} variant="outlined">
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
          <Accordion expanded={mitsuExpanded} onChange={handleMitsuExpansion} sx={{ marginTop: 1 }} variant="outlined">
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
                      <TextField disabled value={getValues('mituHeadId') ?? ''} sx={{ width: 120 }} />
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
                    <AutocompleteElement
                      name="nyuryokuUser"
                      control={control}
                      options={selectOptions.user}
                      autocompleteProps={{ sx: { width: 242.5 } }}
                    />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={7}>見積先</Typography>
                    <TextFieldElement name="kokyaku" control={control} sx={{ width: 300 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={3}>見積担当者</Typography>
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
                    <TextFieldElement name="mituHonbanbiQty" control={control} sx={{ width: 120 }} />
                  </Box>
                  <Box sx={styles.container}>
                    <Typography marginRight={9}>備考</Typography>
                    <TextFieldElement name="biko" control={control} multiline sx={{ width: 300 }} />
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
              <Box margin={0.5} padding={0.8} borderBottom={1} borderColor={'InactiveBorder'}>
                <Typography variant="h6" pt={1} pl={2}>
                  機材費
                </Typography>
                {kizaiFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    {/* {index > 0 && <Divider sx={{ mx: 5 }} />} */}
                    <MeisaiTblHeader index={index} control={control} sectionNam="kizai" sectionFields={kizaiFields} />
                    <MeisaiLines control={control} index={index} sectionNam="kizai" />
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <Typography textAlign="end">小計</Typography>
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField disabled />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField disabled />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
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
                      addKizaiTbl={() => kizaiFields.append({ mituMeisaiHeadNam: null, headNamDspFlg: false })}
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
                    機材費
                  </Grid2>
                  <Grid2 size={1.5}>
                    <TextField />
                  </Grid2>
                  <Grid2 size={2}>
                    <TextField disabled />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
              </Box>
              {/* 人権費テーブル ------------------------------------------------------------ */}
              <Box margin={0.5} padding={0.8} borderTop={1} borderBottom={1} borderColor={'InactiveBorder'}>
                <Typography variant="h6" pt={1} pl={2}>
                  人権費
                </Typography>
                {laborFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    {/* {index > 0 && <Divider sx={{ mx: 5 }} />} */}
                    <MeisaiTblHeader index={index} control={control} sectionNam="labor" sectionFields={laborFields} />
                    <MeisaiLines control={control} index={index} sectionNam="labor" />
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <Typography textAlign="end">小計</Typography>
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                  </Box>
                ))}
                <Box m={1}>
                  <Button
                    size="small"
                    onClick={() => laborFields.append({ headNamDspFlg: false, mituMeisaiHeadNam: null })}
                  >
                    <AddIcon fontSize="small" />
                    テーブル
                  </Button>
                </Box>
              </Box>
              {/* その他テーブル ------------------------------------------------------------ */}
              <Box margin={0.5} padding={0.8} borderTop={1} borderBottom={1} borderColor={'InactiveBorder'}>
                <Typography variant="h6" pt={1} pl={2}>
                  その他
                </Typography>
                {otherFields.fields.map((field, index) => (
                  <Box key={field.id} p={1}>
                    {/* {index > 0 && <Divider sx={{ mx: 5 }} />} */}
                    <MeisaiTblHeader index={index} control={control} sectionNam="other" sectionFields={otherFields} />
                    <MeisaiLines control={control} index={index} sectionNam="other" />
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <Typography textAlign="end">小計</Typography>
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                    <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
                      <Grid2 size={'grow'} />
                      <Grid2 size={3}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1.5}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={2}>
                        <TextField />
                      </Grid2>
                      <Grid2 size={1} />
                    </Grid2>
                  </Box>
                ))}
                <Box m={1}>
                  <Button
                    size="small"
                    onClick={() => otherFields.append({ headNamDspFlg: false, mituMeisaiHeadNam: null })}
                  >
                    <AddIcon fontSize="small" />
                    テーブル
                  </Button>
                </Box>
              </Box>
              <Box margin={0.5} padding={0.8} borderTop={1} borderColor={'InactiveBorder'}>
                <Grid2 container display={'flex'} alignItems={'baseline'} spacing={0.5}>
                  <Grid2 size={1} alignContent={'baseline'}>
                    <Box>
                      <Typography textAlign={'center'}>コメント</Typography>
                    </Box>
                  </Grid2>
                  <Grid2 size={6}>
                    <TextFieldElement name="comment" control={control} multiline fullWidth />
                  </Grid2>
                  <Grid2 size={'grow'} />
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5}>
                    <TextField />
                  </Grid2>
                  <Grid2 size={2}>
                    <TextField disabled />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5}>
                    <TextField />
                  </Grid2>
                  <Grid2 size={2}>
                    <TextField />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>合計</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <TextField disabled />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>消費税</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <TextField />
                  </Grid2>
                  <Grid2 size={1} display={'flex'}>
                    <TextField />
                    <Typography alignSelf={'center'}>%</Typography>
                  </Grid2>
                </Grid2>
                <Grid2 container display={'flex'} alignItems={'center'} spacing={0.5} my={0.5}>
                  <Grid2 size={'grow'} />
                  <Grid2 size={1.5} justifyItems={'end'}>
                    <Typography>合計金額</Typography>
                  </Grid2>
                  <Grid2 size={2}>
                    <TextField disabled />
                  </Grid2>
                  <Grid2 size={1} />
                </Grid2>
              </Box>
            </Box>
          </Paper>
        </LocalizationProvider>
      </form>
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
