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
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { blueGrey } from '@mui/material/colors';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { AutocompleteElement, CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';
import { ZodSchema } from 'zod';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';
import { SelectTable } from '@/app/(main)/_ui/table';
import { getCustomerSelection } from '@/app/(main)/(masters)/_lib/funs';
import { GetJuchuHead } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';
import { FormDateX } from '@/app/(main)/order-list/_ui/order-list';

import { quotation, quotationHeaders, quotationRows, terms } from '../_lib/data';
import { getMituStsSelection, getOrderForQuotation, getUsersSelection } from '../_lib/func';
import { JuchuValues, QuotHeadSchema, QuotHeadValues } from '../_lib/types';

export const Quotation = () => {
  /* ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  /* debug用、レンダリング回数取得に使用 */
  const hasRun = useRef(false);
  /* ローディング中かどうか */
  const [isLoading, setIsLoading] = useState(true);
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
  // 明細アコーディオン制御
  const [meisaiExpanded, setMeisaiExpanded] = useState(false);

  // ダイアログ開閉
  const [kizaiMeisaiaddDialogOpen, setKizaimeisaiaddDialogOpen] = useState(false);

  /* useForm -------------------------------------------------------------- */
  const { control, handleSubmit, reset, getValues } = useForm<QuotHeadValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(QuotHeadSchema),
    defaultValues: {
      mituHeadId: null,
      juchuHeadId: null,
      mituSts: null,
      mituDat: new Date(),
      mituYukoDat: null,
      mituHeadNam: '',
      kokyaku: null,
      nyuryokuUser: { id: String(user?.id), name: user?.name },
      lendRange: { strt: null, end: null },
      kokyakuTantoNam: null,
      koenNam: null,
      koenbashoNam: null,
      torihikiHoho: null,
      mituHonbanbiQty: null,
      biko: null,
      meisaiHeads: {
        kizai: [{ mituMeisaiHeadNam: '', headNamDspFlg: false }],
      },
    },
  });

  const kizaiFields = useFieldArray({ control, name: 'meisaiHeads.kizai' });

  /* methods ------------------------------------------------------ */
  /* 保存ボタン押下 */
  const onSubmit = async (data: QuotHeadValues) => {
    console.log(data);
  };

  // 受注選択アコーディオン開閉
  const handleJuchuExpansion = () => {
    setJuchuExpanded(!juchuExpanded);
  };
  // 見積ヘッダアコーディオン開閉
  const handleMitsuExpansion = () => {
    setMitsuExpanded(!mitsuExpanded);
  };
  // 明細アコーディオン開閉
  const handleMeisaiExpansion = () => {
    setMeisaiExpanded(!meisaiExpanded);
  };
  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
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
      //   lendRange: { strt: savedData.juchuRange.strt, end: savedData.juchuRange.end },
      //   ...savedData,
      // });
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
            const orderData: JuchuValues = {
              juchuHeadId: data?.juchuHeadId,
              juchuSts: data?.juchuSts,
              juchuDat: data?.juchuDat,
              juchuRange: {
                strt: data?.juchuRange!.strt,
                end: data?.juchuRange!.end,
              },
              nyuryokuUser: data?.nyuryokuUser,
              koenNam: data?.koenNam,
              koenbashoNam: data?.koenbashoNam,
              kokyaku: data?.kokyaku ?? { id: null, name: null },
              kokyakuTantoNam: data?.kokyakuTantoNam,
              mem: data?.mem,
              nebikiAmt: data?.nebikiAmt,
              zeiKbn: data?.zeiKbn,
            };
            reset({
              kokyakuTantoNam: orderData.kokyakuTantoNam,
              kokyaku: orderData.kokyaku.name,
              koenNam: orderData.koenNam,
              koenbashoNam: orderData.koenbashoNam,
              lendRange: { strt: orderData.juchuRange.strt, end: orderData.juchuRange.end },
            });
            console.log('DB', orderData);
            setOrder(orderData);
            sessionStorage.setItem('currentOrder', JSON.stringify(orderData));
            sessionStorage.removeItem('juchuHeadId');
            await setIsLoading(false);
          };
          getjuchu(Number(juchuId));
        } else if (quotId && quotId !== '') {
          // 見積一覧テーブルから選択して開いている
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
                      matchId
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
                      name="lendRange.strt"
                      control={control}
                      render={({ field }) => (
                        <FormDateX value={field.value} onChange={field.onChange} sx={{ width: 242.5 }} />
                      )}
                    />
                    ～
                    <Controller
                      name="lendRange.end"
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
          <Accordion
            expanded={meisaiExpanded}
            onChange={handleMeisaiExpansion}
            sx={{ marginTop: 1 }}
            variant="outlined"
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="span">見積明細</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0, pb: 1 }}>
              <Divider />
              <Typography variant="body1" pt={1} pl={2}>
                機材費
              </Typography>
              {/**・・・・・・・・・・・ field.mapで動的なフォーム作る予定・・・・・・・・ */}
              {kizaiFields.fields.map((field, index) => (
                <Box key={field.id}>
                  <Grid2 container alignItems={'end'}>
                    <Grid2 size={1} />
                    <Grid2 size={5} display={'flex'} alignItems={'base-line'}>
                      <TextFieldElement name={`meisaiHeads.kizai.${index}.mituMeisaiHeadNam`} control={control} />
                      <CheckboxElement
                        name={`meisaiHeads.kizai.${index}.headNamDspFlg`}
                        control={control}
                        sx={{ ml: 1 }}
                        label="タイトルを見積書に出力する"
                        labelProps={{
                          sx: { typography: 'caption', textAlign: 'start' },
                        }}
                      />
                    </Grid2>
                    <Grid2 size={'grow'} justifyItems={'end'}>
                      <Box>
                        <Button
                          color="error"
                          onClick={() => {
                            kizaiFields.remove(index);
                          }}
                        >
                          削除
                        </Button>
                      </Box>
                    </Grid2>
                    <Grid2 size={1} />
                  </Grid2>
                  <Grid2
                    container
                    px={2}
                    sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}
                    alignItems={'end'}
                  >
                    <Grid2 size={0.5} />
                    <Grid2 size={6}>
                      <Typography variant="body2" fontWeight={500}>
                        名称
                      </Typography>
                    </Grid2>
                    <Grid2 size={1}>
                      <Typography variant="body2" fontWeight={500}>
                        数量
                      </Typography>
                    </Grid2>
                    <Grid2 size={1}>
                      <Typography variant="body2" fontWeight={500}>
                        仕様日
                      </Typography>
                    </Grid2>
                    <Grid2 size={1}>
                      <Typography variant="body2" fontWeight={500}>
                        単価
                      </Typography>
                    </Grid2>
                    <Grid2 size={1}>
                      <Typography variant="body2" fontWeight={500}>
                        小計
                      </Typography>
                    </Grid2>
                    <Grid2 size={1}></Grid2>
                  </Grid2>
                  {/*kizaiMeisaiFields.fields.map((f, i) => (
                    <Box key={f.id}>
                      <Grid2 container px={2} alignItems={'center'}>
                        <Grid2 size={0.5}>
                          <Button onClick={() => kizaiMeisaiFields.remove(i)}>削除</Button>
                        </Grid2>
                        <Grid2 size={6}>
                          <TextFieldElement name={`meisaiHeads.kizai.${index}.meisai.${i}.nam`} control={control} />
                        </Grid2>
                        <Grid2 size={1}>
                          <Typography variant="body2" fontWeight={500}>
                            <TextField />
                          </Typography>
                        </Grid2>
                        <Grid2 size={1}>
                          <TextField />
                        </Grid2>
                        <Grid2 size={1}>
                          <TextField />
                        </Grid2>
                        <Grid2 size={1}>
                          <TextField />
                        </Grid2>
                        <Grid2 size={1}></Grid2>
                      </Grid2>
                    </Box>
                  ))*/}
                  <Button size="small" /*onClick={() => kizaiMeisaiFields.append({ nam: null })}*/>
                    <AddIcon fontSize="small" />
                    項目
                  </Button>
                  <Button size="small" onClick={() => setKizaimeisaiaddDialogOpen(true)}>
                    <AddIcon fontSize="small" />
                    テーブル
                  </Button>
                </Box>
              ))}
              <Dialog open={kizaiMeisaiaddDialogOpen} onClose={() => setKizaimeisaiaddDialogOpen(false)}>
                <Box>機材明細から自動生成しますか</Box>
                <DialogActions>
                  <Button>はい</Button>
                  <Button
                    onClick={() => {
                      kizaiFields.append({ mituMeisaiHeadNam: null, headNamDspFlg: false });
                      setKizaimeisaiaddDialogOpen(false);
                    }}
                  >
                    いいえ
                  </Button>
                </DialogActions>
              </Dialog>
            </AccordionDetails>
          </Accordion>
          {/* 見積明細
      ----------------------------------------------------------------------------------*/}
          <Accordion sx={{ marginTop: 1 }} variant="outlined">
            <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
              <Grid2
                container
                alignItems="center"
                justifyContent="space-between"
                pt={2}
                sx={{ width: '100%' }}
                spacing={1}
              >
                <Grid2>
                  <Typography>見積明細</Typography>
                </Grid2>
                <Grid2 container display="flex" alignItems="center" spacing={1}>
                  <Typography>合計金額</Typography>
                  <TextField
                    sx={{
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                        padding: 1,
                      },
                    }}
                    value={'¥' /*+ priceTotal*/}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </Grid2>
                <Grid2 container spacing={1}>
                  <Button
                    href="/new-order/equipment-order-detail"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    機材入力
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    受注からコピー
                  </Button>
                  <Button
                    sx={{ bgcolor: 'red' }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    削除
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    見積書印刷
                  </Button>
                </Grid2>
              </Grid2>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: 0 }}>
              <SelectTable headers={quotationHeaders} datas={quotationRows} onSelectionChange={handleSelectionChange} />
            </AccordionDetails>
          </Accordion>
        </LocalizationProvider>
      </form>
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
