'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ClickAwayListener,
  Dialog,
  Divider,
  Fab,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { BackButton } from '@/app/(main)/_ui/buttons';
import {
  Calendar,
  TestDate,
  toISOString,
  toISOStringWithTimezone,
  toISOStringWithTimezoneMonthDay,
} from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import Time, { TestTime } from '@/app/(main)/_ui/time';
import { AddLock, DeleteLock, GetLock } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/hook';
import { LockValues, OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';

import { data, stock } from '../_lib/data';
import { JuchuKizaiHeadSchema, JuchuKizaiHeadValues, JuchuKizaiMeisaiValues, StockTableValues } from '../_lib/types';
import { DateSelectDialog } from './date-selection-dialog';
import { EqTable, StockTable } from './equipment-order-detail-table';
import { EquipmentSelectionDialog } from './equipment-selection-dailog';

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
  date: Date | null;
  memo: string;
  place: string;
  all: number;
  order: number;
  spare: number;
  total: number;
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
  const start = date !== null ? subDays(date, 1) : subDays(new Date(), 1);
  const end = date !== null ? endOfMonth(addMonths(date, 2)) : endOfMonth(addMonths(new Date(), 2));
  const range: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
    range.push(dateStr);
    current.setDate(current.getDate() + 1);
  }

  return range;
};

// ストックテーブルの行作成
const getStockRow = (stock: number[], length: number) => {
  const rows: StockData[] = [];

  stock.map((num, index) => {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      data.push(num);
    }
    const row: StockData = { id: index + 1, data: data };
    rows.push(row);
  });

  return rows;
};

// 200件用データ作成
export const testeqData: Equipment[] = Array.from({ length: 50 }, (_, i) => {
  const original = data[i % data.length];
  return {
    ...original,
    id: i + 1,
    name: `${original.name} (${i + 1})`,
    date: original.date,
    memo: original.memo,
    place: original.place,
    all: original.all,
    order: original.order,
    spare: original.spare,
    total: original.total,
  };
});
// 200件用データ作成
export const testStock = Array.from({ length: 50 }, (_, i) => stock[i % stock.length]);

