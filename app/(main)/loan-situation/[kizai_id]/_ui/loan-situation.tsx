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
import { addDays, addMonths, set, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useState } from 'react';

import { toISOStringMonthDay } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';

import { loanData, useData } from '../_lib/data';
import { confirmJuchuHeadId, getLoanJuchuData, getLoanStockData, getLoanUseData } from '../_lib/funcs';
import { LoanJuchu, LoanKizai, LoanStockTableValues, LoanUseTableValues } from '../_lib/types';
import { LoanSituationTable, UseTable } from './loan-situation-table';

export const LoanSituation = (props: {
  kizaiData: LoanKizai;
  loanJuchuData: LoanJuchu[];
  eqUseData: LoanUseTableValues[][];
  eqStockData: LoanStockTableValues[];
}) => {
  const { kizaiData } = props;

  const [isLoading, setIsLoading] = useState(false);
  // 貸出受注データリスト
  const [loanJuchuList, setLoanJuchuList] = useState<LoanJuchu[]>(props.loanJuchuData);
  // 機材使用リスト
  const [eqUseList, setEqUseList] = useState<LoanUseTableValues[][]>(props.eqUseData);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<LoanStockTableValues[]>(props.eqStockData);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date());
  // ラジオボタン選択値
  const [sortValue, setSortValue] = useState<string>('shuko');

  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = async (date: Dayjs | null, view: string) => {
    if (!date) return;
    setSelectDate(date.toDate());

    if (view === 'day') {
      setIsLoading(true);
      // ヘッダー開始日
      const strDat = subDays(date.toDate(), 1);
      console.log('-------------------strDat-----------------', strDat);
      // 機材在庫データ
      const eqStockData: LoanStockTableValues[] = await getLoanStockData(props.kizaiData.kizaiId, strDat);
      // ヘッダー開始日から終了日までに該当する受注ヘッダーidリスト
      const confirmJuchuHeadIds = await confirmJuchuHeadId(strDat);
      console.log('-------------------confirmJuchuHeadIds-----------------', confirmJuchuHeadIds);
      // 貸出受注データ
      const loanJuchuData = await getLoanJuchuData(props.kizaiData.kizaiId);
      console.log('-------------------loanJuchuData-----------------', loanJuchuData);

      // 該当する受注ヘッダーidリストに含まれる貸出受注データのみ抽出
      const filterLoanJuchuData = loanJuchuData.filter((d) => confirmJuchuHeadIds.includes(d.juchuHeadId));
      console.log('-------------------filterLoanJuchuData-----------------', filterLoanJuchuData);

      if (filterLoanJuchuData.length === 0) {
        setLoanJuchuList([]);
        setEqUseList([]);
        setEqStockList(eqStockData);
        setAnchorEl(null);
        setIsLoading(false);
        return;
      }

      if (sortValue === 'shuko') {
        filterLoanJuchuData.sort((a, b) => {
          const dateA = a.shukoDat ? new Date(a.shukoDat).getTime() : null;
          const dateB = b.shukoDat ? new Date(b.shukoDat).getTime() : null;

          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return 1;
          if (dateB === null) return -1;

          return dateA - dateB;
        });
      } else {
        filterLoanJuchuData.sort((a, b) => {
          const dateA = a.nyukoDat ? new Date(a.nyukoDat).getTime() : null;
          const dateB = b.nyukoDat ? new Date(b.nyukoDat).getTime() : null;

          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return 1;
          if (dateB === null) return -1;

          return dateA - dateB;
        });
      }

      const juchuHeadIds = filterLoanJuchuData.map((d) => d.juchuHeadId);

      const eqUseData: LoanUseTableValues[][] = [];
      for (const juchuHeadId of juchuHeadIds) {
        const data: LoanUseTableValues[] = await getLoanUseData(juchuHeadId, props.kizaiData.kizaiId, strDat);
        eqUseData.push(data);
      }
      setLoanJuchuList(filterLoanJuchuData);
      setEqUseList(eqUseData);
      setEqStockList(eqStockData);
      setAnchorEl(null);
      setIsLoading(false);
    }
  };

  // 3か月前
  const handleBackDateChange = () => {
    const date = subMonths(new Date(selectDate), 3);
    handleDateChange(dayjs(date), 'day');
  };
  // 3か月後
  const handleForwardDateChange = () => {
    const date = addMonths(new Date(selectDate), 3);
    handleDateChange(dayjs(date), 'day');
  };

  /**
   * ソートラジオボタン変更時
   * @param event ラジオボタン変更イベント
   */
  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSortValue(event.target.value);
  };

  /**
   * 再表示
   */
  const handleReload = async () => {
    setIsLoading(true);
    if (sortValue === 'shuko') {
      loanJuchuList.sort((a, b) => {
        const dateA = a.shukoDat ? new Date(a.shukoDat).getTime() : null;
        const dateB = b.shukoDat ? new Date(b.shukoDat).getTime() : null;

        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        return dateA - dateB;
      });
    } else {
      loanJuchuList.sort((a, b) => {
        const dateA = a.nyukoDat ? new Date(a.nyukoDat).getTime() : null;
        const dateB = b.nyukoDat ? new Date(b.nyukoDat).getTime() : null;

        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        return dateA - dateB;
      });
    }
    const juchuHeadIds = loanJuchuList.map((d) => d.juchuHeadId);
    const updatedEqUseData: LoanUseTableValues[][] = [];
    for (const juchuHeadId of juchuHeadIds) {
      const data: LoanUseTableValues[] = await getLoanUseData(
        juchuHeadId,
        props.kizaiData.kizaiId,
        subDays(selectDate, 1)
      );
      updatedEqUseData.push(data);
    }
    setEqUseList(updatedEqUseData);
    setIsLoading(false);
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

  if (isLoading) {
    return (
      <Box height={'90vh'}>
        <Loading />
      </Box>
    );
  }

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <BackButton label={'戻る'} />
        <Button onClick={() => console.log(eqUseList)}>確認</Button>
      </Box>
      <Paper variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" p={2} width="100%">
          <Typography>貸出状況</Typography>
        </Box>
        <Divider />
        <Grid2 container alignItems={'center'} px={2} py={2} spacing={2}>
          <Typography>機材名</Typography>
          <TextField value={kizaiData.kizaiNam} sx={{ minWidth: 400 }} disabled></TextField>
        </Grid2>
        <Grid2 container alignItems={'center'} px={2} py={1} spacing={2}>
          <Typography>保有数</Typography>
          <TextField
            disabled
            value={kizaiData.kizaiQty}
            sx={{
              maxWidth: 150,
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }}
          />
          <Grid2 container alignItems={'center'}>
            <Typography>定価</Typography>
            <TextField
              value={`¥${kizaiData.regAmt.toLocaleString()}`}
              disabled
              sx={{
                maxWidth: 200,
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
              }}
            ></TextField>
          </Grid2>
          <Grid2 pl={2}>
            <FormControl>
              <RadioGroup value={sortValue} onChange={handleRadioChange} row>
                <FormControlLabel value="shuko" control={<Radio />} label="出庫日順" />
                <FormControlLabel value="nyuko" control={<Radio />} label="入庫日順" />
              </RadioGroup>
            </FormControl>
          </Grid2>
          <Box display={'flex'} justifyContent={'end'} p={2}>
            <Button onClick={handleReload}>再表示</Button>
          </Box>
        </Grid2>
        <Box display={'flex'} flexDirection="row" width="100%">
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
            <LoanSituationTable rows={loanJuchuList} />
            <Box display={'flex'} justifyContent={'end'} p={0.5}>
              <Typography fontSize={'small'}>在庫数</Typography>
            </Box>
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <Box display="flex" my={2}>
              <Box display={loanJuchuList.length > 0 ? 'flex' : 'none'} alignItems={'end'} mr={2}>
                <Typography fontSize={'small'}>使用数</Typography>
              </Box>
              <Button onClick={handleBackDateChange}>
                <ArrowBackIosNewIcon fontSize="small" />
              </Button>
              <Button variant="outlined" onClick={handleClick}>
                日付選択
              </Button>
              <Popper open={open} anchorEl={anchorEl} placement="bottom-start" sx={{ zIndex: 1202 }}>
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
            <UseTable eqUseList={eqUseList} eqStockList={eqStockList} />
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
