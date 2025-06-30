'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import { Dayjs } from 'dayjs';
import { useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { TestDate, toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';
import Time from '@/app/(main)/_ui/time';

import { EquipmentSelectionDialog } from '../../equipment-order-detail/_ui/equipment-selection-dailog';
import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { data, stock } from '../_lib/data';
import { ReturnEqTable, ReturnStockTable } from './returnslip-table';

export type EquipmentData = {
  date: string;
  memo: string;
};

export type StockData = {
  id: number;
  data: number[];
};

export type Equipment = {
  id: number;
  name: string;
  memo: string;
  place: string;
  issue: number;
  return: number;
};

// 開始日から終了日までの日付配列の作成
const getRange = (start: Date, end: Date): string[] => {
  if (start !== null && end !== null) {
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

// ストックテーブルの日付ヘッダーの作成
const getStockHeader = (date: Date) => {
  if (date !== null) {
    const start = subDays(date, 1);
    const end = endOfMonth(addMonths(date, 2));
    const range: string[] = [];
    const current = new Date(start);

    while (current <= end) {
      const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
      range.push(dateStr);
      current.setDate(current.getDate() + 1);
    }

    return range;
  }
  return [];
};

// ストックテーブルの行作成
const getStockRow = (eq: Equipment[], stock: number[], length: number) => {
  const rows: StockData[] = [];

  stock.map((num, index) => {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      if (i === 0 || i === 1 || i === 2 || i === 3) {
        data.push(num - eq[index].issue);
      } else {
        data.push(num);
      }
    }
    const row: StockData = { id: index + 1, data: data };
    rows.push(row);
  });

  return rows;
};

export const ReturnSlip = () => {
  // KICS出庫日
  const [startKICSDate, setStartKICSDate] = useState<Date>(new Date('2025/11/2'));
  // YARD出庫日
  const [startYARDDate, setStartYARDDate] = useState<Date>(new Date('2025/11/2'));
  // KICS入庫日
  const [endKICSDate, setEndKICSDate] = useState<Date>(new Date('2025/11/4'));
  // YARD入庫日
  const [endYARDDate, setEndYARDDate] = useState<Date>(new Date('2025/11/4'));
  // KICS再度出庫日
  const [againKICSDate, setAgainKICSDate] = useState<Date>(new Date('2025/11/2'));
  // YARD再度出庫日
  const [againYARDDate, setAgainYARDDate] = useState<Date>(new Date('2025/11/2'));
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(getRange(new Date('2025/11/2'), new Date('2025/11/19')));

  // ヘッダー用の日付
  const [dateHeader, setDateHeader] = useState<string[]>(getStockHeader(startKICSDate));
  // ストックテーブルの行配列
  const [stockRows, setStockRows] = useState<StockData[]>(getStockRow(data, stock, dateHeader.length));
  // 機材テーブルの行配列
  const [equipmentRows, setEquipmentRows] = useState<Equipment[]>(data);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);

  /**
   * 再度出庫日時変更時
   * @param newDate 入庫日
   */
  const handleAgainChange = (newDate: Dayjs | null) => {
    if (newDate !== null) {
      setAgainKICSDate(newDate?.toDate());
    }
  };

  /**
   * 入庫日時変更時
   * @param newDate 入庫日
   */
  const handleEndChange = (newDate: Dayjs | null) => {
    if (newDate !== null) {
      setEndKICSDate(newDate?.toDate());
    }
  };

  /**
   * 機材メモ入力時
   * @param rowIndex 入力された行番号
   * @param memo メモ内容
   */
  const handleMemoChange = (rowIndex: number, memo: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].memo = memo;
    setEquipmentRows(updatedRows);
  };

  /**
   * 機材テーブルの返却数入力時
   * @param rowIndex 入力された行番号
   * @param orderValue 返却数
   */
  const handleCellChange = (rowIndex: number, returnValue: number) => {
    setEquipmentRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, return: returnValue } : row)));
    const updatedRow = getStockRow(data, stock, dateHeader.length);
    const updatedData = updatedRow[rowIndex].data;
    dateHeader.map((date, index) => {
      if (toISOStringWithTimezoneMonthDay(endKICSDate) === date) {
        updatedData[index] = updatedData[index] + returnValue;
      }
    });
    setStockRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, data: updatedData } : row)));
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };
  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = () => {
    setEqSelectionDialogOpen(true);
  };
  const handleCloseEqDialog = () => {
    setEqSelectionDialogOpen(false);
  };

  return (
    <Box>
      {/*受注ヘッダー*/}
      <Accordion expanded={expanded} onChange={handleExpansion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Box display="flex" justifyContent="space-between" alignItems="center" py={1} width="100%">
            <Grid2 container display="flex" justifyContent="space-between" spacing={2}>
              <Typography>受注ヘッダー</Typography>
              <Grid2 container display={expanded ? 'none' : 'flex'} spacing={2}>
                <Typography>公演名</Typography>
                <Typography>A/Zepp Tour</Typography>
              </Grid2>
            </Grid2>
            <BackButton label={'戻る'} />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container display="flex">
            <Grid2>
              <Grid2 container margin={2} spacing={2}>
                <Grid2 container display="flex" direction="row" alignItems="center">
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography marginRight={3} whiteSpace="nowrap">
                      受注番号
                    </Typography>
                    <TextField defaultValue="81694" disabled></TextField>
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography mr={2}>受注ステータス</Typography>
                    <TextField defaultValue="確定" disabled sx={{ width: 120 }}>
                      確定
                    </TextField>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注日
                </Typography>
                <TextField defaultValue="2025/10/01" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  入力者
                </Typography>
                <TextField defaultValue="XXXXXXXX" disabled></TextField>
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  公演名
                </Typography>
                <TextField defaultValue="A/Zepp Tour" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3} whiteSpace="nowrap">
                  公演場所
                </Typography>
                <TextField defaultValue="Zepp Osaka" disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  相手
                </Typography>
                <TextField defaultValue="(株)シアターブレーン" disabled></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細ヘッダー(返却)*/}
      <Accordion sx={{ mt: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div" sx={{ bgcolor: 'red', color: 'white' }}>
          <Grid2 container display="flex" justifyContent="space-between" spacing={2} py={1}>
            <Typography>受注機材ヘッダー(返却)</Typography>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container p={2} spacing={2}>
            <Grid2 width={500}>
              <Typography>出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate disabled date={startKICSDate} onChange={(newDate) => console.log()} />
                <Time disabled />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  disabled
                  date={startYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setStartYARDDate(newDate?.toDate());
                    }
                  }}
                />
                <Time disabled />
              </Grid2>
            </Grid2>
            <Grid2 width={500}>
              <Typography>入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate date={endKICSDate} onChange={handleEndChange} />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={endYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndYARDDate(newDate?.toDate());
                    }
                  }}
                />
                <Time />
              </Grid2>
            </Grid2>
            <Grid2 width={500}>
              <Box display={'flex'} alignItems={'center'}>
                <Checkbox sx={{ p: 0 }} />
                <Typography>キープ抜き・再出庫指示（出庫伝票自動作成）</Typography>
              </Box>
              <Typography>再出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate date={againKICSDate} onChange={handleAgainChange} />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={againYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndYARDDate(newDate?.toDate());
                    }
                  }}
                />
                <Time />
              </Grid2>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
          <Grid2 container spacing={2}>
            <Button>編集</Button>
            <Button>保存</Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container alignItems="center" spacing={2} p={2}>
          <Grid2 container alignItems="center">
            <Typography>機材明細名</Typography>
            <TextField
              value={'キープ一部返却'}
              sx={{
                '& .MuiInputBase-input': {
                  color: 'red',
                },
              }}
            />
          </Grid2>
          <Grid2 container alignItems="center">
            <Typography>小計金額</Typography>
            <TextField
              value={'-¥400000'}
              sx={{
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                  color: 'red',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
          </Grid2>
        </Grid2>
        <Dialog open={EqSelectionDialogOpen} fullScreen>
          <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
        </Dialog>
        <Button sx={{ m: 2 }} onClick={() => handleOpenEqDialog()}>
          ＋ 機材追加
        </Button>
        <Box display="flex" flexDirection="row" width="100%">
          <Box
            sx={{
              width: {
                xs: '40%',
                sm: '40%',
                md: '40%',
                lg: 'min-content',
              },
            }}
          >
            <ReturnEqTable rows={equipmentRows} onChange={handleCellChange} handleMemoChange={handleMemoChange} />
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <ReturnStockTable
              header={dateHeader}
              rows={stockRows}
              dateRange={dateRange}
              startKICSDate={startKICSDate}
              endKICSDate={endKICSDate}
              getHeaderBackgroundColor={getDateHeaderBackgroundColor}
              getRowBackgroundColor={getDateRowBackgroundColor}
            />
          </Box>
        </Box>
      </Paper>
      {/*本番日*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box>
          <Box display="flex" alignItems="center" p={2}>
            <Typography>本番日数</Typography>
            <TextField
              type="number"
              sx={{
                width: '5%',
                minWidth: '60px',
                ml: 2,
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
                '& input[type=number]::-webkit-outer-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
            />
            日
          </Box>
        </Box>
        <Grid2 container alignItems="center" spacing={2} p={2}>
          <Typography>入出庫ステータス</Typography>
          <TextField disabled defaultValue={'準備中'}></TextField>
        </Grid2>
      </Paper>
    </Box>
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
  // ボタン
  button: {},
};
