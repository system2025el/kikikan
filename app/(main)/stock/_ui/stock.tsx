'use client';

import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { addDays, addMonths, set, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Calendar } from '../../_ui/date';
import { Loading } from '../../_ui/loading';
import { getEqData, getEqStockData } from '../_lib/funcs';
import { Bumon, EqTableValues, StockTableValues } from '../_lib/types';
import { EqStockTable, EqTable } from './stock-table';

export const Stock = (props: { bumons: Bumon[] }) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);

  // 機材リスト
  const [eqList, setEqList] = useState<EqTableValues[]>([]);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>([]);

  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date());

  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // ref
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  /* 検索useForm-------------------------- */
  const { control, handleSubmit } = useForm({
    mode: 'onSubmit',
    defaultValues: { bumonId: props.bumons[0].bumonId },
  });

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
  }, [eqList, isLoading]);

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
   * 検索ボタン押下時
   * @param data フォームデータ(部門id)
   */
  const onSubmit = async (data: { bumonId: number }) => {
    setIsLoading(true);
    const newEqList = await getEqData(data.bumonId);
    const kizaiIds = newEqList.map((data) => data.kizaiId);
    const newEqStockList: StockTableValues[][] = [];
    for (const kizaiId of kizaiIds) {
      const stock: StockTableValues[] = await getEqStockData(kizaiId, subDays(selectDate, 1));
      newEqStockList.push(stock);
    }
    setEqList(newEqList);
    setEqStockList(newEqStockList);
    setIsLoading(false);
  };

  /**
   * 日付選択カレンダー選択時
   * @param date 選択日
   * @param view 選択項目
   * @returns
   */
  const handleDateChange = async (date: Dayjs | null, view: string) => {
    if (!date) return;
    setSelectDate(date.toDate());

    if (view === 'day') {
      setIsLoading(true);
      const kizaiIds = eqList.map((data) => data.kizaiId);
      const newEqStockList: StockTableValues[][] = [];
      for (const kizaiId of kizaiIds) {
        const stock: StockTableValues[] = await getEqStockData(kizaiId, subDays(date.toDate(), 1));
        newEqStockList.push(stock);
      }
      setEqStockList(newEqStockList);
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
    <Paper>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography p={2}>在庫確認</Typography>
      </Box>
      <Divider />
      <Box>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container alignItems="center" p={2} spacing={2}>
            <Typography>部門</Typography>
            <Select defaultValue={props.bumons[0].bumonId} sx={{ minWidth: 250 }}>
              {props.bumons.map((d) => (
                <MenuItem key={d.bumonId} value={d.bumonId}>
                  {d.bumonNam}
                </MenuItem>
              ))}
            </Select>
            <Button type="submit">
              <SearchIcon fontSize="small" />
              検索
            </Button>
          </Grid2>
        </form>
      </Box>
      {isLoading ? (
        <Loading />
      ) : (
        <Box display={eqList.length > 0 ? 'flex' : 'none'} flexDirection="row" width="100%">
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
            <EqTable eqList={eqList} ref={leftRef} />
          </Box>
          <Box overflow="auto" sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}>
            <Box display="flex" my={2}>
              <Box display={'flex'} alignItems={'end'} mr={2}>
                <Typography fontSize={'small'}>在庫数</Typography>
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
            <EqStockTable eqStockList={eqStockList} ref={rightRef} />
          </Box>
        </Box>
      )}
    </Paper>
  );
};
