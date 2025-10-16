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
  Checkbox,
  ClickAwayListener,
  Container,
  Dialog,
  Divider,
  Fab,
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
import { addMonths, endOfMonth, set, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { redirect } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringMonthDay, toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getRange } from '@/app/(main)/_lib/date-funcs';
import { addLock, delLock, getLock } from '@/app/(main)/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, DateTime, TestDate } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import {
  addAllHonbanbi,
  addJuchuKizaiNyushuko,
  delSiyouHonbanbi,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getStockList,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import {
  DetailOerValues,
  OyaJuchuKizaiMeisaiValues,
  OyaJuchuKizaiNyushukoValues,
} from '@/app/(main)/(eq-order-detail)/_lib/types';
import {
  DeleteAlertDialog,
  NyushukoAlertDialog,
  SaveAlertDialog,
} from '@/app/(main)/(eq-order-detail)/_ui/caveat-dialog';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import {
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import {
  addReturnJuchuContainerMeisai,
  addReturnJuchuKizaiHead,
  addReturnJuchuKizaiMeisai,
  addReturnNyushukoDen,
  delReturnJuchuContainerMeisai,
  delReturnJuchuKizaiMeisai,
  delReturnNyushukoDen,
  getReturnJuchuContainerMeisai,
  getReturnJuchuKizaiMeisai,
  saveNewReturnJuchuKizaiHead,
  saveReturnJuchuKizai,
  updReturnContainerNyushukoDen,
  updReturnJuchuContainerMeisai,
  updReturnJuchuKizaiHead,
  updReturnJuchuKizaiMeisai,
  updReturnNyushukoDen,
  updReturnNyushukoFix,
} from '../_lib/funcs';
import {
  ReturnJuchuContainerMeisaiValues,
  ReturnJuchuKizaiHeadSchema,
  ReturnJuchuKizaiHeadValues,
  ReturnJuchuKizaiMeisaiValues,
} from '../_lib/types';
import { ReturnContainerTable, ReturnEqTable, ReturnStockTable } from './equipment-return-order-detail-table';

export const EquipmentReturnOrderDetail = (props: {
  juchuHeadData: DetailOerValues;
  oyaJuchuKizaiNyushukoData: OyaJuchuKizaiNyushukoValues;
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues;
  returnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] | undefined;
  returnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] | undefined;
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
  // 機材明細ローディング
  const [isDetailLoading, setIsDetailLoading] = useState(false);
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
  // 返却受注コンテナ明細元データ
  const [originReturnJuchuContainerMeisaiList, setOriginReturnJuchuContainerMeisaiList] = useState<
    ReturnJuchuContainerMeisaiValues[]
  >(props.returnJuchuContainerMeisaiData ?? []);
  // 返却受注コンテナ明細データ
  const [returnJuchuContainerMeisaiList, setReturnJuchuContainerMeisaiList] = useState<
    ReturnJuchuContainerMeisaiValues[]
  >(props.returnJuchuContainerMeisaiData ?? []);
  // 機材在庫元データ
  const [originEqStockList, setOriginEqStockList] = useState<StockTableValues[][]>(props.eqStockData ?? []);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(props.eqStockData ?? []);
  // 返却受注機材明細元合計数
  const [originReturnPlanQty, setOriginReturnPlanQty] = useState<number[]>(
    props.returnJuchuKizaiMeisaiData ? props.returnJuchuKizaiMeisaiData.map((data) => data.planQty ?? 0) : []
  );
  // 削除機材
  const [deleteTarget, setDeleteTarget] = useState<{ kizaiId: number; containerFlag: boolean } | null>(null);

  // 親出庫日
  const [oyaShukoDate, setoyaShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setoyaNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
  // 返却入庫日
  const [returnNyukoDate, setReturnNyukoDate] = useState<Date | null>(props.returnNyukoDate);
  // 返却入庫日から親入庫日
  const [dateRange, setDateRange] = useState<string[]>(props.dateRange);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(props.returnNyukoDate ?? props.oyaShukoDate);

  // 未保存ダイアログ制御
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログ制御
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 入出庫日時ダイアログ制御
  const [nyushukoOpen, setNyushukoOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // 機材削除ダイアログ制御
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    setError,
    trigger,
    clearErrors,
    formState: { isDirty, errors, defaultValues },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      juchuHeadId: props.returnJuchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.returnJuchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.returnJuchuKizaiHeadData.juchuKizaiHeadKbn,
      juchuHonbanbiQty: props.returnJuchuKizaiHeadData.juchuHonbanbiQty,
      nebikiAmt: props.returnJuchuKizaiHeadData.nebikiAmt,
      mem: props.returnJuchuKizaiHeadData.mem,
      headNam: props.returnJuchuKizaiHeadData.headNam,
      oyaJuchuKizaiHeadId: props.returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
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
      const lockData = await getLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (props.edit && lockData === null) {
        await addLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await getLock(1, props.juchuHeadData.juchuHeadId);
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
    const filterJuchuContainerMeisaiList = returnJuchuContainerMeisaiList.filter((data) => !data.delFlag);
    if (
      saveKizaiHead &&
      JSON.stringify(originReturnJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originReturnJuchuContainerMeisaiList) === JSON.stringify(filterJuchuContainerMeisaiList)
    ) {
      setSave(true);
      setIsSave(true);
    } else {
      setSave(false);
      setIsSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnJuchuKizaiMeisaiList, returnJuchuContainerMeisaiList]);

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
  }, [returnJuchuKizaiMeisaiList, isLoading, isDetailLoading]);

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
    // 編集→閲覧
    if (edit) {
      const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
      const filterJuchuContainerMeisaiList = returnJuchuContainerMeisaiList.filter((data) => !data.delFlag);
      if (
        isDirty ||
        JSON.stringify(originReturnJuchuKizaiMeisaiList) !== JSON.stringify(filterJuchuKizaiMeisaiList) ||
        JSON.stringify(originReturnJuchuContainerMeisaiList) !== JSON.stringify(filterJuchuContainerMeisaiList)
      ) {
        setDirtyOpen(true);
        return;
      }

      await delLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      // 閲覧→編集
    } else {
      if (!user) return;
      const lockData = await getLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (lockData === null) {
        await addLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await getLock(1, props.juchuHeadData.juchuHeadId);
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
   * 保存ボタン押下時
   * @param data 受注機材ヘッダーデータ
   * @returns
   */
  const onSubmit = async (data: ReturnJuchuKizaiHeadValues) => {
    console.log('保存開始');
    if (!user) return;
    setIsLoading(true);
    setIsEditing(false);

    // ユーザー名
    const userNam = user.name;

    // 返却入庫日
    const updateNyukoDate = getNyukoDate(data.kicsNyukoDat, data.yardNyukoDat);
    console.log(updateNyukoDate, oyaNyukoDate);
    // 返却入庫日から親入庫日
    const updateDateRange = getRange(updateNyukoDate, oyaNyukoDate);
    console.log('返却入庫日から親入庫日', updateDateRange);

    if (!updateNyukoDate) {
      setIsLoading(false);
      return;
    }

    // 新規
    if (data.juchuKizaiHeadId === 0) {
      // 新規受注機材ヘッダー追加
      const newJuchuKizaiHeadId = await saveNewReturnJuchuKizaiHead(data, updateDateRange, userNam);

      if (newJuchuKizaiHeadId) {
        redirect(`/eq-return-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/${data.oyaJuchuKizaiHeadId}/edit`);
      } else {
        console.log('保存失敗');
      }

      // 更新
    } else {
      const kicsMeisai = returnJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 1);
      const yardMeisai = returnJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 2);
      const kicsContainer = returnJuchuContainerMeisaiList.filter((d) => d.planKicsKizaiQty);
      const yardContainer = returnJuchuContainerMeisaiList.filter((d) => d.planYardKizaiQty);

      if (
        ((kicsMeisai.length > 0 || kicsContainer.length > 0) && !data.kicsNyukoDat) ||
        ((yardMeisai.length > 0 || yardContainer.length > 0) && !data.yardNyukoDat)
      ) {
        if ((kicsMeisai.length > 0 || kicsContainer.length > 0) && !data.kicsNyukoDat) {
          setError('kicsNyukoDat', {
            type: 'manual',
            message: '',
          });
        }
        if ((yardMeisai.length > 0 || yardContainer.length > 0) && !data.yardNyukoDat) {
          setError('yardNyukoDat', {
            type: 'manual',
            message: '',
          });
        }
        setNyushukoOpen(true);
        setIsLoading(false);
        return;
      }

      // 更新判定
      const checkJuchuKizaiHead = isDirty;
      const checkJuchuKizaiMeisai =
        JSON.stringify(originReturnJuchuKizaiMeisaiList) !==
        JSON.stringify(returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag));
      const checkJuchuContainerMeisai =
        JSON.stringify(originReturnJuchuContainerMeisaiList) !==
        JSON.stringify(returnJuchuContainerMeisaiList.filter((data) => !data.delFlag));

      const updateResult = await saveReturnJuchuKizai(
        checkJuchuKizaiHead,
        checkJuchuKizaiMeisai,
        checkJuchuContainerMeisai,
        data,
        updateNyukoDate,
        updateDateRange,
        returnJuchuKizaiMeisaiList,
        returnJuchuContainerMeisaiList,
        userNam
      );

      // 画面情報更新
      if (updateResult) {
        if (checkJuchuKizaiHead && checkJuchuKizaiMeisai) {
          // 受注機材ヘッダー状態管理更新
          reset(data);
          // 返却入庫日更新
          setReturnNyukoDate(updateNyukoDate);
          // カレンダー選択日更新
          setSelectDate(updateNyukoDate);
          // 出庫日から入庫日更新
          setDateRange(updateDateRange);

          // 受注機材明細、機材在庫テーブル更新
          const juchuKizaiMeisaiData = await getReturnJuchuKizaiMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            props.oyaJuchuKizaiNyushukoData.juchuKizaiHeadId
          );
          if (juchuKizaiMeisaiData) {
            setReturnJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginReturnJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginReturnPlanQty(juchuKizaiMeisaiData.map((data) => data.planQty ?? 0));
            const updatedEqStockData = await updateEqStock(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              updateNyukoDate,
              juchuKizaiMeisaiData
            );
            setOriginEqStockList(updatedEqStockData);
          }
        } else if (checkJuchuKizaiHead) {
          // 受注機材ヘッダー状態管理更新
          reset(data);
          // 返却入庫日更新
          setReturnNyukoDate(updateNyukoDate);
          // カレンダー選択日更新
          setSelectDate(updateNyukoDate);
          // 出庫日から入庫日更新
          setDateRange(updateDateRange);

          // 機材在庫テーブル更新
          const updatedEqStockData = await updateEqStock(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            updateNyukoDate,
            returnJuchuKizaiMeisaiList
          );
          setOriginEqStockList(updatedEqStockData);
        } else if (checkJuchuKizaiMeisai) {
          // 受注機材明細、機材在庫テーブル更新
          const juchuKizaiMeisaiData = await getReturnJuchuKizaiMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            data.oyaJuchuKizaiHeadId
          );
          if (juchuKizaiMeisaiData) {
            setReturnJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginReturnJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginReturnPlanQty(juchuKizaiMeisaiData.map((data) => data.planQty ?? 0));
            const updatedEqStockData = await updateEqStock(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              updateNyukoDate,
              juchuKizaiMeisaiData
            );
            setOriginEqStockList(updatedEqStockData);
          }
        }
        if (checkJuchuContainerMeisai) {
          const returnJuchuContainerMeisaiData = await getReturnJuchuContainerMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            data.oyaJuchuKizaiHeadId
          );
          setOriginReturnJuchuContainerMeisaiList(returnJuchuContainerMeisaiData ?? []);
          setReturnJuchuContainerMeisaiList(returnJuchuContainerMeisaiData ?? []);
        }
        setSave(true);
        setIsSave(true);
      } else {
        console.log('保存失敗');
      }
      setIsLoading(false);
    }
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
        const stock: StockTableValues[] = await getStockList(
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
  const handleDateChange = async (date: Dayjs | null, view: string) => {
    if (!date) return;
    setSelectDate(date.toDate());

    if (view === 'day') {
      setIsDetailLoading(true);
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
      setIsDetailLoading(false);
      setAnchorEl(null);
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
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleReturnContainerMemoChange = (kizaiId: number, memo: string) => {
    setReturnJuchuContainerMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, mem: memo } : data))
    );
  };

  /**
   * コンテナテーブル使用数入力時
   * @param kizaiId 機材id
   * @param planKicsKizaiQty KICSコンテナ数
   * @param planYardKizaiQty YARDコンテナ数
   * @param planQty コンテナ合計数
   */
  const handleReturnContainerCellChange = (
    kizaiId: number,
    planKicsKizaiQty: number,
    planYardKizaiQty: number,
    planQty: number
  ) => {
    setReturnJuchuContainerMeisaiList((prev) =>
      prev.map((data) =>
        data.kizaiId === kizaiId && !data.delFlag
          ? { ...data, planKicsKizaiQty: planKicsKizaiQty, planYardKizaiQty: planYardKizaiQty, planQty: planQty }
          : data
      )
    );
  };

  /**
   * コンテナテーブル削除ボタン押下時
   * @param kizaiId 機材id
   */
  const handleReturnContainerDelete = (kizaiId: number) => {
    setReturnJuchuContainerMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, delFlag: true } : data))
    );
  };

  // 明細削除ボタン押下時
  const handleMeisaiDelete = (target: { kizaiId: number; containerFlag: boolean }) => {
    setDeleteOpen(true);
    setDeleteTarget(target);
  };

  // 明細削除ダイアログの押下ボタンによる処理
  const handleMeisaiDeleteResult = (result: boolean) => {
    if (!deleteTarget) return;

    if (result) {
      setDeleteOpen(false);
      if (deleteTarget.containerFlag) {
        setReturnJuchuContainerMeisaiList((prev) =>
          prev.map((data) =>
            data.kizaiId === deleteTarget.kizaiId && !data.delFlag ? { ...data, delFlag: true } : data
          )
        );
      } else {
        const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
        const rowIndex = filterJuchuKizaiMeisaiList.findIndex((data) => data.kizaiId === deleteTarget.kizaiId);
        const updatedJuchuKizaiMeisaiList = filterJuchuKizaiMeisaiList.filter(
          (data) => data.kizaiId !== deleteTarget.kizaiId
        );
        setReturnJuchuKizaiMeisaiList((prev) =>
          prev.map((data) =>
            data.kizaiId === deleteTarget.kizaiId && !data.delFlag ? { ...data, delFlag: true } : data
          )
        );
        setEqStockList((prev) => prev.filter((data) => !data.every((d) => d.kizaiId === deleteTarget.kizaiId)));
        setOriginReturnPlanQty((prev) => prev.filter((_, index) => index !== rowIndex));
        setPriceTotal(updatedJuchuKizaiMeisaiList.reduce((sum, row) => sum + (row.kizaiTankaAmt ?? 0), 0));
      }
      setDeleteTarget(null);
    } else {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
  };

  /**
   * KICS入庫日変更時
   * @param newDate KICS入庫日
   */
  const handleKicsNyukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsNyukoDat', newDate.toDate(), { shouldDirty: true });
  };

  /**
   * KICS入庫日確定時
   * @param newDate KICS入庫日
   */
  const handleKicsNyukoAccept = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    trigger(['kicsNyukoDat', 'yardNyukoDat']);

    const yardNyukoDat = getValues('yardNyukoDat');

    if (yardNyukoDat === null) {
      clearErrors('yardNyukoDat');
    }
  };

  /**
   * YARD入庫日変更時
   * @param newDate YARD入庫日
   */
  const handleYardNyukoChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('yardNyukoDat', newDate.toDate(), { shouldDirty: true });
  };

  /**
   * YARD入庫日確定時
   * @param newDate YARD入庫日
   */
  const handleYardNyukoAccept = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    trigger(['kicsNyukoDat', 'yardNyukoDat']);

    const kicsNyukoDat = getValues('kicsNyukoDat');

    if (kicsNyukoDat === null) {
      clearErrors('kicsNyukoDat');
    }
  };

  /**
   * 本番日数変更時
   * @param value 本番日数
   */
  const handleHonbanbiChange = (value: number | null) => {
    setValue('juchuHonbanbiQty', value, { shouldDirty: true });
    const updatedPriceTotal = returnJuchuKizaiMeisaiList
      .filter((data) => !data.delFlag)
      .reduce((sum, row) => sum + row.kizaiTankaAmt * (row.planKizaiQty ?? 0) * (value ?? 0), 0);
    setPriceTotal(updatedPriceTotal);
  };

  /**
   * 警告ダイアログの押下ボタンによる処理
   * @param result 結果
   */
  const handleResultDialog = async (result: boolean) => {
    if (result) {
      await delLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      reset();
      setSelectDate(oyaShukoDate ?? new Date());
      setReturnJuchuKizaiMeisaiList(originReturnJuchuKizaiMeisaiList);
      setReturnJuchuContainerMeisaiList(originReturnJuchuContainerMeisaiList);
      setOriginReturnPlanQty(originReturnJuchuKizaiMeisaiList.map((data) => data.planQty ?? 0));
      setEqStockList(originEqStockList);
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
    }
  };

  /**
   * 機材追加時
   * @param data 親受注機材明細データ
   */
  const setEqpts = async (eqData: OyaJuchuKizaiMeisaiValues[], containerData: JuchuContainerMeisaiValues[]) => {
    setIsDetailLoading(true);
    const eqIds = new Set(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterEqData = eqData.filter((d) => !eqIds.has(d.kizaiId));
    const newReturnJuchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[] = filterEqData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
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
      const stock: StockTableValues[] = await getStockList(
        getValues('juchuHeadId'),
        getValues('juchuKizaiHeadId'),
        newIds[i],
        subDays(selectDate, 1)
      );
      selectEqStockData.push(stock);
    }

    const containerIds = new Set(returnJuchuContainerMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterContainerData = containerData.filter((d) => !containerIds.has(d.kizaiId));
    const newReturnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] = filterContainerData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
      juchuKizaiMeisaiId: 0,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      oyaPlanKicsKizaiQty: d.planKicsKizaiQty ?? 0,
      oyaPlanYardKizaiQty: d.planYardKizaiQty ?? 0,
      planKicsKizaiQty: 0,
      planYardKizaiQty: 0,
      planQty: 0,
      delFlag: false,
      saveFlag: false,
    }));

    setReturnJuchuKizaiMeisaiList((prev) => [...prev, ...newReturnJuchuKizaiMeisaiData]);
    setEqStockList((prev) => [...prev, ...selectEqStockData]);
    setOriginReturnPlanQty((prev) => [...prev, ...newPlanQtys]);
    setReturnJuchuContainerMeisaiList((prev) => [...prev, ...newReturnJuchuContainerMeisaiData]);
    setIsDetailLoading(false);
  };

  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = async () => {
    if (!saveKizaiHead) {
      setSaveOpen(true);
      return;
    }
    setEqSelectionDialogOpen(true);
  };

  // ぺージトップへ戻る
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  return (
    <>
      {!user || isLoading ? (
        <Box height={'90vh'}>
          <Loading />
        </Box>
      ) : (
        <Box>
          <Box display={'flex'} justifyContent={'end'} mb={1}>
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
                    <TestDate date={props.juchuHeadData.juchuDat} onChange={() => {}} disabled />
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
                      value={`-¥${priceTotal.toLocaleString()}`}
                      type="text"
                      sx={{
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
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
                      render={({ field, fieldState }) => (
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
                            '.MuiOutlinedInput-notchedOutline': {
                              borderColor: fieldState.error?.message && 'red',
                            },
                            '.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: fieldState.error?.message && 'red',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: fieldState.error?.message && 'red',
                            },
                            '& .MuiInputBase-input': {
                              textAlign: 'right',
                            },
                            '.MuiFormHelperText-root': {
                              color: 'red',
                            },
                          }}
                          helperText={fieldState.error?.message}
                          disabled={!edit}
                        />
                      )}
                    />
                  </Grid2>
                </Grid2>
                <Grid2 container p={2} spacing={2}>
                  <Grid2 container spacing={2}>
                    <Grid2 width={300} order={{ xl: 1 }}>
                      <Typography>親伝票出庫日時</Typography>
                      <Grid2>
                        <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={props.oyaJuchuKizaiNyushukoData.kicsShukoDat}
                          onChange={() => {}}
                          disabled
                          onAccept={() => {}}
                        />
                      </Grid2>
                      <Grid2>
                        <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={props.oyaJuchuKizaiNyushukoData.yardShukoDat}
                          onChange={() => {}}
                          disabled
                          onAccept={() => {}}
                        />
                      </Grid2>
                    </Grid2>
                    <Grid2 width={300} order={{ xl: 3 }}>
                      <Typography>親伝票入庫日時</Typography>
                      <Grid2>
                        <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={props.oyaJuchuKizaiNyushukoData.kicsNyukoDat}
                          onChange={() => {}}
                          onAccept={() => {}}
                          disabled
                        />
                      </Grid2>
                      <Grid2>
                        <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={props.oyaJuchuKizaiNyushukoData.yardNyukoDat}
                          onChange={() => {}}
                          onAccept={() => {}}
                          disabled
                        />
                      </Grid2>
                    </Grid2>
                    <Grid2 width={300} order={{ xl: 2 }}>
                      <Typography>返却入庫日時</Typography>
                      <Grid2>
                        <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <Controller
                          name="kicsNyukoDat"
                          control={control}
                          render={({ field, fieldState }) => (
                            <DateTime
                              date={field.value}
                              onChange={handleKicsNyukoChange}
                              onAccept={handleKicsNyukoAccept}
                              fieldstate={fieldState}
                              disabled={!edit}
                              onClear={() => {
                                field.onChange(null);
                                trigger(['kicsNyukoDat', 'yardNyukoDat']);
                              }}
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
                            <DateTime
                              date={field.value}
                              onChange={handleYardNyukoChange}
                              onAccept={handleYardNyukoAccept}
                              fieldstate={fieldState}
                              disabled={!edit}
                              onClear={() => {
                                field.onChange(null);
                                trigger(['kicsNyukoDat', 'yardNyukoDat']);
                              }}
                            />
                          )}
                        />
                      </Grid2>
                    </Grid2>
                  </Grid2>
                </Grid2>
                <Box display={'flex'} p={2}>
                  <Grid2 container alignItems="center" spacing={1}>
                    <Typography>本番日数</Typography>
                    <TextFieldElement
                      name="juchuHonbanbiQty"
                      control={control}
                      type="number"
                      sx={{
                        minWidth: '60px',
                        maxWidth: '80px',
                        '& .MuiInputBase-input': {
                          textAlign: 'right',
                        },
                        '& input[type=number]::-webkit-inner-spin-button': {
                          WebkitAppearance: 'none',
                          margin: 0,
                        },
                      }}
                      onChange={(value) => handleHonbanbiChange(Number(value.target.value))}
                      //slotProps={{ input: { readOnly: true } }}
                      disabled={!edit}
                    ></TextFieldElement>
                    <Typography>日</Typography>
                  </Grid2>
                </Box>
                <Box display={'flex'} alignItems="center" p={2}>
                  <Typography mr={2}>メモ</Typography>
                  <TextFieldElement
                    name="mem"
                    control={control}
                    multiline
                    rows={3}
                    fullWidth
                    disabled={!edit}
                    // sx={{
                    //   '& .MuiInputBase-root': {
                    //     resize: 'both',
                    //     overflow: 'auto',
                    //     alignItems: 'flex-start',
                    //   },
                    //   '& .MuiInputBase-inputMultiline': {
                    //     textAlign: 'left',
                    //     paddingTop: '8px',
                    //   },
                    // }}
                  ></TextFieldElement>
                </Box>
              </AccordionDetails>
            </Accordion>
          </form>
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
            {isDetailLoading ? (
              <Loading />
            ) : (
              <>
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
                      <Button disabled={!edit} onClick={() => handleOpenEqDialog()}>
                        <AddIcon fontSize="small" />
                        機材追加
                      </Button>
                    </Box>
                    <Box
                      display={
                        Object.keys(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'
                      }
                    >
                      <ReturnEqTable
                        rows={returnJuchuKizaiMeisaiList}
                        edit={edit}
                        onChange={handleCellChange}
                        handleMeisaiDelete={handleMeisaiDelete}
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
                <Box
                  display={returnJuchuContainerMeisaiList.filter((d) => !d.delFlag).length > 0 ? 'block' : 'none'}
                  py={2}
                  width={'fit-content'}
                >
                  <ReturnContainerTable
                    rows={returnJuchuContainerMeisaiList}
                    edit={edit}
                    handleContainerMemoChange={handleReturnContainerMemoChange}
                    onChange={handleReturnContainerCellChange}
                    handleMeisaiDelete={handleMeisaiDelete}
                  />
                </Box>
              </>
            )}
          </Paper>
          <Fab color="primary" onClick={scrollTop} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
            <ArrowUpwardIcon fontSize="small" />
          </Fab>
          <SaveAlertDialog open={saveOpen} onClick={() => setSaveOpen(false)} />
          <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
          <NyushukoAlertDialog open={nyushukoOpen} onClick={() => setNyushukoOpen(false)} />
          <DeleteAlertDialog open={deleteOpen} onClick={handleMeisaiDeleteResult} />
        </Box>
      )}
    </>
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
