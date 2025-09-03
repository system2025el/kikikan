'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
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
import { useEffect, useRef, useState } from 'react';

import { toJapanDateString, toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import DateX from '@/app/(main)/_ui/date';
import { SelectTable } from '@/app/(main)/_ui/table';
import { GetJuchuHead } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';

import { quotation, quotationHeaders, quotationRows, terms } from '../_lib/data';
import { getOrderForQuotation } from '../_lib/func';

export type JuchuValues = {
  juchuHeadId: number | undefined | null;
  delFlg?: number;
  juchuSts: string | undefined | null;
  juchuDat: Date | undefined | null;
  juchuRange: { strt: Date | undefined | null; end: Date | undefined | null };
  nyuryokuUser: string | undefined | null;
  koenNam: string | undefined | null;
  koenbashoNam: string | undefined | null;
  kokyaku: string | undefined | null;
  kokyakuTantoNam?: string | undefined | null;
  mem: string | undefined | null;
  nebikiAmt: number | undefined | null;
  zeiKbn?: number | undefined | null;
};

export const Quotation = () => {
  const [selectInputPerson, setSelectInputPerson] = useState('XXXXXXXX');
  const [selectPlace, setSelectPlace] = useState('Zepp Osaka');
  const [selectPartner, setSelectPartner] = useState('（株）シアターブレーン');
  const [selectOrderStatus, setSelectOrderStatus] = useState('確定');
  const [selectQuotationStatus, setSelectQuotationStatus] = useState('処理中');
  const [selectRequestStatus, setSelectRequestStatus] = useState('処理中');

  const [order, setOrder] = useState<JuchuValues>({
    juchuHeadId: null,
    juchuSts: '',
    juchuDat: null,
    juchuRange: { strt: null, end: null },
    nyuryokuUser: '',
    koenNam: '',
    koenbashoNam: '',
    kokyaku: '',
    mem: '',
    nebikiAmt: null,
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
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      const id = sessionStorage.getItem('juchuHeadId');
      console.log('ダイアログで選んだID', id);
      if (!id) {
        console.log('null');
        return;
      }
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
          mem: data?.mem ?? '',
          nebikiAmt: data?.nebikiAmt ?? null,
        };
        console.log('DB', orderData);
        setOrder(orderData);
      };
      getjuchu(Number(id));
      sessionStorage.clear();
    }
  }, []);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
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

      {/* 受注選択
      ----------------------------------------------------------------------------------*/}
      <Accordion expanded={expanded} onChange={handleExpansion} sx={{ marginTop: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Grid2 container alignItems={'center'} width={'100%'}>
            <Grid2 size={3}>
              <Typography component="span">受注選択</Typography>
            </Grid2>
            <Grid2 size={'grow'} alignItems={'center'} display={expanded ? 'none' : 'flex'}>
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
            <Grid2 size={6}>
              <Grid2 container mx={2} my={1} spacing={6}>
                <Grid2 display="flex" alignItems="center">
                  <Typography marginRight={5}>受注番号</Typography>
                  <TextField value={order.juchuHeadId ?? ''} disabled sx={{ width: 120 }} />
                </Grid2>
                <Grid2 display="flex" alignItems="center">
                  <Typography marginRight={3}>受注ステータス</Typography>
                  <TextField value={order.juchuSts ?? ''} disabled sx={{ width: 120 }} />
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
            <Grid2 size={6}>
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
                <Typography marginRight={5}>受注メモ</Typography>
                <TextField multiline value={order.mem} disabled sx={{ width: 300 }} />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>受注値引き</Typography>
                <TextField value={order.nebikiAmt} disabled sx={{ width: 300 }} />
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>

      {/* 見積ヘッダー
      ----------------------------------------------------------------------------------*/}
      <Accordion sx={{ marginTop: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography component="span">見積ヘッダー</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Box pt={2} pl={2}>
            <FormGroup>
              <FormControlLabel control={<Checkbox defaultChecked />} label="見積対象" />
            </FormGroup>
          </Box>
          <Grid2 container>
            <Grid2>
              <Grid2 container margin={2} spacing={2}>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={5}>見積番号</Typography>
                  <TextField disabled></TextField>
                </Grid2>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={1}>見積ステータス</Typography>
                  <FormControl size="small" sx={{ width: 150 }}>
                    <Select value={selectQuotationStatus} onChange={quotationStatusChange}>
                      <MenuItem value={'処理中'}>処理中</MenuItem>
                    </Select>
                  </FormControl>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={7}>見積日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>見積入力者</Typography>
                <TextField disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>見積郵送日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={1}>見積有効期限</Typography>
                <DateX />
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5}>見積件名</Typography>
                <TextField defaultValue="A/Zepp Tour" sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>見積先</Typography>
                <Autocomplete
                  freeSolo
                  options={quotation}
                  sx={{ width: '50%' }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>取引条件</Typography>
                <Autocomplete
                  freeSolo
                  options={terms}
                  sx={{ width: '50%' }}
                  renderInput={(params) => <TextField {...params} />}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>見積メモ</Typography>
                <TextField sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>見積値引き</Typography>
                <TextField></TextField>
                <Button sx={{ marginLeft: 4 }}>値引追加</Button>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/* 請求情報
      ----------------------------------------------------------------------------------*/}
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
              <Grid2 container margin={2} spacing={2}>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={5}>請求番号</Typography>
                  <TextField disabled></TextField>
                </Grid2>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={1}>請求ステータス</Typography>
                  <FormControl size="small" sx={{ width: 150 }}>
                    <Select value={selectRequestStatus} onChange={requestStatusChange}>
                      <MenuItem value={'処理中'}>処理中</MenuItem>
                    </Select>
                  </FormControl>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={7}>請求日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>入力者</Typography>
                <TextField disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={1}>請求有効期限</Typography>
                <DateX />
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5}>請求件名</Typography>
                <TextField defaultValue="A/Zepp Tour" sx={{ width: '50%' }}></TextField>
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
                <TextField sx={{ width: '50%' }}></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/* 見積明細
      ----------------------------------------------------------------------------------*/}
      <Accordion sx={{ marginTop: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" pt={2} sx={{ width: '100%' }} spacing={1}>
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
              ></TextField>
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
