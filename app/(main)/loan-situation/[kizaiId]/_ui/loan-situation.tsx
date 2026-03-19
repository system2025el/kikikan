'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import UpdateIcon from '@mui/icons-material/Update';
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
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { addDays, addMonths, set, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';

import { toJapanMDString } from '@/app/(main)/_lib/date-conversion';
import { permission } from '@/app/(main)/_lib/permission';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';

import { getAllLoanUseData, getLoanJuchuData, getLoanStockData } from '../_lib/funcs';
import { LoanJuchu, LoanKizai, LoanStockTableValues, LoanUseTableValues } from '../_lib/types';
import { LoanSituationTable, UseTable } from './loan-situation-table';

export const LoanSituation = (props: {
  kizaiData: LoanKizai;
  // loanJuchuData: LoanJuchu[];
  // eqUseData: LoanUseTableValues[][];
  // eqStockData: LoanStockTableValues[];
}) => {
  const { kizaiData } = props;

  // ref
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // ローディング
  const [isLoading, setIsLoading] = useState(true);
  // エラーハンドリング
  const [error, setError] = useState<Error | null>(null);
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

  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  /**
   * 同期スクロール処理
   * @param source
   * @returns
   */
  const syncScroll = useCallback((source: 'left' | 'right') => {
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
  }, []);

  // 貸出状況取得
  const getData = async (strDat: Date) => {
    try {
      // 機材在庫データ、ヘッダー開始日から終了日までに該当する貸出受注データ
      const [eqStockData, loanJuchuData] = await Promise.all([
        getLoanStockData(kizaiData.kizaiId, strDat),
        getLoanJuchuData(kizaiData.kizaiId, strDat),
      ]);

      if (loanJuchuData.length === 0) {
        setLoanJuchuList([]);
        setEqUseList([]);
        setEqStockList(eqStockData);
        return;
      }

      // ラジオボタンで選択されている出庫日or入庫日順にソート
      if (sortValue === 'shuko') {
        loanJuchuData.sort((a, b) => {
          const dateA = a.shukoDat ? new Date(a.shukoDat).getTime() : null;
          const dateB = b.shukoDat ? new Date(b.shukoDat).getTime() : null;

          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return 1;
          if (dateB === null) return -1;

          return dateA - dateB;
        });
      } else {
        loanJuchuData.sort((a, b) => {
          const dateA = a.nyukoDat ? new Date(a.nyukoDat).getTime() : null;
          const dateB = b.nyukoDat ? new Date(b.nyukoDat).getTime() : null;

          if (dateA === null && dateB === null) return 0;
          if (dateA === null) return 1;
          if (dateB === null) return -1;

          return dateA - dateB;
        });
      }

      // 返却明細は親明細と並ぶようソート
      const childrenMap: { [key: string]: LoanJuchu[] } = {};
      const parents = [];
      // 親データと子データで分ける
      for (const data of loanJuchuData) {
        if (data.oyaJuchuKizaiHeadId === null) {
          parents.push(data);
        } else {
          // 受注番号と親受注機材番号でキー作成
          if (!childrenMap[data.oyaJuchuKizaiHeadId]) {
            childrenMap[`${data.juchuHeadId}-${data.oyaJuchuKizaiHeadId}`] = [];
          }
          childrenMap[`${data.juchuHeadId}-${data.oyaJuchuKizaiHeadId}`].push(data);
        }
      }

      const sortFilterLoanJuchuData = [];
      // 子データがあれば連番で追加
      for (const parent of parents) {
        sortFilterLoanJuchuData.push(parent);
        const children = childrenMap[`${parent.juchuHeadId}-${parent.juchuKizaiHeadId}`];
        if (children) {
          sortFilterLoanJuchuData.push(...children);
        }
      }

      const targetIds = sortFilterLoanJuchuData.map((d) => ({
        juchuHeadId: d.juchuHeadId,
        juchuKizaiHeadId: d.juchuKizaiHeadId,
      }));

      // 使用数取得
      const allLoanUseData: LoanUseTableValues[] = await getAllLoanUseData(targetIds, kizaiData.kizaiId, strDat);

      const loanUseMap = new Map<string, LoanUseTableValues[]>();
      for (const row of allLoanUseData) {
        // 受注番号と受注機材番号でキー作成
        const key = `${row.juchuHeadId}-${row.juchuKizaiHeadId}`;

        if (!loanUseMap.has(key)) {
          loanUseMap.set(key, []);
        }
        loanUseMap.get(key)!.push(row);
      }

      const eqUseData: LoanUseTableValues[][] = targetIds.map((pair) => {
        const key = `${pair.juchuHeadId}-${pair.juchuKizaiHeadId}`;
        return loanUseMap.get(key) || [];
      });

      setLoanJuchuList(sortFilterLoanJuchuData);
      setEqUseList(eqUseData);
      setEqStockList(eqStockData);
    } catch (e) {
      throw e;
    }
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

      try {
        await getData(strDat);
      } catch (e) {
        setSnackBarMessage('データの取得に失敗しました');
        setSnackBarOpen(true);
      }
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

    // ヘッダー開始日
    const strDat = subDays(selectDate, 1);

    try {
      await getData(strDat);
    } catch (e) {
      setSnackBarMessage('データの取得に失敗しました');
      setSnackBarOpen(true);
    }
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

  useEffect(() => {
    const getInitialData = async () => {
      // ヘッダー開始日
      const strDat = subDays(new Date(), 1);

      try {
        await getData(strDat);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }

      setIsLoading(false);
    };
    getInitialData();
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
  }, [loanJuchuList, eqUseList, isLoading, syncScroll]);

  if (error) throw error;

  return (
    <Box>
      <Paper variant="outlined">
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} width="100%">
          <Typography>貸出状況</Typography>
        </Box>
        <Divider />
        <Grid2 container alignItems={'center'} px={2} py={1} spacing={3}>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={1}>機材名</Typography>
            <TextField value={kizaiData.kizaiNam} sx={{ minWidth: 400 }} disabled />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={1}>保有数</Typography>
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
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={1}>NG数</Typography>
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
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={1}>定価</Typography>
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
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <FormControl sx={{ ml: 1 }}>
              <RadioGroup value={sortValue} onChange={handleRadioChange} row>
                <FormControlLabel value="shuko" control={<Radio />} label="出庫日順" />
                <FormControlLabel value="nyuko" control={<Radio />} label="入庫日順" />
              </RadioGroup>
            </FormControl>
          </Box>
          <Box display={'flex'} justifyContent={'end'}>
            <Button startIcon={<UpdateIcon />} onClick={handleReload} loading={isLoading}>
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
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
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
