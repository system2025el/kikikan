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
import { useEffect, useRef, useState } from 'react';

import {} from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';

import { confirmJuchuHeadId, getLoanJuchuData, getLoanStockData, getLoanUseData } from '../_lib/funcs';
import { LoanJuchu, LoanKizai, LoanStockTableValues, LoanUseTableValues } from '../_lib/types';
import { LoanSituationTable, UseTable } from './loan-situation-table';

export const LoanSituation = (props: {
  kizaiData: LoanKizai;
  // loanJuchuData: LoanJuchu[];
  // eqUseData: LoanUseTableValues[][];
  // eqStockData: LoanStockTableValues[];
}) => {
  const { kizaiData } = props;

  // ローディング
  const [isLoading, setIsLoading] = useState(true);
  // 貸出受注データリスト
  const [loanJuchuList, setLoanJuchuList] = useState<LoanJuchu[]>(/*props.loanJuchuData*/ []);
  // 機材使用リスト
  const [eqUseList, setEqUseList] = useState<LoanUseTableValues[][]>(/*props.eqUseData*/ []);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<LoanStockTableValues[]>(/*props.eqStockData*/ []);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date());
  // ラジオボタン選択値
  const [sortValue, setSortValue] = useState<string>('shuko');

  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // ref
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  useEffect(() => {
    const getData = async () => {
      // ヘッダー開始日
      const strDat = subDays(new Date(), 1);

      // 機材在庫データ、ヘッダー開始日から終了日までに該当する受注ヘッダーidリスト、貸出受注データ
      const [eqStockData, confirmJuchuHeadIds, loanJuchuData] = await Promise.all([
        getLoanStockData(kizaiData.kizaiId, strDat),
        confirmJuchuHeadId(strDat),
        getLoanJuchuData(kizaiData.kizaiId),
      ]);

      // 該当する受注ヘッダーidリストに含まれる貸出受注データのみ抽出
      const filterLoanJuchuData = loanJuchuData.filter((d) => confirmJuchuHeadIds.includes(d.juchuHeadId));

      if (filterLoanJuchuData.length === 0) {
        setEqStockList(eqStockData);
        setIsLoading(false);
        return;
      }

      filterLoanJuchuData.sort((a, b) => {
        const dateA = a.shukoDat ? new Date(a.shukoDat).getTime() : null;
        const dateB = b.shukoDat ? new Date(b.shukoDat).getTime() : null;

        if (dateA === null && dateB === null) return 0;
        if (dateA === null) return 1;
        if (dateB === null) return -1;

        return dateA - dateB;
      });

      const juchuHeadIds = filterLoanJuchuData.map((d) => d.juchuHeadId);

      const eqUseData: LoanUseTableValues[][] = [];
      for (const juchuHeadId of juchuHeadIds) {
        const data: LoanUseTableValues[] = await getLoanUseData(juchuHeadId, kizaiData.kizaiId, strDat);
        eqUseData.push(data);
      }

      setLoanJuchuList(filterLoanJuchuData);
      setEqUseList(eqUseData);
      setEqStockList(eqStockData);

      setIsLoading(false);
    };
    getData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;

    if (left && right) {
      left.addEventListener('scroll', () => syncScroll('left'));
      right.addEventListener('scroll', () => syncScroll('right'));
    }

    return () => {
      if (left && right) {
        left.removeEventListener('scroll', () => syncScroll('left'));
        right.removeEventListener('scroll', () => syncScroll('right'));
      }
    };
  }, [loanJuchuList, eqUseList, isLoading]);

  /**
   * 同期スクロール処理
   * @param source
   * @returns
   */
  const syncScroll = (source: 'left' | 'right') => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const left = leftRef.current;
    const right = rightRef.current;

    if (!left || !right) return;

    if (source === 'left') {
      const ratio = left.scrollTop / (left.scrollHeight - left.clientHeight);
      right.scrollTop = ratio * (right.scrollHeight - right.clientHeight);
    } else {
      const ratio = right.scrollTop / (right.scrollHeight - right.clientHeight);
      left.scrollTop = ratio * (left.scrollHeight - left.clientHeight);
    }

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

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

      // 機材在庫データ、ヘッダー開始日から終了日までに該当する受注ヘッダーidリスト、貸出受注データ
      const [eqStockData, confirmJuchuHeadIds, loanJuchuData] = await Promise.all([
        getLoanStockData(kizaiData.kizaiId, strDat),
        confirmJuchuHeadId(strDat),
        getLoanJuchuData(kizaiData.kizaiId),
      ]);

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

  return (
    <Box>
      <Paper variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} width="100%">
          <Typography>貸出状況</Typography>
        </Box>
        <Divider />
        <Grid2 container alignItems={'center'} px={2} py={0.5} spacing={2}>
          <Typography>機材名</Typography>
          <TextField value={kizaiData.kizaiNam} sx={{ minWidth: 400 }} disabled />
          <Typography ml={2}>保有数</Typography>
          <TextField
            disabled
            value={kizaiData.kizaiQty}
            sx={{
              maxWidth: 100,
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }}
          />
          <Typography ml={2}>NG数</Typography>
          <TextField
            disabled
            value={kizaiData.ngQty}
            sx={{
              maxWidth: 100,
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }}
          />
          <Typography ml={2}>定価</Typography>
          <TextField
            value={`¥${kizaiData.regAmt.toLocaleString()}`}
            disabled
            sx={{
              maxWidth: 120,
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
            }}
          />
          <FormControl sx={{ ml: 3 }}>
            <RadioGroup value={sortValue} onChange={handleRadioChange} row>
              <FormControlLabel value="shuko" control={<Radio />} label="出庫日順" />
              <FormControlLabel value="nyuko" control={<Radio />} label="入庫日順" />
            </RadioGroup>
          </FormControl>
          <Box display={'flex'} justifyContent={'end'} p={2}>
            <Button onClick={handleReload} loading={isLoading}>
              再表示
            </Button>
          </Box>
        </Grid2>
      </Paper>
      {isLoading ? (
        <Loading />
      ) : (
        <Grid2 container>
          <Grid2
            size={{
              xs: 'auto',
              sm: 'auto',
              md: 'auto',
              lg: 'auto',
            }}
          >
            <Box height={31} mt={1} mb={0.5} />
            <LoanSituationTable rows={loanJuchuList} ref={leftRef} />
          </Grid2>
          <Grid2 overflow="auto" size={{ xs: 'grow', sm: 'grow', md: 'grow' }}>
            <Box display={'flex'} alignItems={'center'} height={31} mt={1} mb={0.5}>
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
            <UseTable eqUseList={eqUseList} eqStockList={eqStockList} ref={rightRef} />
          </Grid2>
        </Grid2>
      )}
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
