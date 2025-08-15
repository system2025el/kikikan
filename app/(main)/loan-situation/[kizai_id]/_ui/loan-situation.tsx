'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import {
  Box,
  Button,
  ClickAwayListener,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid2,
  Paper,
  Popper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { toISOStringMonthDay } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar } from '@/app/(main)/_ui/date';

import { loanData, useData } from '../_lib/data';
import { LoanSituationTable, UseTable } from './loan-situation-table';

export type UseData = {
  id: number;
  juchuHonbanbiShubetuId: number[];
};

export type Loan = {
  juchuHeadId: number;
  koenNam: string;
  date: Date | null;
};

// 使用数テーブルの日付ヘッダーの作成
const getUseHeader = (date: Date | null) => {
  const start = date !== null ? subDays(date, 1) : subDays(new Date(), 1);
  const end = date !== null ? endOfMonth(addMonths(date, 2)) : endOfMonth(addMonths(new Date(), 2));
  const range: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = toISOStringMonthDay(current);
    range.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  return range;
};

export const LoanSituation = () => {
  // 貸出テーブル行配列
  const [loanRows, setLoanRows] = useState<Loan[]>(loanData);
  // 使用日テーブルヘッダー
  const [dateHeader, setDateHeader] = useState<string[]>(getUseHeader(new Date('2025/11/2')));
  // 使用日テーブルの行配列
  const [useRows, setStockRows] = useState<UseData[]>(useData);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date());

  // 保有数
  const possessions = 200;

  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date.toDate());
      const updatedHeader = getUseHeader(date?.toDate());
      setDateHeader(updatedHeader);

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
   * ポッパー開閉
   * @param event マウスイベント
   */
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };
  const handleClickAway = () => {
    setAnchorEl(null);
  };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2} width="100%">
          <Typography>貸出状況</Typography>
        </Box>
        <Divider />
        <Box display={'flex'} justifyContent={'end'}>
          <Button>再表示</Button>
        </Box>
        <Grid2 container alignItems={'center'} px={2} py={1} spacing={2}>
          <Typography>機材名</Typography>
          <TextField disabled defaultValue="SHARPY PLUS"></TextField>
        </Grid2>
        <Grid2 container alignItems={'center'} px={2} py={1} spacing={2}>
          <Typography>保有数</Typography>
          <TextField
            disabled
            value={possessions}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }}
          />
          <Grid2 container alignItems={'center'}>
            <Typography>定価</Typography>
            <TextField
              disabled
              defaultValue="20,000円"
              sx={{
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
              }}
            ></TextField>
          </Grid2>
          <Grid2 pl={2}>
            <FormControl>
              <RadioGroup defaultValue="出庫日順" row>
                <FormControlLabel value="出庫日順" control={<Radio />} label="出庫日順" />
                <FormControlLabel value="入庫日順" control={<Radio />} label="入庫日順" />
              </RadioGroup>
            </FormControl>
          </Grid2>
        </Grid2>
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
            <LoanSituationTable rows={loanRows} />
            <Box display={'flex'} justifyContent={'end'}>
              <Typography>在庫数</Typography>
            </Box>
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <Box display="flex" my={2}>
              <Button onClick={handleBackDateChange}>
                <ArrowBackIosNewIcon fontSize="small" />
              </Button>
              <Button variant="outlined" onClick={handleClick}>
                日付選択
              </Button>
              <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1000 }}>
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
            <UseTable header={dateHeader} rows={useRows} possessions={possessions} />
          </Box>
        </Box>
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
    margin: 1,
    marginLeft: 2,
  },
};