const EquipmentOrderDetail = (props: {
  juchuHeadData: OrderValues;
  juchuKizaiHeadData: JuchuKizaiHeadValues;
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] | undefined;
  eqStockData: StockTableValues[][] | undefined;
  edit: boolean;
  lockData: LockValues | null;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(props.lockData);
  // 受注機材明細リスト
  const [eqList, setEqList] = useState<JuchuKizaiMeisaiValues[]>(
    props.juchuKizaiMeisaiData ? props.juchuKizaiMeisaiData : []
  );
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(props.eqStockData ? props.eqStockData : []);

  console.log(eqList);

  // context
  const { setIsDirty, setLock, setLockShubetu, setHeadId } = useDirty();

  // KICS出庫日
  const [startKICSDate, setStartKICSDate] = useState<Date | null>(null);
  // YARD出庫日
  const [startYARDDate, setStartYARDDate] = useState<Date | null>(null);
  // KICS入庫日
  const [endKICSDate, setEndKICSDate] = useState<Date | null>(null);
  // YARD入庫日
  const [endYARDDate, setEndYARDDate] = useState<Date | null>(null);
  // 出庫日
  const [startDate, setStartDate] = useState<Date | null>(null);
  // 入庫日
  const [endDate, setEndDate] = useState<Date | null>(null);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(getRange(startDate, endDate));
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(new Date());

  // ヘッダー用の日付
  const [dateHeader, setDateHeader] = useState<string[]>(/*getStockHeader(startDate)*/ []);
  // ストックテーブルの行配列
  const [stockRows, setStockRows] = useState<StockData[]>(/*getStockRow(stock, dateHeader.length)*/ []);
  // 機材テーブルの行配列
  const [equipmentRows, setEquipmentRows] = useState<Equipment[]>(/*data*/ []);

  // 仕込日
  const [preparation, setPreparation] = useState<EquipmentData[]>([]);
  // RH日
  const [RH, setRH] = useState<EquipmentData[]>([]);
  // GP日
  const [GP, setGP] = useState<EquipmentData[]>([]);
  // 本番日
  const [actual, setActual] = useState<EquipmentData[]>([]);
  //
  const [actualDateRange, setActualDateRange] = useState<string[]>([]);

  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // 日付選択カレンダーダイアログ制御
  const [dateSelectionDialogOpne, setDateSelectionDialogOpne] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // ref
  const dateRangeRef = useRef(dateRange);
  const dateHeaderRef = useRef(dateHeader);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  /* useForm ------------------------- */
  const {
    watch,
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    clearErrors,
    formState: { isDirty, errors, defaultValues },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      juchuHeadId: props.juchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.juchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.juchuKizaiHeadData.juchuKizaiHeadKbn,
      juchuHonbanbiQty: props.juchuKizaiHeadData.juchuHonbanbiQty,
      zeiKbn: props.juchuKizaiHeadData.zeiKbn,
      nebikiAmt: props.juchuKizaiHeadData.nebikiAmt,
      mem: props.juchuKizaiHeadData.mem,
      headNam: props.juchuKizaiHeadData.headNam,
      kicsShukoDat: props.juchuKizaiHeadData.kicsShukoDat ? new Date(props.juchuKizaiHeadData.kicsShukoDat) : null,
      kicsNyukoDat: props.juchuKizaiHeadData.kicsNyukoDat ? new Date(props.juchuKizaiHeadData.kicsNyukoDat) : null,
      yardShukoDat: props.juchuKizaiHeadData.yardShukoDat ? new Date(props.juchuKizaiHeadData.yardShukoDat) : null,
      yardNyukoDat: props.juchuKizaiHeadData.yardNyukoDat ? new Date(props.juchuKizaiHeadData.yardNyukoDat) : null,
    },
    resolver: zodResolver(JuchuKizaiHeadSchema),
  });

  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty);

  /**
   * useEffect
   */
  useEffect(() => {
    if (!user) return;
    setEdit(!props.edit || (props.lockData !== null && props.lockData.addUser !== user.name) ? false : true);

    const asyncProcess = async () => {
      if (props.edit && props.lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
        setLockData(newLockData);
      }
    };
    asyncProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    if (lockData) setLock(lockData);
  }, [lockData, setLock]);

  useEffect(() => {
    setLockShubetu(1);
    setHeadId(props.juchuHeadData.juchuHeadId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 編集モード変更
  const handleEdit = async () => {
    if (edit) {
      await DeleteLock(1, props.juchuHeadData.juchuHeadId);
      const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(newLockData);
      setEdit(!edit);
    } else {
      if (!user) return;
      await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
      const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(newLockData);
      setEdit(!edit);
    }
  };

  const onSubmit = async (data: JuchuKizaiHeadValues) => {
    console.log('保存開始: ', data);
  };

  // 同期スクロール処理
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
  }, []);

  useEffect(() => {
    console.log('dateRange変更');
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  useEffect(() => {
    console.log('dateHeader変更');
    dateHeaderRef.current = dateHeader;
  }, [dateHeader]);

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

      const targetIndex = updatedHeader
        .map((date, index) => (dateRangeRef.current.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - equipmentRows[i].total;
        });
      });
      setStockRows(updatedRow);

      setAnchorEl(null);
    }
  };
  // 3か月前
  const handleBackDateChange = () => {
    const date = subMonths(new Date(`2025/${dateHeader[1]}`), 3);
    handleDateChange(dayjs(date));
  };
  // 3か月後
  const handleForwardDateChange = () => {
    const date = addMonths(new Date(`2025/${dateHeader[1]}`), 3);
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
   * 機材テーブルの受注数、予備数入力時
   * @param rowIndex 入力された行番号
   * @param orderValue 受注数
   * @param spareValue 予備数
   * @param totalValue 合計
   */
  const handleCellChange = (rowIndex: number, orderValue: number, spareValue: number, totalValue: number) => {
    setEquipmentRows((prev) =>
      prev.map((row, i) => (i === rowIndex ? { ...row, order: orderValue, spare: spareValue, total: totalValue } : row))
    );
    const updatedRow = getStockRow(stock, dateHeaderRef.current.length);
    const updatedData = updatedRow[rowIndex].data;
    const targetIndex = dateHeaderRef.current
      .map((date, index) => (dateRangeRef.current.includes(date) ? index : -1))
      .filter((index) => index !== -1);
    targetIndex.map((index) => {
      updatedData[index] = stock[rowIndex] - totalValue;
    });
    setStockRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, data: updatedData } : row)));
  };

  /**
   * 機材テーブルの日付変更時
   * @param rowIndex 入力された行番号
   * @param date 日付
   */
  const handleCellDateChange = (rowIndex: number, date: Dayjs | null) => {
    if (date !== null) {
      const newDate = date.toDate();
      setEquipmentRows((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, date: newDate } : row)));
    }
  };

  /**
   * KICS出庫日時変更時
   * @param newDate KICS出庫日
   */
  const handleKICSStartChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setStartKICSDate(newDate?.toDate());
    setValue('kicsShukoDat', newDate.toDate());
    //onChange(newDate.toDate());

    if (startYARDDate === null || newDate.toDate() < startYARDDate) {
      const updatedHeader = getStockHeader(newDate?.toDate());
      const updatedDateRange = getRange(newDate?.toDate(), endDate);
      const updatedRow = getStockRow(stock, updatedHeader.length);
      setDateHeader(updatedHeader);
      setDateRange(updatedDateRange);

      const targetIndex = updatedHeader
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - equipmentRows[i].total;
        });
      });
      setStockRows(updatedRow);
      setStartDate(newDate.toDate());
    }

    if (Object.keys(equipmentRows).length > 0 && startYARDDate === null) {
      setEquipmentRows((prev) =>
        prev.map((row) => (row.place === 'Y' ? { ...row, date: subDays(newDate.toDate(), 2) } : row))
      );
    }
  };

  /**
   * YARD出庫日時変更時
   * @param newDate YARD出庫日
   */
  const handleYARDStartChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setStartYARDDate(newDate?.toDate());
    setValue('yardShukoDat', newDate.toDate());

    if (startKICSDate === null || newDate.toDate() < startKICSDate) {
      const updatedHeader = getStockHeader(newDate?.toDate());
      const updatedDateRange = getRange(newDate?.toDate(), endDate);
      const updatedRow = getStockRow(stock, updatedHeader.length);
      setDateHeader(updatedHeader);
      setDateRange(updatedDateRange);

      const targetIndex = updatedHeader
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - equipmentRows[i].total;
        });
      });
      setStockRows(updatedRow);
      setStartDate(newDate.toDate());
    }

    if (Object.keys(equipmentRows).length > 0 && startKICSDate === null) {
      setEquipmentRows((prev) =>
        prev.map((row) => (row.place === 'Y' ? { ...row, date: subDays(newDate.toDate(), 2) } : row))
      );
    }
  };

  /**
   * KICS入庫日時変更時
   * @param newDate KICS入庫日
   */
  const handleKICSEndChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setEndKICSDate(newDate?.toDate());
    setValue('kicsNyukoDat', newDate.toDate());

    if (endYARDDate === null || newDate.toDate() > endYARDDate) {
      const updatedDateRange = getRange(startDate, newDate?.toDate());
      const updatedRow = getStockRow(stock, dateHeader.length);
      setDateRange(updatedDateRange);

      const targetIndex = dateHeaderRef.current
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - equipmentRows[i].total;
        });
      });
      setStockRows(updatedRow);
      setEndDate(newDate.toDate());
    }
  };

  /**
   * YARD入庫日時変更時
   * @param newDate YARD入庫日
   */
  const handleYARDEndChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setEndYARDDate(newDate?.toDate());
    setValue('yardNyukoDat', newDate.toDate());

    if (endKICSDate === null || newDate.toDate() > endKICSDate) {
      const updatedDateRange = getRange(startDate, newDate?.toDate());
      const updatedRow = getStockRow(stock, dateHeader.length);
      setDateRange(updatedDateRange);

      const targetIndex = dateHeaderRef.current
        .map((date, index) => (updatedDateRange.includes(date) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedRow.map((date, i) => {
          date.data[index] = stock[i] - equipmentRows[i].total;
        });
      });
      setStockRows(updatedRow);
      setEndDate(newDate.toDate());
    }
  };

  /**
   * 本番日入力ダイアログでの入力値反映
   * @param preparationDates 仕込日
   * @param preparationMemo 仕込日メモ
   * @param RHDates RH日
   * @param RHMemo RH日メモ
   * @param GPDates GP日
   * @param GPMemo GP日メモ
   * @param actualDates 本番日
   * @param actualMemo 本番日メモ
   */
  const handleSave = (
    preparationDates: string[],
    preparationMemo: string[],
    RHDates: string[],
    RHMemo: string[],
    GPDates: string[],
    GPMemo: string[],
    actualDates: string[],
    actualMemo: string[]
  ) => {
    setPreparation(
      preparationDates.map((date, index) => ({
        date: date,
        memo: preparationMemo[index] ?? '',
      }))
    );
    setRH(
      RHDates.map((date, index) => ({
        date: date,
        memo: RHMemo[index] ?? '',
      }))
    );
    setGP(
      GPDates.map((date, index) => ({
        date: date,
        memo: GPMemo[index] ?? '',
      }))
    );
    setActual(
      actualDates.map((date, index) => ({
        date: date,
        memo: actualMemo[index] ?? '',
      }))
    );
    const range = preparationDates.concat(RHDates, GPDates, actualDates);
    setActualDateRange(range.sort());
    setDateSelectionDialogOpne(false);
  };

  // ぺージトップへ戻る
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
  // 本番日入力ダイアログ開閉
  const handleOpenDateDialog = () => {
    setDateSelectionDialogOpne(true);
  };
  const handleCloseDateDialog = () => {
    setDateSelectionDialogOpne(false);
  };

  if (user === null || isLoading)
    return (
      <Box height={'90vh'}>
        <Loading />
      </Box>
    );

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        <Grid2 container spacing={4}>
          {lockData !== null && lockData.addUser !== user?.name && (
            <Grid2 container alignItems={'center'} spacing={2}>
              <Typography>{lockData.addDat && toISOString(new Date(lockData.addDat))}</Typography>
              <Typography>{lockData.addUser}</Typography>
              <Typography>編集中</Typography>
            </Grid2>
          )}
          <Grid2 container alignItems={'center'} spacing={1}>
            {!edit || (lockData !== null && lockData?.addUser !== user?.name) ? (
              <Typography>閲覧モード</Typography>
            ) : (
              <Typography>編集モード</Typography>
            )}
            <Button disabled={lockData && lockData?.addUser !== user?.name ? true : false} onClick={handleEdit}>
              変更
            </Button>
          </Grid2>
          <BackButton label={'戻る'} />
        </Grid2>
      </Box>
      {/*受注ヘッダー*/}
      <Accordion expanded={expanded} onChange={handleExpansion}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Box display="flex" justifyContent="space-between" alignItems="center" py={1} width="100%">
            <Grid2 container display="flex" justifyContent="space-between" spacing={2}>
              <Typography>受注ヘッダー</Typography>
              <Grid2 container display={expanded ? 'none' : 'flex'} spacing={2}>
                <Typography>公演名</Typography>
                <Typography>{props.juchuHeadData.koenNam}</Typography>
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
                    <TextField value={props.juchuHeadData.juchuHeadId} disabled></TextField>
                  </Grid2>
                  <Grid2 display="flex" direction="row" alignItems="center">
                    <Typography mr={2}>受注ステータス</Typography>
                    <FormControl size="small" sx={{ width: 120 }}>
                      <Select value={props.juchuHeadData.juchuSts} disabled>
                        <MenuItem value={0}>入力中</MenuItem>
                        <MenuItem value={1}>仮受注</MenuItem>
                        <MenuItem value={2}>処理中</MenuItem>
                        <MenuItem value={3}>確定</MenuItem>
                        <MenuItem value={4}>貸出済み</MenuItem>
                        <MenuItem value={5}>返却済み</MenuItem>
                        <MenuItem value={9}>受注キャンセル</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid2>
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注日
                </Typography>
                <TextField value={props.juchuHeadData.juchuDat} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  入力者
                </Typography>
                <TextField value={props.juchuHeadData.nyuryokuUser} disabled></TextField>
              </Box>
            </Grid2>
            <Grid2>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  公演名
                </Typography>
                <TextField value={props.juchuHeadData.koenNam} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3} whiteSpace="nowrap">
                  公演場所
                </Typography>
                <TextField value={props.juchuHeadData.koenbashoNam} disabled></TextField>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  相手
                </Typography>
                <TextField value={props.juchuHeadData.kokyaku.kokyakuNam} disabled></TextField>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/*受注明細ヘッダー*/}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Accordion
          sx={{
            mt: 2,
            '& .Mui-expanded': {
              mt: 2,
            },
          }}
          defaultExpanded
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
            <Box display="flex" alignItems={'center'} justifyContent="space-between" py={1} width={'100%'}>
              <Typography>受注機材ヘッダー</Typography>
              <Button
                type="submit"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={!edit}
              >
                <CheckIcon fontSize="small" />
                保存
              </Button>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0 }}>
            <Divider />
            <Grid2 container alignItems="center" spacing={2} p={2}>
              <Grid2 container alignItems="center">
                <Typography>機材明細名</Typography>
                <TextFieldElement name="headNam" control={control} disabled={!edit}></TextFieldElement>
              </Grid2>
              <Grid2 container alignItems="center">
                <Typography>小計金額</Typography>
                <TextField disabled={!edit} />
              </Grid2>
              <Grid2 container alignItems="center">
                <Typography>値引き</Typography>
                <TextFieldElement
                  name="nebikiAmt"
                  control={control}
                  type="number"
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                    },
                    '& input[type=number]::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  }}
                  disabled={!edit}
                ></TextFieldElement>
                <Typography>円</Typography>
              </Grid2>
              <Grid2 container alignItems="center">
                <Typography>税区分</Typography>
                <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                  <Controller
                    name="zeiKbn"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} disabled={!edit}>
                        <MenuItem value={0}>無し</MenuItem>
                        <MenuItem value={1}>内税</MenuItem>
                        <MenuItem value={2}>外税</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid2>
            </Grid2>
            <Grid2 container p={2} spacing={2}>
              <Grid2 width={400}>
                <Typography>出庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="kicsShukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        maxDate={new Date(actualDateRange[0])}
                        onChange={handleKICSStartChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={() => field.onChange(null)}
                      />
                    )}
                  />
                  <Controller
                    name="kicsShukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestTime
                        onBlur={field.onBlur}
                        time={field.value}
                        onChange={(newTime) => field.onChange(newTime?.toDate())}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
                <Grid2>
                  <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="yardShukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        maxDate={new Date(actualDateRange[0])}
                        onChange={handleYARDStartChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={() => field.onChange(null)}
                      />
                    )}
                  />
                  <Controller
                    name="yardShukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestTime
                        onBlur={field.onBlur}
                        time={field.value}
                        onChange={(newTime) => field.onChange(newTime?.toDate())}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>
              <Grid2 width={400}>
                <Typography>入庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="kicsNyukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        minDate={new Date(actualDateRange[actualDateRange.length - 1])}
                        onChange={handleKICSEndChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={() => field.onChange(null)}
                      />
                    )}
                  />
                  <Controller
                    name="kicsNyukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestTime
                        onBlur={field.onBlur}
                        time={field.value}
                        onChange={(newTime) => field.onChange(newTime?.toDate())}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
                <Grid2>
                  <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="yardNyukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        minDate={new Date(actualDateRange[actualDateRange.length - 1])}
                        onChange={handleYARDEndChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={() => field.onChange(null)}
                      />
                    )}
                  />
                  <Controller
                    name="yardNyukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestTime
                        onBlur={field.onBlur}
                        time={field.value}
                        onChange={(newTime) => field.onChange(newTime?.toDate())}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>
              <Grid2 container alignItems="center" py={1}>
                <Typography>メモ</Typography>
                <TextFieldElement name="mem" control={control} multiline rows={3} disabled={!edit}></TextFieldElement>
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
            <Grid2>
              <Button disabled={!edit}>
                <CheckIcon fontSize="small" />
                保存
              </Button>
            </Grid2>
          </Box>
          <Divider />

          <Dialog open={EqSelectionDialogOpen} fullScreen>
            <EquipmentSelectionDialog handleCloseDialog={handleCloseEqDialog} />
          </Dialog>

          <Box display={'flex'} flexDirection="row" width="100%">
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
              <Box m={2}>
                <Button disabled={!edit} onClick={() => handleOpenEqDialog()}>
                  <AddIcon fontSize="small" />
                  機材追加
                </Button>
              </Box>
              <Box display={Object.keys(eqList).length > 0 ? 'block' : 'none'}>
                <EqTable
                  rows={eqList}
                  onChange={handleCellChange}
                  handleCellDateChange={handleCellDateChange}
                  handleMemoChange={handleMemoChange}
                  ref={leftRef}
                />
              </Box>
            </Box>
            <Box
              display={Object.keys(eqList).length > 0 ? 'block' : 'none'}
              overflow="auto"
              sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}
            >
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
              <StockTable
                header={dateHeader}
                rows={stockRows}
                eqStockList={eqStockList}
                dateRange={dateRange}
                startDate={startDate}
                endDate={endDate}
                preparation={preparation}
                RH={RH}
                GP={GP}
                actual={actual}
                ref={rightRef}
              />
            </Box>
          </Box>
        </Paper>
        {/*本番日*/}
        <Paper variant="outlined" sx={{ mt: 2 }}>
          <Box>
            <Box display="flex" alignItems="center" p={2}>
              <Typography>本番日数</Typography>
              <TextFieldElement
                name="juchuHonbanbiQty"
                control={control}
                type="number"
                sx={{
                  width: '5%',
                  minWidth: '60px',
                  ml: 2,
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
                disabled={!edit}
              ></TextFieldElement>
              <Typography marginLeft={1}>日</Typography>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={{ xs: 2, sm: 9, md: 9, lg: 9 }} whiteSpace="nowrap">
                本番日
              </Typography>
              <Button disabled={!edit} onClick={handleOpenDateDialog}>
                編集
              </Button>
              <Dialog open={dateSelectionDialogOpne} fullScreen sx={{ zIndex: 1201 }}>
                <DateSelectDialog
                  startDate={startDate}
                  endDate={endDate}
                  preparation={preparation}
                  RH={RH}
                  GP={GP}
                  actual={actual}
                  onClose={handleCloseDateDialog}
                  onSave={handleSave}
                />
              </Dialog>
            </Box>
            <Grid2 container spacing={1} ml={{ xs: 10, sm: 17, md: 17, lg: 17 }} py={2} width={{ md: '50%' }}>
              <Grid2 size={12}>
                <Button sx={{ color: 'white', bgcolor: 'mediumpurple' }}>仕込</Button>
              </Grid2>
              <Grid2 size={5} display="flex">
                <Typography>日付</Typography>
              </Grid2>
              <Grid2 size={7} display="flex">
                <Typography>メモ</Typography>
              </Grid2>
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="column"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              width={{ md: '50%' }}
            >
              {preparation.map((data, index) => (
                <Grid2 key={index} container display="flex" flexDirection="row">
                  <Grid2 size={5}>
                    <Typography>{data.date}</Typography>
                  </Grid2>
                  <Grid2 size={7}>
                    <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.memo}</Typography>
                  </Grid2>
                </Grid2>
              ))}
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="row"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              py={2}
              width={{ md: '50%' }}
            >
              <Grid2 size={12}>
                <Button sx={{ color: 'white', bgcolor: 'orange' }}>RH</Button>
              </Grid2>
              <Grid2 size={5}>
                <Typography>日付</Typography>
              </Grid2>
              <Grid2 size={7}>
                <Typography>メモ</Typography>
              </Grid2>
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="column"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              width={{ md: '50%' }}
            >
              {RH.map((data, index) => (
                <Grid2 key={index} container display="flex" flexDirection="row">
                  <Grid2 size={5}>
                    <Typography>{data.date}</Typography>
                  </Grid2>
                  <Grid2 size={7}>
                    <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                  </Grid2>
                </Grid2>
              ))}
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="row"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              py={2}
              width={{ md: '50%' }}
            >
              <Grid2 size={12}>
                <Button sx={{ color: 'white', bgcolor: 'lightgreen' }}>GP</Button>
              </Grid2>
              <Grid2 size={5}>
                <Typography>日付</Typography>
              </Grid2>
              <Grid2 size={7}>
                <Typography>メモ</Typography>
              </Grid2>
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="column"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              width={{ md: '50%' }}
            >
              {GP.map((data, index) => (
                <Grid2 key={index} container display="flex" flexDirection="row">
                  <Grid2 size={5}>
                    <Typography>{data.date}</Typography>
                  </Grid2>
                  <Grid2 size={7}>
                    <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                  </Grid2>
                </Grid2>
              ))}
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="row"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              py={2}
              width={{ md: '50%' }}
            >
              <Grid2 size={12}>
                <Button sx={{ color: 'white', bgcolor: 'pink' }}>本番</Button>
              </Grid2>
              <Grid2 size={5}>
                <Typography>日付</Typography>
              </Grid2>
              <Grid2 size={7}>
                <Typography>メモ</Typography>
              </Grid2>
            </Grid2>
            <Grid2
              container
              display="flex"
              flexDirection="column"
              spacing={1}
              ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
              width={{ md: '50%' }}
            >
              {actual.map((data, index) => (
                <Grid2 key={index} container display="flex" flexDirection="row">
                  <Grid2 size={5}>
                    <Typography>{data.date}</Typography>
                  </Grid2>
                  <Grid2 size={7}>
                    <Typography sx={{ wordBreak: 'break-word' }}>{data.memo}</Typography>
                  </Grid2>
                </Grid2>
              ))}
            </Grid2>
            <Grid2 container alignItems="center" spacing={2} p={2}>
              <Typography>入出庫ステータス</Typography>
              <TextField disabled defaultValue={'準備中'}></TextField>
            </Grid2>
          </Box>
        </Paper>
      </form>
      <Fab color="primary" onClick={scrollTop} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
        <ArrowUpwardIcon fontSize="small" />
      </Fab>
    </Box>
  );
};

export default EquipmentOrderDetail;

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
