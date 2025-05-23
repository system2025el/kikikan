'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import DateX from '@/app/(main)/_ui/date';
import { SelectTable } from '@/app/(main)/_ui/table';

import { quotation, quotationHeaders, quotationRows, terms } from '../_lib/data';

export const Quotation = () => {
  const [selectInputPerson, setSelectInputPerson] = useState('XXXXXXXX');
  const [selectPlace, setSelectPlace] = useState('Zepp Osaka');
  const [selectPartner, setSelectPartner] = useState('（株）シアターブレーン');
  const [selectOrderStatus, setSelectOrderStatus] = useState('確定');
  const [selectQuotationStatus, setSelectQuotationStatus] = useState('処理中');
  const [selectRequestStatus, setSelectRequestStatus] = useState('処理中');

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

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor={grey[300]}>
        <Typography margin={1}>見積書</Typography>
        <Box>
          <Button sx={{ margin: 1 }}>編集</Button>
          <Button sx={{ margin: 1 }}>保存</Button>
        </Box>
        <Button sx={{ margin: 1 }}>複製</Button>
      </Box>
      {/* 受注選択
      ----------------------------------------------------------------------------------*/}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandLessIcon />}>
          <Typography component="span">受注選択</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Box display="flex">
            <Box width="55%" bgcolor={grey[200]}>
              <Box my={1} mx={2}>
                <Button href="/order-list">受注選択</Button>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>受注番号</Typography>
                <TextField disabled size="small"></TextField>
                <Typography marginLeft={5} marginRight={1}>
                  受注ステータス
                </Typography>
                <FormControl disabled size="small" sx={{ width: '25%' }}>
                  <Select value={selectOrderStatus} onChange={orderStatusChange}>
                    <MenuItem value={'確定'}>確定</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>受注日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>入力者</Typography>
                <FormControl disabled size="small" sx={{ width: '25%' }}>
                  <Select value={selectInputPerson} onChange={inputPersonChange}>
                    <MenuItem value={'XXXXXXXX'}>XXXXXXXX</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>受注開始</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>受注終了</Typography>
                <DateX />
              </Box>
            </Box>
            <Box marginLeft={4} width="45%" bgcolor={grey[200]}>
              <Box sx={styles.container}>
                <Typography marginRight={7}>公演名</Typography>
                <TextField disabled size="small" defaultValue="A/Zepp Tour" sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>公演場所</Typography>
                <FormControl disabled size="small" sx={{ width: '50%' }}>
                  <Select value={selectPlace} onChange={placeChange}>
                    <MenuItem value={'Zepp Osaka'}>Zepp Osaka</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>相手</Typography>
                <FormControl disabled size="small" sx={{ width: '50%' }}>
                  <Select value={selectPartner} onChange={partnerChange}>
                    <MenuItem value={'（株）シアターブレーン'}>（株）シアターブレーン</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>受注メモ</Typography>
                <TextField disabled size="small" defaultValue="XXXXXXXXX" sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>受注値引き</Typography>
                <TextField disabled size="small"></TextField>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      {/* 見積ヘッダー
      ----------------------------------------------------------------------------------*/}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandLessIcon />}>
          <Typography component="span">見積ヘッダー</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Box display="flex">
            <Box width="55%" bgcolor={grey[200]}>
              <Box my={1} mx={2}>
                <FormGroup>
                  <FormControlLabel control={<Checkbox defaultChecked />} label="見積対象" />
                </FormGroup>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>見積番号</Typography>
                <TextField disabled size="small"></TextField>
                <Typography marginLeft={5} marginRight={1}>
                  見積ステータス
                </Typography>
                <FormControl size="small" sx={{ width: '25%' }}>
                  <Select value={selectQuotationStatus} onChange={quotationStatusChange}>
                    <MenuItem value={'処理中'}>処理中</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>見積日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>見積入力者</Typography>
                <TextField disabled size="small"></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>見積郵送日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={1}>見積有効期限</Typography>
                <DateX />
              </Box>
            </Box>
            <Box marginLeft={4} width="45%" bgcolor={grey[200]}>
              <Box sx={styles.container}>
                <Typography marginRight={5}>見積件名</Typography>
                <TextField size="small" defaultValue="A/Zepp Tour" sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>見積先</Typography>
                <Autocomplete
                  freeSolo
                  options={quotation}
                  sx={{ width: '50%' }}
                  renderInput={(params) => <TextField {...params} />}
                />
                {/* <FormControl size="small" sx={{ width: '50%' }}>
                  <Select value={selectQuotation} onChange={quotationChange}>
                    <MenuItem value={'（株）シアターブレーン'}>（株）シアターブレーン</MenuItem>
                  </Select>
                </FormControl> */}
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>取引条件</Typography>
                <Autocomplete
                  freeSolo
                  options={terms}
                  sx={{ width: '50%' }}
                  renderInput={(params) => <TextField {...params} />}
                />
                {/* <FormControl size="small" sx={{ width: '50%' }}>
                  <Select value={selectTransactions} onChange={transactionsChange}>
                    <MenuItem value={''}></MenuItem>
                  </Select>
                </FormControl> */}
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>見積メモ</Typography>
                <TextField size="small" sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>見積値引き</Typography>
                <TextField size="small"></TextField>
                <Button sx={{ marginLeft: 4 }}>値引追加</Button>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      {/* 請求情報
      ----------------------------------------------------------------------------------*/}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandLessIcon />}>
          <Typography component="span">請求情報</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Box display="flex">
            <Box width="55%" bgcolor={grey[200]}>
              <Box my={1} mx={2}>
                <FormGroup>
                  <FormControlLabel control={<Checkbox defaultChecked />} label="請求対象" />
                </FormGroup>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>請求番号</Typography>
                <TextField disabled size="small"></TextField>
                <Typography marginLeft={5} marginRight={1}>
                  請求ステータス
                </Typography>
                <FormControl size="small" sx={{ width: '25%' }}>
                  <Select value={selectRequestStatus} onChange={requestStatusChange}>
                    <MenuItem value={'処理中'}>処理中</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>請求日</Typography>
                <DateX />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>入力者</Typography>
                <TextField disabled size="small"></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={1}>請求有効期限</Typography>
                <DateX />
              </Box>
            </Box>
            <Box marginLeft={4} width="45%" bgcolor={grey[200]}>
              <Box sx={styles.container}>
                <Typography marginRight={5}>請求件名</Typography>
                <TextField size="small" defaultValue="A/Zepp Tour" sx={{ width: '50%' }}></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>請求先</Typography>
                <Autocomplete
                  freeSolo
                  options={quotation}
                  sx={{ width: '50%' }}
                  renderInput={(params) => <TextField {...params} />}
                />
                {/* <FormControl size="small" sx={{ width: '50%' }}>
                  <Select value={selectRequest} onChange={requestChange}>
                    <MenuItem value={'（株）シアターブレーン'}>（株）シアターブレーン</MenuItem>
                  </Select>
                </FormControl> */}
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>請求メモ</Typography>
                <TextField size="small" sx={{ width: '50%' }}></TextField>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
      {/* 見積明細
      ----------------------------------------------------------------------------------*/}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandLessIcon />} component="div">
          <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
            <Box width="35%">
              <Typography>見積明細</Typography>
            </Box>
            <Box width="65%" display="flex" alignItems="center" justifyContent="space-evenly">
              <Box display="flex" alignItems="center">
                <Typography mx={1}>合計金額</Typography>
                <TextField
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                ></TextField>
              </Box>
              <Button
                href="/new-order/equipment-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                ＋ 機材入力
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
                － 削除
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                見積書印刷
              </Button>
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <SelectTable headers={quotationHeaders} datas={quotationRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
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
    margin: 2,
    marginLeft: 2,
  },
};
