'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  ClickAwayListener,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, TestDate, toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';
import Time, { TestTime } from '@/app/(main)/_ui/time';

import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { data, stock } from '../_lib/data';
import { KeepEqTable, KeepStockTable } from './equipment-keep-order-detail-table';

export type KeepEquipmentData = {
  date: string;
  memo: string;
};

export type StockData = {
  id: number;
  data: number[];
};

export type KeepEquipment = {
  id: number;
  name: string;
  memo: string;
  place: string;
  issue: number;
  keep: number;
};

// 開始日から終了日までの日付配列の作成
const getRange = (start: Date | null, end: Date | null): string[] => {
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
const getStockHeader = (date: Date | null) => {
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
const getStockRow = (stock: number[], length: number) => {
  const rows: StockData[] = [];

  stock.map((num, index) => {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      if (i === 0 || i === 1 || i === 2) {
        data.push(num - 1);
      } else {
        data.push(num);
      }
    }
    const row: StockData = { id: index + 1, data: data };
    rows.push(row);
  });

  return rows;
};

export const EquipmentKeepOrderDetail = () => {
  // KICS出庫日
  const [startKICSDate, setStartKICSDate] = useState<Date | null>(null);
  // YARD出庫日
  const [startYARDDate, setStartYARDDate] = useState<Date | null>(null);
  // KICS入庫日
  const [endKICSDate, setEndKICSDate] = useState<Date | null>(null);
  // YARD入庫日
  const [endYARDDate, setEndYARDDate] = useState<Date | null>(new Date('2025/11/9 15:00'));
  // 出庫日
  const [startDate, setStartDate] = useState<Date | null>(null);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(getRange(new Date('2025/11/2'), new Date('2025/11/19')));
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date('2025/11/2'));

  // ヘッダー用の日付
  const [dateHeader, setDateHeader] = useState<string[]>(getStockHeader(new Date('2025/11/2')));
  // ストックテーブルの行配列
  const [stockRows, setStockRows] = useState<StockData[]>(getStockRow(stock, dateHeader.length));
  // 機材テーブルの行配列
  const [equipmentRows, setEquipmentRows] = useState<KeepEquipment[]>(data);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * 機材キープメモ入力時
   * @param rowIndex 入力された行番号
   * @param memo キープメモ内容
   */
  const handleMemoChange = (rowIndex: number, memo: string) => {
    const updatedRows = [...equipmentRows];
    updatedRows[rowIndex].memo = memo;
    setEquipmentRows(updatedRows);
  };

  /**
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date.toDate());
      const updatedHeader = getStockHeader(date?.toDate());
      const updatedRow = getStockRow(stock, updatedHeader.length);
      setDateHeader(updatedHeader);
      const targetIndex: number[] = [];
      dateRange.map((targetDate) => {
        updatedHeader.map((date, index) => {
          if (targetDate === date) {
            targetIndex.push(index);
          }
        });
      });
      setStockRows(updatedRow);

      setAnchorEl(null);
    }
  };

  // 3か月前
  const handleBackDateChange = () => {
    const date = subMonths(new Date(dateHeader[1]), 3);
    handleDateChange(dayjs(date));
  };
  // 3か月後
  const handleForwardDateChange = () => {
    const date = addMonths(new Date(dateHeader[1]), 3);
    handleDateChange(dayjs(date));
  };

  /**
   * KICS出庫日時変更時
   * @param newDate KICS出庫日
   */
  const handleKICSStartChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setStartKICSDate(newDate?.toDate());

    if (startYARDDate === null || newDate.toDate() < startYARDDate) {
      setStartDate(newDate.toDate());
    }
  };

  /**
   * YARD出庫日時変更時
   * @param newDate YARD出庫日
   */
  const handleYARDStartChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setStartYARDDate(newDate?.toDate());

    if (startKICSDate === null || newDate.toDate() < startKICSDate) {
      setStartDate(newDate.toDate());
    }
  };

  /**
   * ポッパー開閉
   * @param event マウスイベント
   */
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };
  const handleClickAway = () => {
    setAnchorEl(null);
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <BackButton label={'戻る'} />
      </Box>
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
      {/*受注明細ヘッダー(キープ)*/}
      <Accordion sx={{ mt: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div" sx={{ bgcolor: 'green', color: 'white' }}>
          <Grid2
            container
            display="flex"
            alignItems={'center'}
            justifyContent="space-between"
            spacing={2}
            py={1}
            width={'100%'}
          >
            <Typography>受注機材ヘッダー(キープ)</Typography>
            <Button>
              <CheckIcon fontSize="small" />
              保存
            </Button>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <Divider />
          <Grid2 container alignItems="center" spacing={2} p={2}>
            <Grid2 container alignItems="center">
              <Typography>機材明細名</Typography>
              <TextField value={'キープ分（YARD/HT）'} />
            </Grid2>
          </Grid2>
          <Grid2 container p={2} spacing={2}>
            <Grid2 width={500}>
              <Typography>出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={startKICSDate}
                  minDate={endYARDDate !== null ? endYARDDate : undefined}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleKICSStartChange}
                />
                <Time />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  date={startYARDDate}
                  minDate={endYARDDate !== null ? endYARDDate : undefined}
                  maxDate={new Date('2025/11/19')}
                  onChange={handleYARDStartChange}
                />
                <Time />
              </Grid2>
            </Grid2>
            <Grid2 width={500}>
              <Typography>入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'KICS'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  disabled
                  date={endKICSDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndKICSDate(newDate.toDate());
                    }
                  }}
                />
                <Time disabled />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'YARD'} disabled sx={{ width: '10%', minWidth: 150 }} />
                <TestDate
                  disabled
                  date={endYARDDate}
                  onChange={(newDate) => {
                    if (newDate !== null) {
                      setEndYARDDate(newDate?.toDate());
                    }
                  }}
                />
                <TestTime
                  disabled
                  time={endYARDDate}
                  onChange={(newDate) => newDate && setEndYARDDate(newDate?.toDate())}
                />
              </Grid2>
            </Grid2>
            <Grid2 container alignItems="center" py={1}>
              <Typography>メモ</Typography>
              <TextField multiline rows={3} />
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" py={1} px={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
          <Button>
            <CheckIcon fontSize="small" />
            保存
          </Button>
        </Box>
        <Divider />
        <Box display="flex" flexDirection="row" width="100%">
          <Box
            sx={{
              width: {
                xs: '40%',
                sm: '40%',
                md: '40%',
                lg: 'min-content',
              },
              mt: '62.5px',
            }}
          >
            <KeepEqTable rows={equipmentRows} handleMemoChange={handleMemoChange} />
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <Box display="flex" my={2}>
              <Button onClick={handleBackDateChange}>
                <ArrowBackIosNewIcon fontSize="small" />
              </Button>
              <Button variant="outlined" onClick={handleClick}>
                日付選択
              </Button>
              <Popper open={open} anchorEl={anchorEl} placement="bottom-start">
                <ClickAwayListener onClickAway={handleClickAway}>
                  <Paper elevation={3} sx={{ mt: 1 }}>
                    <Calendar date={selectDate} onChange={handleDateChange} />
                  </Paper>
                </ClickAwayListener>
              </Popper>
              <Button onClick={handleForwardDateChange}>
                <ArrowForwardIosIcon fontSize="small" />
              </Button>
            </Box>
            <KeepStockTable
              header={dateHeader}
              rows={stockRows}
              dateRange={dateRange}
              startDate={startDate}
              endDate={endYARDDate}
              getHeaderBackgroundColor={getDateHeaderBackgroundColor}
              getRowBackgroundColor={getDateRowBackgroundColor}
            />
          </Box>
        </Box>
      </Paper>
      {/*本番日*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
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
