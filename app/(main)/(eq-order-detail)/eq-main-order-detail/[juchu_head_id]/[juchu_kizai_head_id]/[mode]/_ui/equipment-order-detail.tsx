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
import { redirect, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';
import { shouldDisplay } from 'rsuite/esm/internals/Picker';

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
import { GetNyukoDate, GetShukoDate, toISOStringYearMonthDay } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';
import {
  AddHonbanbi,
  AddJuchuKizaiHead,
  AddJuchuKizaiNyushuko,
  ConfirmHonbanbi,
  GetDspOrdNum,
  GetHonbanbi,
  GetMaxId,
  GetStockList,
  UpdateHonbanbi,
  UpdateJuchuKizaiHead,
  UpdateJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { AddLock, DeleteLock, GetLock } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/hook';
import { LockValues, OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';
import { IsDirtyAlertDialog } from '@/app/(main)/order/[juchu_head_id]/[mode]/_ui/caveat-dialog';

import { data, stock } from '../_lib/data';
import {
  JuchuKizaiHeadSchema,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../_lib/types';
import { SaveAlertDialog } from './caveat-dialog';
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
      range.push(toISOStringYearMonthDay(new Date(current)));
      current.setDate(current.getDate() + 1);
    }
    return range;
  }
  return [];
};

// // ストックテーブルの日付ヘッダーの作成
// const getStockHeader = (date: Date | null) => {
//   const start = date !== null ? subDays(date, 1) : subDays(new Date(), 1);
//   const end = date !== null ? endOfMonth(addMonths(date, 2)) : endOfMonth(addMonths(new Date(), 2));
//   const range: string[] = [];
//   const current = new Date(start);

//   while (current <= end) {
//     const dateStr = toISOStringWithTimezoneMonthDay(current).split('T')[0];
//     range.push(dateStr);
//     current.setDate(current.getDate() + 1);
//   }

//   return range;
// };

// // ストックテーブルの行作成
// const getStockRow = (stock: number[], length: number) => {
//   const rows: StockData[] = [];

//   stock.map((num, index) => {
//     const data: number[] = [];
//     for (let i = 0; i < length; i++) {
//       data.push(num);
//     }
//     const row: StockData = { id: index + 1, data: data };
//     rows.push(row);
//   });

//   return rows;
// };

// // 200件用データ作成
// export const testeqData: Equipment[] = Array.from({ length: 50 }, (_, i) => {
//   const original = data[i % data.length];
//   return {
//     ...original,
//     id: i + 1,
//     name: `${original.name} (${i + 1})`,
//     date: original.date,
//     memo: original.memo,
//     place: original.place,
//     all: original.all,
//     order: original.order,
//     spare: original.spare,
//     total: original.total,
//   };
// });
// // 200件用データ作成
// export const testStock = Array.from({ length: 50 }, (_, i) => stock[i % stock.length]);

const EquipmentOrderDetail = (props: {
  juchuHeadData: OrderValues;
  juchuKizaiHeadData: JuchuKizaiHeadValues;
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] | undefined;
  shukoDate: Date | null;
  nyukoDate: Date | null;
  dateRange: string[];
  eqStockData: StockTableValues[][] | undefined;
  juchuHonbanbiData: JuchuKizaiHonbanbiValues[] | undefined;
  edit: boolean;
  lockData: LockValues | null;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const juchuKizaiHeadSaveFlag = props.juchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;
  // 未保存ダイアログを出すかどうか
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログを出すかどうか
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(props.lockData);
  // 受注機材明細元データ
  const [originJuchuKizaiMeisaiList, setOriginJuchuKizaiMeisaiList] = useState<JuchuKizaiMeisaiValues[]>(
    props.juchuKizaiMeisaiData ? props.juchuKizaiMeisaiData : []
  );
  // 受注機材明細リスト
  const [juchuKizaiMeisaiList, setJuchuKizaiMeisaiList] = useState<JuchuKizaiMeisaiValues[]>(
    props.juchuKizaiMeisaiData ? props.juchuKizaiMeisaiData : []
  );
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(props.eqStockData ? props.eqStockData : []);

  // 受注本番日リスト
  const [juchuHonbanbiList, setJuchuHonbanbiList] = useState<JuchuKizaiHonbanbiValues[]>(
    props.juchuHonbanbiData ? props.juchuHonbanbiData : []
  );

  // 出庫日
  const [shukoDate, setShukoDate] = useState<Date | null>(props.shukoDate);
  // 入庫日
  const [nyukoDate, setNyukoDate] = useState<Date | null>(props.nyukoDate);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(props.dateRange);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(props.shukoDate ? props.shukoDate : new Date());

  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // 日付選択カレンダーダイアログ制御
  const [dateSelectionDialogOpne, setDateSelectionDialogOpne] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // context
  const { setIsDirty, setLock, setLockShubetu, setHeadId } = useDirty();

  // ref
  const dateRangeRef = useRef(dateRange);
  const eqStockListRef = useRef(eqStockList);
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
    setLockShubetu(1);
    setHeadId(props.juchuHeadData.juchuHeadId);

    if (juchuKizaiMeisaiList && juchuKizaiMeisaiList.length > 0 && eqStockList && eqStockList.length > 0) {
      const updatedEqStockData = [...eqStockList];
      const targetIndex = updatedEqStockData[0]
        .map((d, index) => (dateRangeRef.current.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedEqStockData.map((d, i) => {
          d[index].zaikoQty = d[index].zaikoQty - juchuKizaiMeisaiList[i].planQty;
        });
      });
      setEqStockList(updatedEqStockData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    console.log('eqStockList変更');
    eqStockListRef.current = eqStockList;
  }, [eqStockList]);

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
    console.log('保存開始: ', data, eqStockList);
    if (!user) return;
    setIsLoading(true);
    // 新規
    if (data.juchuKizaiHeadId === 0) {
      const maxId = await GetMaxId(data.juchuHeadId);
      const maxDspOrdNum = await GetDspOrdNum();
      if (maxId && maxDspOrdNum) {
        const newJuchuKizaiHeadId = maxId.juchu_kizai_head_id + 1;
        const newDspOrdNum = maxDspOrdNum.dsp_ord_num + 1;
        const headResult = await AddJuchuKizaiHead(newJuchuKizaiHeadId, data, newDspOrdNum, user.name);
        const nyushukoResult = await AddJuchuKizaiNyushuko(newJuchuKizaiHeadId, data, user.name);
        if (headResult && nyushukoResult) {
          redirect(`/eq-main-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/${edit ? 'edit' : 'view'}`);
        }
      }
      // 更新
    } else {
      const headResult = await UpdateJuchuKizaiHead(data, user.name);
      const nyushukoResult = await UpdateJuchuKizaiNyushuko(data, user.name);
      if (headResult && nyushukoResult) {
        // 出庫日
        const updateShukoDate = GetShukoDate(
          data.kicsShukoDat && new Date(data.kicsShukoDat),
          data.yardShukoDat && new Date(data.yardShukoDat)
        );
        setShukoDate(updateShukoDate);
        // 入庫日
        const updateNyukoDate = GetNyukoDate(
          data.kicsNyukoDat && new Date(data.kicsNyukoDat),
          data.yardNyukoDat && new Date(data.yardNyukoDat)
        );
        setNyukoDate(updateNyukoDate);
        // 出庫日から入庫日
        const updateDateRange = getRange(updateShukoDate, updateNyukoDate);
        setDateRange(updateDateRange);
        // 受注機材idリスト
        const ids = juchuKizaiMeisaiList.map((data) => data.kizaiId);
        // 受注機材合計数リスト
        const planQtys = juchuKizaiMeisaiList.map((data) => data.planQty);
        // 機材在庫データ
        const updatedEqStockData: StockTableValues[][] = [];
        if (ids && planQtys) {
          if (!shukoDate) return <div>データに不備があります。</div>;
          for (let i = 0; i < ids.length; i++) {
            const stock: StockTableValues[] = await GetStockList(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              ids[i],
              planQtys[i],
              subDays(shukoDate, 1)
            );
            updatedEqStockData.push(stock);
          }
        }
        if (juchuKizaiMeisaiList && juchuKizaiMeisaiList.length > 0 && eqStockList && eqStockList.length > 0) {
          const targetIndex = updatedEqStockData[0]
            .map((d, index) => (dateRangeRef.current.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
            .filter((index) => index !== -1);
          targetIndex.map((index) => {
            updatedEqStockData.map((d, i) => {
              d[index].zaikoQty = d[index].zaikoQty - juchuKizaiMeisaiList[i].planQty;
            });
          });
          setEqStockList(updatedEqStockData);
        }
      }
      reset(data);
    }
    setIsLoading(false);
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

  /**
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = async (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date.toDate());

      // 受注機材idリスト
      const ids = juchuKizaiMeisaiList?.map((data) => data.kizaiId);
      // 機材数リスト
      const planQtyList = originJuchuKizaiMeisaiList.map((data) => data.planQty);
      // 機材在庫データ
      const updatedEqStockList: StockTableValues[][] = [];
      if (ids) {
        for (let i = 0; i < ids.length; i++) {
          const stock: StockTableValues[] = await GetStockList(
            props.juchuHeadData.juchuHeadId,
            getValues('juchuKizaiHeadId'),
            ids[i],
            planQtyList[i],
            subDays(date.toDate(), 1)
          );
          updatedEqStockList.push(stock);
        }
      }

      if (juchuKizaiMeisaiList && juchuKizaiMeisaiList.length > 0 && eqStockList && eqStockList.length > 0) {
        const targetIndex = updatedEqStockList[0]
          .map((d, index) => (dateRange.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
          .filter((index) => index !== -1);
        targetIndex.map((index) => {
          updatedEqStockList.map((d, i) => {
            d[index].zaikoQty = d[index].zaikoQty - juchuKizaiMeisaiList[i].planQty;
          });
        });
        setEqStockList(updatedEqStockList);
      }

      setAnchorEl(null);
    }
  };
  // 3か月前
  const handleBackDateChange = () => {
    const date = subMonths(new Date(selectDate), 3);
    handleDateChange(dayjs(date));
  };
  // 3か月後
  const handleForwardDateChange = () => {
    const date = addMonths(new Date(selectDate), 3);
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

  const handleCellDateClear = (rowIndex: number) => {
    setJuchuKizaiMeisaiList((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, idoDenDat: null } : row)));
  };

  /**
   * 機材メモ入力時
   * @param rowIndex 入力された行番号
   * @param memo メモ内容
   */
  const handleMemoChange = (rowIndex: number, memo: string) => {
    const updatedEqList = [...juchuKizaiMeisaiList];
    updatedEqList[rowIndex].mem = memo;
    setJuchuKizaiMeisaiList(updatedEqList);
  };

  /**
   * 機材テーブルの受注数、予備数入力時
   * @param rowIndex 入力された行番号
   * @param orderValue 受注数
   * @param spareValue 予備数
   * @param totalValue 合計
   */
  const handleCellChange = (rowIndex: number, planKizaiQty: number, planYobiQty: number, planQty: number) => {
    const updatedEqStockData = eqStockListRef.current[rowIndex];
    if (
      juchuKizaiMeisaiList &&
      juchuKizaiMeisaiList.length > 0 &&
      eqStockListRef.current &&
      eqStockListRef.current.length > 0
    ) {
      const targetIndex = updatedEqStockData
        .map((d, index) => (dateRange.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedEqStockData[index].zaikoQty =
          updatedEqStockData[index].zaikoQty + juchuKizaiMeisaiList[rowIndex].planQty - planQty;
      });
    }
    setEqStockList((prev) => prev.map((data, i) => (i === rowIndex ? [...updatedEqStockData] : data)));

    setJuchuKizaiMeisaiList((prev) =>
      prev.map((data, i) =>
        i === rowIndex ? { ...data, planKizaiQty: planKizaiQty, planYobiQty: planYobiQty, planQty: planQty } : data
      )
    );
  };

  /**
   * 機材テーブルの日付変更時
   * @param rowIndex 入力された行番号
   * @param date 日付
   */
  const handleCellDateChange = (rowIndex: number, date: Dayjs | null) => {
    if (date !== null) {
      const newDate = date.toDate();
      setJuchuKizaiMeisaiList((prev) => prev.map((row, i) => (i === rowIndex ? { ...row, idoDenDat: newDate } : row)));
    }
  };

  /**
   * KICS出庫日時変更時
   * @param newDate KICS出庫日
   */
  const handleKicsShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsShukoDat', newDate.toDate(), { shouldDirty: true });
    const yardShukoDat = getValues('yardShukoDat');

    if (yardShukoDat === null || newDate.toDate() <= yardShukoDat) {
      setShukoDate(newDate.toDate());
    }
    if (Object.keys(juchuKizaiMeisaiList).length > 0 && yardShukoDat === null) {
      setJuchuKizaiMeisaiList((prev) =>
        prev.map((row) => (row.shozokuId === 2 ? { ...row, idoDenDat: subDays(newDate.toDate(), 2) } : row))
      );
    }
  };

  /**
   * YARD出庫日時変更時
   * @param newDate YARD出庫日
   */
  const handleYardShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('yardShukoDat', newDate.toDate(), { shouldDirty: true });
    const kicsShukoDat = getValues('kicsShukoDat');

    if (kicsShukoDat === null || newDate.toDate() <= kicsShukoDat) {
      setShukoDate(newDate.toDate());
    }
    if (Object.keys(juchuKizaiMeisaiList).length > 0 && kicsShukoDat === null) {
      setJuchuKizaiMeisaiList((prev) =>
        prev.map((row) => (row.shozokuId === 1 ? { ...row, idoDenDat: subDays(newDate.toDate(), 2) } : row))
      );
    }
  };

  /**
   * KICS入庫日時変更時
   * @param newDate KICS入庫日
   */
  const handleKicsNyukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsNyukoDat', newDate.toDate(), { shouldDirty: true });
    const yardNyukoDat = getValues('yardNyukoDat');

    if (yardNyukoDat === null || newDate.toDate() >= yardNyukoDat) {
      setNyukoDate(newDate.toDate());
    }
  };

  /**
   * YARD入庫日時変更時
   * @param newDate YARD入庫日
   */
  const handleYardNyukoChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('yardNyukoDat', newDate.toDate(), { shouldDirty: true });
    const kicsNyukoDat = getValues('kicsNyukoDat');

    if (kicsNyukoDat === null || newDate.toDate() >= kicsNyukoDat) {
      setNyukoDate(newDate.toDate());
    }
  };

  /**
   * 本番日入力ダイアログでの入力値反映
   */
  const handleSave = async () => {
    if (!user) return;
    // 受注ヘッダーid
    const juchuHeadId = getValues('juchuHeadId');
    // 受注機材ヘッダーid
    const juchuKizaiHeadId = getValues('juchuKizaiHeadId');
    // 受注機材idリスト
    const ids = juchuKizaiMeisaiList.map((data) => data.kizaiId);
    // 受注機材合計数リスト
    const planQtys = juchuKizaiMeisaiList.map((data) => data.planQty);

    // 機材在庫データ
    const updatedEqStockData: StockTableValues[][] = [];
    if (ids && planQtys) {
      if (!shukoDate) return <div>データに不備があります。</div>;
      for (let i = 0; i < ids.length; i++) {
        const stock: StockTableValues[] = await GetStockList(
          juchuHeadId,
          juchuKizaiHeadId,
          ids[i],
          planQtys[i],
          subDays(shukoDate, 1)
        );
        updatedEqStockData.push(stock);
      }
    }
    if (juchuKizaiMeisaiList && juchuKizaiMeisaiList.length > 0 && eqStockList && eqStockList.length > 0) {
      const targetIndex = updatedEqStockData[0]
        .map((d, index) => (dateRangeRef.current.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
        .filter((index) => index !== -1);
      targetIndex.map((index) => {
        updatedEqStockData.map((d, i) => {
          d[index].zaikoQty = d[index].zaikoQty - juchuKizaiMeisaiList[i].planQty;
        });
      });
      setEqStockList(updatedEqStockData);
    }
    // 受注本番日データ
    const updateJuchuHonbanbiData = await GetHonbanbi(juchuHeadId, juchuKizaiHeadId);
    if (updateJuchuHonbanbiData) {
      setJuchuHonbanbiList(updateJuchuHonbanbiData);
    }
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
    if (!juchuKizaiHeadSaveFlag) {
      setSaveOpen(true);
    } else if (isDirty || JSON.stringify(originJuchuKizaiMeisaiList) !== JSON.stringify(juchuKizaiMeisaiList)) {
      setDirtyOpen(true);
    } else {
      setDateSelectionDialogOpne(true);
    }
  };
  const handleCloseDateDialog = () => {
    setDateSelectionDialogOpne(false);
  };

  // isDirtyDialogの破棄、戻るボタン押下
  const handleResultDialog = async (result: boolean) => {
    if (result) {
      reset();
      if (
        originJuchuKizaiMeisaiList &&
        originJuchuKizaiMeisaiList.length > 0 &&
        props.eqStockData &&
        props.eqStockData.length > 0
      ) {
        setJuchuKizaiMeisaiList(originJuchuKizaiMeisaiList);
        console.log('zzzzzzzzzzzzzzzzzzzzzzzzzz', props.eqStockData);
        const updatedEqStockData = props.eqStockData;
        console.log('aaaaaaaaaaaaaaaaaaaa', updatedEqStockData);
        const targetIndex = updatedEqStockData[0]
          .map((d, index) => (dateRangeRef.current.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
          .filter((index) => index !== -1);
        console.log('bbbbbbbbbbbbbbbbbbbbbbbb', targetIndex);
        targetIndex.map((index) => {
          updatedEqStockData.map((d, i) => {
            d[index].zaikoQty = d[index].zaikoQty - originJuchuKizaiMeisaiList[i].planQty;
          });
        });
        console.log('ccccccccccccccccccccccc', updatedEqStockData);
        setEqStockList(updatedEqStockData);
      }
      setIsDirty(false);
      setDirtyOpen(false);
      setDateSelectionDialogOpne(true);
    } else {
      setDirtyOpen(false);
    }
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
                <TextField
                  value={props.juchuHeadData.koenbashoNam ? props.juchuHeadData.koenbashoNam : ''}
                  disabled
                ></TextField>
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
      {/*受注機材ヘッダー*/}
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
                  console.log(juchuHonbanbiList);
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
                        maxDate={
                          juchuHonbanbiList.length > 0 ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat) : undefined
                        }
                        onChange={handleKicsShukoChange}
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
                        maxDate={
                          juchuHonbanbiList.length > 0 ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat) : undefined
                        }
                        onChange={handleYardShukoChange}
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
                        minDate={
                          juchuHonbanbiList.length > 0
                            ? new Date(juchuHonbanbiList[juchuHonbanbiList.length - 1].juchuHonbanbiDat)
                            : undefined
                        }
                        onChange={handleKicsNyukoChange}
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
                        minDate={
                          juchuHonbanbiList.length > 0
                            ? new Date(juchuHonbanbiList[juchuHonbanbiList.length - 1].juchuHonbanbiDat)
                            : undefined
                        }
                        onChange={handleYardNyukoChange}
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
              <Grid2 container alignItems="center" spacing={2}>
                <Typography>入出庫ステータス</Typography>
                <TextField disabled defaultValue={'準備中'}></TextField>
              </Grid2>
            </Grid2>
          </AccordionDetails>
        </Accordion>
      </form>
      {/*受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" py={1} px={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
          <Grid2>
            <Button disabled={!edit} onClick={() => console.log(props.eqStockData)}>
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
            <Box display={Object.keys(juchuKizaiMeisaiList).length > 0 ? 'block' : 'none'}>
              <EqTable
                rows={juchuKizaiMeisaiList}
                onChange={handleCellChange}
                handleCellDateChange={handleCellDateChange}
                handleCellDateClear={handleCellDateClear}
                handleMemoChange={handleMemoChange}
                ref={leftRef}
              />
            </Box>
          </Box>
          <Box
            display={Object.keys(eqStockList).length > 0 ? 'block' : 'none'}
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
            <StockTable eqStockList={eqStockList} dateRange={dateRange} ref={rightRef} />
          </Box>
        </Box>
      </Paper>
      {/*本番日*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box>
          <Box sx={styles.container}>
            <Typography marginRight={{ xs: 2, sm: 9, md: 9, lg: 9 }} whiteSpace="nowrap">
              本番日
            </Typography>
            <Button disabled={!edit} onClick={handleOpenDateDialog}>
              編集
            </Button>
            <Dialog open={dateSelectionDialogOpne} fullScreen sx={{ zIndex: 1201 }}>
              <DateSelectDialog
                userNam={user.name}
                juchuHeadId={getValues('juchuHeadId')}
                juchuKizaiHeadId={getValues('juchuKizaiHeadId')}
                shukoDate={shukoDate}
                nyukoDate={nyukoDate}
                juchuHonbanbiList={juchuHonbanbiList}
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
            {juchuHonbanbiList &&
              juchuHonbanbiList.map(
                (data, index) =>
                  data.juchuHonbanbiShubetuId === 10 && (
                    <Grid2 key={index} container display="flex" flexDirection="row">
                      <Grid2 size={5}>
                        <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
                      </Grid2>
                      <Grid2 size={7}>
                        <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                      </Grid2>
                    </Grid2>
                  )
              )}
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
            {juchuHonbanbiList &&
              juchuHonbanbiList.map(
                (data, index) =>
                  data.juchuHonbanbiShubetuId === 20 && (
                    <Grid2 key={index} container display="flex" flexDirection="row">
                      <Grid2 size={5}>
                        <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
                      </Grid2>
                      <Grid2 size={7}>
                        <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                      </Grid2>
                    </Grid2>
                  )
              )}
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
            {juchuHonbanbiList &&
              juchuHonbanbiList.map(
                (data, index) =>
                  data.juchuHonbanbiShubetuId === 30 && (
                    <Grid2 key={index} container display="flex" flexDirection="row">
                      <Grid2 size={5}>
                        <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
                      </Grid2>
                      <Grid2 size={7}>
                        <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                      </Grid2>
                    </Grid2>
                  )
              )}
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
            {juchuHonbanbiList &&
              juchuHonbanbiList.map(
                (data, index) =>
                  data.juchuHonbanbiShubetuId === 40 && (
                    <Grid2 key={index} container display="flex" flexDirection="row">
                      <Grid2 size={5}>
                        <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
                      </Grid2>
                      <Grid2 size={7}>
                        <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                      </Grid2>
                    </Grid2>
                  )
              )}
          </Grid2>
        </Box>
      </Paper>
      <Fab color="primary" onClick={scrollTop} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
        <ArrowUpwardIcon fontSize="small" />
      </Fab>
      <SaveAlertDialog open={saveOpen} onClick={() => setSaveOpen(false)} />
      <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
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
