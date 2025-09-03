'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
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
  Container,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringMonthDay, toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { AddLock, DelLock, GetLock } from '@/app/(main)/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, TestDate } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import Time, { TestTime } from '@/app/(main)/_ui/time';
import { GetStockList } from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { OyaJuchuKizaiNyushukoValues } from '@/app/(main)/(eq-order-detail)/_lib/types';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import {
  JuchuKizaiHeadValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';
import { SelectedEqptsValues } from '@/app/(main)/(masters)/eqpt-master/_lib/types';
import { OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';

import { EqptSelectionDialog } from '../../../../../../eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_ui/equipment-selection-dailog';
import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { data, stock } from '../_lib/data';
import { ReturnJuchuKizaiHeadSchema, ReturnJuchuKizaiHeadValues, ReturnJuchuKizaiMeisaiValues } from '../_lib/types';
import { ReturnEqTable, ReturnStockTable } from './equipment-return-order-detail-table';

export const EquipmentReturnOrderDetail = (props: {
  juchuHeadData: OrderValues;
  oyaJuchuKizaiNyushukoData: OyaJuchuKizaiNyushukoValues;
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues;
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] | undefined;
  eqStockData: StockTableValues[][] | undefined;
  oyaShukoDate: Date;
  oyaNyukoDate: Date;
  stockTableHeaderDateRange: string[];
  returnNyukoDate: Date | null;
  dateRange: string[];
  edit: boolean;
}) => {
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.returnJuchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;
  // 全体の保存フラグ
  const [save, setSave] = useState(false);

  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);

  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 返却受注機材明細元データ
  const [originReturnJuchuKizaiMeisaiList, setOriginReturnJuchuKizaiMeisaiList] = useState<
    ReturnJuchuKizaiMeisaiValues[]
  >(props.returnJuchuKizaiMeisaiData ?? []);
  // 返却受注機材明細リスト
  const [returnJuchuKizaiMeisaiList, setReturnJuchuKizaiMeisaiList] = useState<ReturnJuchuKizaiMeisaiValues[]>(
    props.returnJuchuKizaiMeisaiData ?? []
  );
  // 機材在庫元データ
  const [originEqStockList, setOriginEqStockList] = useState<StockTableValues[][]>(props.eqStockData ?? []);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(props.eqStockData ?? []);
  // 返却受注機材明細元合計数
  const [originReturnPlanQty, setOriginReturnPlanQty] = useState<number[]>(
    props.returnJuchuKizaiMeisaiData ? props.returnJuchuKizaiMeisaiData.map((data) => data.planQty ?? 0) : []
  );

  // 親出庫日
  const [oyaShukoDate, setShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
  // 入庫日
  const [endDate, setEndDate] = useState<Date | null>(props.returnNyukoDate);
  // 返却入庫日から親入庫日
  const [dateRange, setDateRange] = useState<string[]>(props.dateRange);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(props.oyaShukoDate);

  // 未保存ダイアログを出すかどうか
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログを出すかどうか
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // 合計金額
  const [priceTotal, setPriceTotal] = useState(
    returnJuchuKizaiMeisaiList!.reduce(
      (sum, row) =>
        props.returnJuchuKizaiHeadData.juchuHonbanbiQty && row.planKizaiQty
          ? sum + row.kizaiTankaAmt * row.planKizaiQty * props.returnJuchuKizaiHeadData.juchuHonbanbiQty
          : 0,
      0
    )
  );

  // 編集中かどうか
  const [isEditing, setIsEditing] = useState(false);

  // context
  const { setIsDirty, setIsSave, setLock } = useDirty();

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
      juchuHeadId: props.returnJuchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.returnJuchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.returnJuchuKizaiHeadData.juchuKizaiHeadKbn,
      juchuHonbanbiQty: props.returnJuchuKizaiHeadData.juchuHonbanbiQty,
      nebikiAmt: props.returnJuchuKizaiHeadData.nebikiAmt,
      mem: props.returnJuchuKizaiHeadData.mem,
      headNam: props.returnJuchuKizaiHeadData.headNam,
      kicsNyukoDat: props.returnJuchuKizaiHeadData.kicsNyukoDat
        ? new Date(props.returnJuchuKizaiHeadData.kicsNyukoDat)
        : null,
      yardNyukoDat: props.returnJuchuKizaiHeadData.yardNyukoDat
        ? new Date(props.returnJuchuKizaiHeadData.yardNyukoDat)
        : null,
    },
    resolver: zodResolver(ReturnJuchuKizaiHeadSchema),
  });

  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty, save);

  /**
   * useEffect
   */
  useEffect(() => {
    setSave(saveKizaiHead);
    setIsSave(saveKizaiHead);
  }, [saveKizaiHead, setIsSave]);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    if (!user) return;

    const asyncProcess = async () => {
      setIsLoading(true);
      const lockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (props.edit && lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
        setLockData(newLockData);
      } else if (props.edit && lockData !== null && lockData.addUser !== user.name) {
        setEdit(false);
      }
      setIsLoading(false);
    };
    asyncProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
    if (
      saveKizaiHead &&
      JSON.stringify(originReturnJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList)
    ) {
      setSave(true);
      setIsSave(true);
    } else {
      setSave(false);
      setIsSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnJuchuKizaiMeisaiList]);

  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  useEffect(() => {
    console.log('dateRange変更');
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  useEffect(() => {
    console.log('eqStockList変更');
    eqStockListRef.current = eqStockList;
  }, [eqStockList]);

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

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
    // 編集→閲覧
    if (edit) {
      const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
      if (isDirty || JSON.stringify(originReturnJuchuKizaiMeisaiList) !== JSON.stringify(filterJuchuKizaiMeisaiList)) {
        setDirtyOpen(true);
        return;
      }

      await DelLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      // 閲覧→編集
    } else {
      if (!user) return;
      const lockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
        setLockData(newLockData);
        setEdit(true);
      } else if (lockData !== null && lockData.addUser === user.name) {
        setEdit(true);
      }
    }
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
   * 機材在庫テーブル更新
   * @param juchuHeadId 受注ヘッダーid
   * @param juchuKizaiHeadId 受注機材ヘッダーid
   * @param shukoDate 出庫日
   * @param juchuKizaiMeisaiData 受注機材明細データ
   */
  const updateEqStock = async (
    juchuHeadId: number,
    juchuKizaiHeadId: number,
    shukoDate: Date,
    juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[]
  ) => {
    // 受注機材idリスト
    const ids = juchuKizaiMeisaiData.map((data) => data.kizaiId);
    // 機材在庫データ
    const updatedEqStockData: StockTableValues[][] = [];
    if (ids) {
      for (let i = 0; i < ids.length; i++) {
        const stock: StockTableValues[] = await GetStockList(
          juchuHeadId,
          juchuKizaiHeadId,
          ids[i],
          subDays(shukoDate, 1)
        );
        updatedEqStockData.push(stock);
      }
    }
    setEqStockList(updatedEqStockData);
    return updatedEqStockData;
  };

  /**
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = async (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date.toDate());
      const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
      const updatedEqStockData = await updateEqStock(
        getValues('juchuHeadId'),
        getValues('juchuKizaiHeadId'),
        date.toDate(),
        filterJuchuKizaiMeisaiList
      );

      if (
        returnJuchuKizaiMeisaiList &&
        returnJuchuKizaiMeisaiList.length > 0 &&
        updatedEqStockData &&
        updatedEqStockData.length > 0
      ) {
        const targetIndex = updatedEqStockData[0]
          .map((d, index) => (dateRange.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
          .filter((index) => index !== -1);

        const subUpdatedEqStockData = updatedEqStockData.map((data, index) =>
          data.map((d, i) =>
            targetIndex.includes(i)
              ? {
                  ...d,
                  zaikoQty:
                    Number(d.zaikoQty) + originReturnPlanQty[index] - (filterJuchuKizaiMeisaiList[index].planQty ?? 0),
                }
              : d
          )
        );

        setEqStockList(subUpdatedEqStockData);
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

  /**
   * 機材メモ入力時
   * @param kizaiId 機材id
   * @param memo メモ内容
   */
  const handleMemoChange = (kizaiId: number, memo: string) => {
    setReturnJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId ? { ...data, mem: memo } : data))
    );
  };

  /**
   * 機材テーブルの受注数、予備数入力時
   * @param kizaiId 機材id
   * @param planKizaiQty 受注数
   * @param planYobiQty 予備数
   * @param planQty 合計
   */
  const handleCellChange = (kizaiId: number, planKizaiQty: number, planYobiQty: number, planQty: number) => {
    const rowIndex = eqStockListRef.current.findIndex((data) => data.some((d) => d.kizaiId === kizaiId));
    const updatedEqStockData = eqStockListRef.current[rowIndex];
    const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const kizaiQty = filterJuchuKizaiMeisaiList.find((data) => data.kizaiId === kizaiId)?.planQty || 0;
    if (
      returnJuchuKizaiMeisaiList &&
      returnJuchuKizaiMeisaiList.length > 0 &&
      eqStockListRef.current &&
      eqStockListRef.current.length > 0
    ) {
      const targetIndex = updatedEqStockData
        .map((d, index) => (dateRange.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
        .filter((index) => index !== -1);
      const subUpdatedEqStockList = updatedEqStockData.map((data, index) =>
        targetIndex.includes(index) ? { ...data, zaikoQty: Number(data.zaikoQty) - kizaiQty + planQty } : data
      );
      setEqStockList((prev) => prev.map((data, i) => (i === rowIndex ? [...subUpdatedEqStockList] : data)));
    }
    const updatedPriceTotal = returnJuchuKizaiMeisaiList
      .filter((data) => !data.delFlag)
      .reduce(
        (sum, row) =>
          getValues('juchuHonbanbiQty') !== null && row.kizaiId === kizaiId
            ? sum + row.kizaiTankaAmt * planKizaiQty * (getValues('juchuHonbanbiQty') ?? 0)
            : getValues('juchuHonbanbiQty') !== null && row.kizaiId !== kizaiId
              ? sum + row.kizaiTankaAmt * (row.planKizaiQty ?? 0) * (getValues('juchuHonbanbiQty') ?? 0)
              : 0,
        0
      );
    setPriceTotal(updatedPriceTotal);
    setReturnJuchuKizaiMeisaiList((prev) =>
      prev.map((data) =>
        data.kizaiId === kizaiId && !data.delFlag
          ? { ...data, planKizaiQty: planKizaiQty, planYobiQty: planYobiQty, planQty: planQty }
          : data
      )
    );
  };

  /**
   * 機材テーブルの削除ボタン押下時
   * @param kizaiId 機材id
   */
  const handleDelete = (kizaiId: number) => {
    const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const rowIndex = filterJuchuKizaiMeisaiList.findIndex((data) => data.kizaiId === kizaiId);
    const updatedJuchuKizaiMeisaiList = filterJuchuKizaiMeisaiList.filter((data) => data.kizaiId !== kizaiId);
    setReturnJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, delFlag: true } : data))
    );
    setEqStockList((prev) => prev.filter((data) => !data.every((d) => d.kizaiId === kizaiId)));
    setOriginReturnPlanQty((prev) => prev.filter((_, index) => index !== rowIndex));
    setPriceTotal(updatedJuchuKizaiMeisaiList.reduce((sum, row) => sum + (row.kizaiTankaAmt ?? 0), 0));
  };

  /**
   * KICS入庫日時変更時
   * @param newDate KICS入庫日
   */
  const handleKicsNyukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsNyukoDat', newDate.toDate(), { shouldDirty: true });

    const yardNyukoDat = getValues('yardNyukoDat');

    if (yardNyukoDat === null) {
      clearErrors('yardNyukoDat');
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

    if (kicsNyukoDat === null) {
      clearErrors('kicsNyukoDat');
    }
  };

  /**
   * 警告ダイアログの押下ボタンによる処理
   * @param result 結果
   */
  const handleResultDialog = async (result: boolean) => {
    if (result) {
      await DelLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      reset();
      setSelectDate(oyaShukoDate ?? new Date());
      setReturnJuchuKizaiMeisaiList(originReturnJuchuKizaiMeisaiList);
      setOriginReturnPlanQty(originReturnJuchuKizaiMeisaiList.map((data) => data.planQty ?? 0));
      setEqStockList(originEqStockList);
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
    }
  };

  const setEqpts = async (data: JuchuKizaiMeisaiValues[]) => {
    const ids = new Set(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterData = data.filter((d) => !ids.has(d.kizaiId));
    const newReturnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = filterData.map((d) => ({
      juchuHeadId: d.juchuHeadId,
      juchuKizaiHeadId: 0,
      juchuKizaiMeisaiId: 0,
      shozokuId: d.shozokuId,
      shozokuNam: d.shozokuNam,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiTankaAmt: d.kizaiTankaAmt,
      kizaiNam: d.kizaiNam,
      oyaPlanKizaiQty: d.planKizaiQty ?? 0,
      oyaPlanYobiQty: d.planYobiQty ?? 0,
      planKizaiQty: 0,
      planYobiQty: 0,
      planQty: 0,
      delFlag: false,
      saveFlag: false,
    }));
    const newIds = newReturnJuchuKizaiMeisaiData.map((data) => data.kizaiId);
    const newPlanQtys = newReturnJuchuKizaiMeisaiData.map((data) => data.planQty ?? 0);
    // 機材在庫データ
    const selectEqStockData: StockTableValues[][] = [];
    for (let i = 0; i < newIds.length; i++) {
      const stock: StockTableValues[] = await GetStockList(
        getValues('juchuHeadId'),
        getValues('juchuKizaiHeadId'),
        newIds[i],
        subDays(selectDate, 1)
      );
      selectEqStockData.push(stock);
    }
    setReturnJuchuKizaiMeisaiList((prev) => [...prev, ...newReturnJuchuKizaiMeisaiData]);
    setEqStockList((prev) => [...prev, ...selectEqStockData]);
    setOriginReturnPlanQty((prev) => [...prev, ...newPlanQtys]);
  };

  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = async () => {
    if (!saveKizaiHead) {
      setSaveOpen(true);
      return;
    }
    setEqSelectionDialogOpen(true);
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

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
      {/*返却受注明細ヘッダー*/}
      {/* <form onSubmit={handleSubmit(onSubmit)}> */}
      <Accordion
        sx={{
          mt: 2,
          '& .Mui-expanded': {
            mt: 2,
          },
        }}
        defaultExpanded
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div" sx={{ bgcolor: 'red', color: 'white' }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" py={1} width={'100%'}>
            <Typography>受注機材ヘッダー(返却)</Typography>
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
              <TextField
                value={`¥${priceTotal.toLocaleString()}`}
                type="text"
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                    color: 'red',
                  },
                  '.Mui-disabled': {
                    WebkitTextFillColor: 'red',
                  },
                }}
                disabled
              />
            </Grid2>
            <Grid2 container alignItems="center">
              <Typography>値引き</Typography>
              <Controller
                name="nebikiAmt"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={
                      isEditing
                        ? (field.value ?? '')
                        : field.value !== null && !isNaN(field.value)
                          ? `¥${Number(field.value).toLocaleString()}`
                          : '¥0'
                    }
                    type="text"
                    onFocus={(e) => {
                      setIsEditing(true);
                      const rawValue = e.target.value.replace(/[¥,]/g, '');
                      e.target.value = rawValue;
                    }}
                    onBlur={(e) => {
                      const rawValue = e.target.value.replace(/[¥,]/g, '');
                      const numericValue = Number(rawValue);
                      field.onChange(numericValue);
                      setIsEditing(false);
                    }}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      if (/^\d*$/.test(raw)) {
                        field.onChange(Number(raw));
                        e.target.value = raw;
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                      },
                    }}
                    disabled={!edit}
                  />
                )}
              />
            </Grid2>
          </Grid2>
          <Grid2 container p={2} spacing={2}>
            <Grid2 container spacing={2}>
              <Grid2 width={380} order={{ xl: 1 }}>
                <Typography>元伝票出庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={props.oyaJuchuKizaiNyushukoData.kicsShukoDat} onChange={() => {}} disabled />
                  <TestTime time={props.oyaJuchuKizaiNyushukoData.kicsShukoDat} onChange={() => {}} disabled />
                </Grid2>
                <Grid2>
                  <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={props.oyaJuchuKizaiNyushukoData.yardShukoDat} onChange={() => {}} disabled />
                  <TestTime time={props.oyaJuchuKizaiNyushukoData.yardShukoDat} onChange={() => {}} disabled />
                </Grid2>
              </Grid2>
              <Grid2 width={380} order={{ xl: 3 }}>
                <Typography>元伝票入庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={props.oyaJuchuKizaiNyushukoData.kicsNyukoDat} onChange={() => {}} disabled />
                  <TestTime time={props.oyaJuchuKizaiNyushukoData.kicsNyukoDat} onChange={() => {}} disabled />
                </Grid2>
                <Grid2>
                  <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={props.oyaJuchuKizaiNyushukoData.yardNyukoDat} onChange={() => {}} disabled />
                  <TestTime time={props.oyaJuchuKizaiNyushukoData.yardNyukoDat} onChange={() => {}} disabled />
                </Grid2>
              </Grid2>
              <Grid2 width={380} order={{ xl: 2 }}>
                <Typography>返却入庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="kicsNyukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
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
                        onChange={(newTime) => {
                          field.onChange(newTime?.toDate());
                          const yardNyukoDat = getValues('yardNyukoDat');
                          if (yardNyukoDat === null) {
                            clearErrors('yardNyukoDat');
                          }
                        }}
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
                        onChange={(newTime) => {
                          field.onChange(newTime?.toDate());
                          const kicsNyukoDat = getValues('kicsNyukoDat');
                          if (kicsNyukoDat === null) {
                            clearErrors('kicsNyukoDat');
                          }
                        }}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>
            </Grid2>
          </Grid2>
          <Grid2 container alignItems="center" p={2} spacing={2}>
            <Grid2 container alignItems="center">
              <Typography>メモ</Typography>
              <TextFieldElement name="mem" control={control} multiline rows={3} disabled={!edit}></TextFieldElement>
            </Grid2>
            <Grid2 container alignItems="center">
              <Typography>本番日数</Typography>
              <TextFieldElement
                name="juchuHonbanbiQty"
                control={control}
                type="number"
                sx={{
                  width: '5%',
                  minWidth: '60px',
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
                slotProps={{ input: { readOnly: true } }}
                disabled={!edit}
              ></TextFieldElement>
              <Typography>日</Typography>
            </Grid2>
          </Grid2>
          <Grid2 container alignItems="center" p={2} spacing={2}>
            <Typography>入出庫ステータス</Typography>
            <TextField disabled defaultValue={'準備中'}></TextField>
          </Grid2>
        </AccordionDetails>
      </Accordion>
      {/* </form> */}
      {/*返却受注明細(機材)*/}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" py={1} px={2}>
          <Grid2 container direction="column" spacing={1}>
            <Typography>受注明細(機材)</Typography>
            <Typography fontSize={'small'}>機材入力</Typography>
          </Grid2>
        </Box>
        <Divider />
        <Dialog open={EqSelectionDialogOpen} maxWidth="sm" fullWidth>
          <OyaEqSelectionDialog
            juchuHeadId={props.juchuHeadData.juchuHeadId}
            oyaJuchuKizaiHeadId={props.oyaJuchuKizaiNyushukoData.juchuKizaiHeadId}
            setEqpts={setEqpts}
            onClose={setEqSelectionDialogOpen}
          />
        </Dialog>

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
            <Box mx={2} my={1}>
              <Button onClick={() => handleOpenEqDialog()}>
                <AddIcon fontSize="small" />
                機材追加
              </Button>
            </Box>
            <Box
              display={Object.keys(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'}
            >
              <ReturnEqTable
                rows={returnJuchuKizaiMeisaiList}
                onChange={handleCellChange}
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
            <Box display="flex" my={1}>
              <Box display={'flex'} alignItems={'end'} mr={2}>
                <Typography fontSize={'small'}>在庫数</Typography>
              </Box>
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
            <ReturnStockTable
              eqStockList={eqStockList}
              dateRange={dateRange}
              stockTableHeaderDateRange={props.stockTableHeaderDateRange}
              ref={rightRef}
            />
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
    margin: 2,
    marginLeft: 2,
  },
  // ボタン
  button: {},
};
