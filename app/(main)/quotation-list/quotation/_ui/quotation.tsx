'use client';

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
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import Loadable from 'next/dist/shared/lib/loadable.shared-runtime';
import { useEffect, useRef, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';
import { SelectTable } from '@/app/(main)/_ui/table';
import { GetJuchuHead } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';
import { SearchDateX } from '@/app/(main)/order-list/_ui/order-list';

import { quotation, quotationHeaders, quotationRows, terms } from '../_lib/data';
import { getOrderForQuotation } from '../_lib/func';
import { JuchuValues } from '../_lib/types';

export const Quotation = () => {
  /* ログイン中のユーザー */
  const user = useUserStore((state) => state.user);
  const [selectInputPerson, setSelectInputPerson] = useState('XXXXXXXX');
  const [selectPlace, setSelectPlace] = useState('Zepp Osaka');
  const [selectPartner, setSelectPartner] = useState('（株）シアターブレーン');
  const [selectOrderStatus, setSelectOrderStatus] = useState('確定');
  const [selectQuotationStatus, setSelectQuotationStatus] = useState('処理中');
  const [selectRequestStatus, setSelectRequestStatus] = useState('処理中');
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<JuchuValues>({
    juchuHeadId: null,
    juchuSts: '',
    juchuDat: null,
    juchuRange: { strt: null, end: null },
    nyuryokuUser: '',
    koenNam: '',
    koenbashoNam: '',
    kokyaku: '',
    kokyakuTantoNam: '',
    mem: '',
    nebikiAmt: null,
    zeiKbn: '',
  });

  const priceTotal = quotationRows.reduce((sum, row) => sum + row.price, 0);

  const inputPersonChange = (event: SelectChangeEvent) => {
    setSelectInputPerson(event.target.value);
  };
  const placeChange = (event: SelectChangeEvent) => {
    setSelectPlace(event.target.value);
  };
  const partnerChange = (event: SelectChangeEvent) => {
    setSelectPartner(event.target.value);
  };
  const orderStatusChange = (event: SelectChangeEvent) => {
    setSelectOrderStatus(event.target.value);
  };
  const quotationStatusChange = (event: SelectChangeEvent) => {
    setSelectQuotationStatus(event.target.value);
  };
  const requestStatusChange = (event: SelectChangeEvent) => {
    setSelectRequestStatus(event.target.value);
  };

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };
  const hasRun = useRef(false);

  /*  */
  useEffect(() => {
    const savedOrderData = sessionStorage.getItem('currentOrder');
    if (savedOrderData) {
      setOrder(JSON.parse(savedOrderData));
      setIsLoading(false);
      return; // 保存されたデータがあれば、それで処理を終了
    }
    if (!hasRun.current) {
      hasRun.current = true;
      const juchuId = sessionStorage.getItem('juchuHeadId');
      const quotId = sessionStorage.getItem('mitsumoriId');
      console.log('ダイアログで選んだID', juchuId);
      console.log('テーブルで選んだID', quotId);
      if (!juchuId && !quotId) {
        console.log('null');
        setIsLoading(false);
        return;
      } else {
        if (juchuId && juchuId !== '') {
          const getjuchu = async (id: number) => {
            const data = await getOrderForQuotation(id);
            const orderData: JuchuValues = {
              juchuHeadId: data?.juchuHeadId,
              juchuSts: data?.juchuSts ?? '',
              juchuDat: data?.juchuDat ?? null,
              juchuRange: {
                strt: data?.juchuRange!.strt ?? null,
                end: data?.juchuRange!.end ?? null,
              },
              nyuryokuUser: data?.nyuryokuUser ?? '',
              koenNam: data?.koenNam ?? '',
              koenbashoNam: data?.koenbashoNam ?? '',
              kokyaku: data?.kokyaku ?? '',
              kokyakuTantoNam: data?.kokyakuTantoNam ?? '',
              mem: data?.mem ?? '',
              nebikiAmt: data?.nebikiAmt ?? null,
              zeiKbn: data?.zeiKbn ?? '',
            };
            console.log('DB', orderData);
            setOrder(orderData);
            sessionStorage.setItem('currentOrder', JSON.stringify(orderData));
            sessionStorage.removeItem('juchuHeadId');
            await setIsLoading(false);
          };
          getjuchu(Number(juchuId));
        } else if (quotId && quotId !== '') {
          const getMitsumori = async (id: number) => {
            console.log('DB, the QuoteId is ', id);
            // setOrder(orderData);
            // sessionStorage.setItem('currentOrder', JSON.stringify(orderData));
            sessionStorage.removeItem('juchuHeadId');
            setIsLoading(false);
          };
          getMitsumori(Number(quotId));
        }
      }
    }
  }, []);

  // 受注選択アコーディオン制御
  const [juchuExpanded, setJuchuExpanded] = useState(false);
  // 受注選択アコーディオン開閉
  const handleJuchuExpansion = () => {
    setJuchuExpanded(!juchuExpanded);
  };

  // 見積ヘッダアコーディオン制御
  const [mitsuExpanded, setMitsuExpanded] = useState(false);
  // 見積ヘッダアコーディオン開閉
  const handleMitsuExpansion = () => {
    setMitsuExpanded(!mitsuExpanded);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={1}>
          <Typography margin={1}>見積書</Typography>
          <Box>
            {/* <Button sx={{ margin: 1 }}>編集</Button> */}
            <Button sx={{ margin: 1 }}>見積書印刷</Button>
            {/* <Button sx={{ margin: 1 }}>複製</Button> */}
            <Button sx={{ margin: 1 }}>保存</Button>
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
        <Accordion expanded={juchuExpanded} onChange={handleJuchuExpansion} sx={{ marginTop: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Grid2 container alignItems={'center'} width={'100%'}>
              <Grid2 size={3}>
                <Typography component="span">受注選択</Typography>
              </Grid2>
              <Grid2 size={'grow'} alignItems={'center'} display={juchuExpanded ? 'none' : 'flex'}>
                <Typography marginRight={2}>公演名</Typography>
                <Typography>{order.koenNam}</Typography>
              </Grid2>
            </Grid2>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0, pb: 1 }}>
            <Divider />
            <Box pt={2} pl={2}>
              <Button /*href="/order-list"*/>受注選択</Button>
            </Box>
            <Grid2 container>
              <Grid2 size={6.5}>
                <Grid2 container mx={2} my={1} spacing={6}>
                  <Grid2 display="flex" alignItems="center">
                    <Typography marginRight={5}>受注番号</Typography>
                    <TextField value={order.juchuHeadId ?? ''} disabled sx={{ width: 120 }} />
                  </Grid2>
                  <Grid2 display="flex" alignItems="center">
                    <Typography marginRight={3}>受注ステータス</Typography>
                    <TextField value={order.juchuSts} disabled sx={{ width: 180 }} />
                  </Grid2>
                </Grid2>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>受注日</Typography>
                  <TextField value={order.juchuDat ? toJapanDateString(order.juchuDat) : ''} disabled />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>入力者</Typography>
                  <TextField value={order.nyuryokuUser} disabled />
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
                  <TextField value={order.koenNam} disabled sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>公演場所</Typography>
                  <TextField value={order.koenbashoNam} disabled sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={9}>相手</Typography>
                  <TextField value={order.kokyaku} disabled sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>担当者</Typography>
                  <TextField value={order.kokyakuTantoNam} disabled sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>受注メモ</Typography>
                  <TextField multiline value={order.mem} disabled sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={3}>受注値引き</Typography>
                  <TextField value={order.nebikiAmt ?? ''} disabled sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>税区分</Typography>
                  <TextField value={order.zeiKbn} disabled sx={{ width: 120 }} />
                </Box>
              </Grid2>
            </Grid2>
          </AccordionDetails>
        </Accordion>

        {/* 見積ヘッダー ----------------------------------------------------------------------------------*/}
        <Accordion expanded={mitsuExpanded} onChange={handleMitsuExpansion} sx={{ marginTop: 2 }}>
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
                    <TextField disabled sx={{ width: 120 }} />
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={3}>見積ステータス</Typography>
                    <FormControl size="small" sx={{ width: 180 }}>
                      <Select value={selectQuotationStatus} onChange={quotationStatusChange}>
                        <MenuItem value={0}>未処理</MenuItem>
                        <MenuItem value={1}>入力中</MenuItem>
                        <MenuItem value={2}>仮見積</MenuItem>
                        <MenuItem value={3}>処理中</MenuItem>
                        <MenuItem value={4}>郵送済み</MenuItem>
                        <MenuItem value={5}>未郵送</MenuItem>
                        <MenuItem value={6}>郵送済日有で未郵送</MenuItem>
                        <MenuItem value={9}>完了</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                </Grid2>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>見積件名</Typography>
                  <TextField defaultValue="" sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>見積日</Typography>
                  <SearchDateX />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={3}>見積作成者</Typography>
                  <Autocomplete
                    value={user?.name ?? ''}
                    renderInput={(params) => <TextField {...params} sx={{ width: 242.5 }} />}
                    options={[]}
                  />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>見積先</Typography>
                  <Autocomplete
                    freeSolo
                    options={quotation}
                    sx={{ width: 300 }}
                    value={order.kokyaku}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={3}>見積担当者</Typography>
                  <TextField value={order.kokyakuTantoNam} sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={1}>見積有効期限</Typography>
                  <SearchDateX />
                </Box>
              </Grid2>
              <Grid2 size={5.5}>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>作品名</Typography>
                  <TextField value={order.koenNam} sx={{ width: 300 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>実施場所</Typography>
                  <TextField value={order.koenbashoNam} sx={{ width: 300 }} />
                </Box>

                <Box sx={styles.container}>
                  <Typography marginRight={5}>取引方法</Typography>
                  <Autocomplete
                    freeSolo
                    options={terms}
                    sx={{ width: 300 }}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>貸出期間</Typography>
                  <SearchDateX />～<SearchDateX />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>本番日数</Typography>
                  <TextField sx={{ width: 120 }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={9}>備考</Typography>
                  <TextField multiline sx={{ width: 300 }} />
                </Box>
              </Grid2>
            </Grid2>
          </AccordionDetails>
        </Accordion>

        {/* 請求情報 ----------------------------------------------------------------------------------*/}
        <Accordion sx={{ marginTop: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography component="span">請求情報</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0 }}>
            <Divider />
            <Box pt={2} pl={2}>
              <FormGroup>
                <FormControlLabel control={<Checkbox defaultChecked />} label="請求対象" />
              </FormGroup>
            </Box>
            <Grid2 container>
              <Grid2>
                <Grid2 container margin={2} spacing={6}>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={5}>請求番号</Typography>
                    <TextField disabled />
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={3}>請求ステータス</Typography>
                    <FormControl size="small" sx={{ width: 180 }}>
                      <Select value={selectRequestStatus} onChange={requestStatusChange}>
                        <MenuItem value={'処理中'}>処理中</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                </Grid2>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>請求日</Typography>
                  <SearchDateX />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>入力者</Typography>
                  <TextField disabled />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={1}>請求有効期限</Typography>
                  <SearchDateX />
                </Box>
              </Grid2>
              <Grid2>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>請求件名</Typography>
                  <TextField defaultValue="A/Zepp Tour" sx={{ width: '50%' }} />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={7}>請求先</Typography>
                  <Autocomplete
                    freeSolo
                    options={quotation}
                    sx={{ width: '50%' }}
                    renderInput={(params) => <TextField {...params} />}
                  />
                </Box>
                <Box sx={styles.container}>
                  <Typography marginRight={5}>請求メモ</Typography>
                  <TextField sx={{ width: '50%' }} />
                </Box>
              </Grid2>
            </Grid2>
          </AccordionDetails>
        </Accordion>
        {/* 見積明細
      ----------------------------------------------------------------------------------*/}
        <Accordion sx={{ marginTop: 2 }}>
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
                  value={'¥' + priceTotal}
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
