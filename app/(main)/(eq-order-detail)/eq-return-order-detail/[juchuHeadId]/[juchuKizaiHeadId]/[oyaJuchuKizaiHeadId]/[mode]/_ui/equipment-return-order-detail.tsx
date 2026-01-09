'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveAsIcon from '@mui/icons-material/SaveAs';
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
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, set, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanTimeString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { addLock, getLock } from '@/app/(main)/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { lockCheck, lockRelease } from '@/app/(main)/_lib/lock';
import { permission } from '@/app/(main)/_lib/permission';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, DateTime, TestDate } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
import {
  getDetailJuchuHead,
  getJuchuKizaiNyushuko,
  getNyushukoFixFlag,
  getStockList,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import {
  DetailOerValues,
  OyaJuchuContainerMeisaiValues,
  OyaJuchuKizaiMeisaiValues,
  OyaJuchuKizaiNyushukoValues,
} from '@/app/(main)/(eq-order-detail)/_lib/types';
import { AlertDialog, DeleteAlertDialog } from '@/app/(main)/(eq-order-detail)/_ui/caveat-dialog';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import {
  JuchuContainerMeisaiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';
import { getJuchuKizaiMeisaiList } from '@/app/(main)/quotation-list/_lib/funcs';

import {
  getJuchuHonbanbiQty,
  getReturnJuchuContainerMeisai,
  getReturnJuchuKizaiHead,
  getReturnJuchuKizaiMeisai,
  saveNewReturnJuchuKizaiHead,
  saveReturnJuchuKizai,
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
  oyaJuchuKizaiHeadData: OyaJuchuKizaiNyushukoValues;
  returnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues;
  oyaShukoDate: Date;
  oyaNyukoDate: Date;
  stockTableHeaderDateRange: string[];
  edit: boolean;
  nyukoFixFlag: boolean;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.returnJuchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;

  // 受注機材ヘッダー以外の編集フラグ
  const [otherDirty, setOtherDirty] = useState(false);

  // ローディング
  const [isLoading, setIsLoading] = useState(true);
  // 機材明細ローディング
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  // 処理中
  const [isProcessing, setIsProcessing] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // 遷移先path
  const [path, setPath] = useState<string | null>(null);

  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 入庫フラグ
  const [nyukoFixFlag, setNyukoFixFlag] = useState(props.nyukoFixFlag);
  // 受注ヘッダーデータ
  const [juchuHeadData, setJuchuHeadData] = useState(props.juchuHeadData);
  // 親受注機材ヘッダーデータ
  const [oyaJuchuKizaiHeadData, setOyaJuchuKizaiHeadData] = useState(props.oyaJuchuKizaiHeadData);
  // 返却受注機材明細元データ
  const [originReturnJuchuKizaiMeisaiList, setOriginReturnJuchuKizaiMeisaiList] = useState<
    ReturnJuchuKizaiMeisaiValues[]
  >(/*props.returnJuchuKizaiMeisaiData ??*/ []);
  // 返却受注機材明細リスト
  const [returnJuchuKizaiMeisaiList, setReturnJuchuKizaiMeisaiList] = useState<ReturnJuchuKizaiMeisaiValues[]>(
    /*props.returnJuchuKizaiMeisaiData ??*/ []
  );
  // 返却受注コンテナ明細元データ
  const [originReturnJuchuContainerMeisaiList, setOriginReturnJuchuContainerMeisaiList] = useState<
    ReturnJuchuContainerMeisaiValues[]
  >(/*props.returnJuchuContainerMeisaiData ??*/ []);
  // 返却受注コンテナ明細データ
  const [returnJuchuContainerMeisaiList, setReturnJuchuContainerMeisaiList] = useState<
    ReturnJuchuContainerMeisaiValues[]
  >(/*props.returnJuchuContainerMeisaiData ??*/ []);
  // 機材在庫元データ
  const [originEqStockList, setOriginEqStockList] = useState<StockTableValues[][]>(/*props.eqStockData ??*/ []);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(/*props.eqStockData ??*/ []);
  // 返却受注機材明細元合計数
  const originReturnPlanQty = originReturnJuchuKizaiMeisaiList.reduce((acc, current) => {
    const key = current.kizaiId;
    const total = acc.get(key);
    if (total) {
      const currentTotal = total + current.planQty;
      acc.set(key, currentTotal);
    } else {
      acc.set(key, current.planQty);
    }
    return acc;
  }, new Map<number, number>());
  // const [originReturnPlanQty, setOriginReturnPlanQty] = useState<Map<number, number>>(
  //   returnJuchuKizaiMeisaiList.reduce((acc, current) => {
  //     const key = current.kizaiId;
  //     const total = acc.get(key);
  //     if (total) {
  //       const currentTotal = total + current.planQty;
  //       acc.set(key, currentTotal);
  //     } else {
  //       acc.set(key, current.planQty);
  //     }
  //     return acc;
  //   }, new Map<number, number>())
  // );
  // 削除機材
  const [deleteEq, setDeleteEq] = useState<{ rowIndex: number; row: ReturnJuchuKizaiMeisaiValues } | null>(null);
  // 削除コンテナ
  const [deleteCtn, setDeleteCtn] = useState<ReturnJuchuContainerMeisaiValues | null>(null);

  // 親出庫日
  const [oyaShukoDate, setOyaShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setOyaNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
  // 返却入庫日
  const [returnNyukoDate, setReturnNyukoDate] = useState<Date | null>(/*props.returnNyukoDate*/ null);
  // 在庫テーブルヘッダー用日付範囲
  const [stockTableHeaderDateRange, setStockTableHeaderDateRange] = useState(props.stockTableHeaderDateRange);
  // 返却入庫日から親入庫日
  const [dateRange, setDateRange] = useState<string[]>(/*props.dateRange*/ []);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(/*props.returnNyukoDate ??*/ props.oyaShukoDate);

  // 警告ダイアログ制御
  const [alertOpen, setAlertOpen] = useState(false);
  // 警告ダイアログタイトル
  const [alertTitle, setAlertTitle] = useState('');
  // 警告ダイアログ用メッセージ
  const [alertMessage, setAlertMessage] = useState('');
  // 編集内容が未保存ダイアログ制御
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // 機材削除ダイアログ制御
  const [deleteEqOpen, setDeleteEqOpen] = useState(false);
  // コンテナ削除ダイアログ制御
  const [deleteCtnOpen, setDeleteCtnOpen] = useState(false);

  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // context
  const { setIsDirty /*setLock*/ } = useDirty();

  // ref
  const eqStockListRef = useRef(eqStockList);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    setError,
    trigger,
    clearErrors,
    formState: { isDirty, dirtyFields, defaultValues },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      juchuHeadId: props.returnJuchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.returnJuchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.returnJuchuKizaiHeadData.juchuKizaiHeadKbn,
      juchuHonbanbiQty: props.returnJuchuKizaiHeadData.juchuHonbanbiQty,
      //nebikiAmt: props.returnJuchuKizaiHeadData.nebikiAmt,
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

  // const juchuHonbanbiQty = useWatch({
  //   control,
  //   name: 'juchuHonbanbiQty',
  // });

  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty || otherDirty ? true : false);

  /**
   * useEffect
   */
  useEffect(() => {
    const getData = async () => {
      setIsDetailLoading(true);
      // 受注機材ヘッダーデータ
      const juchuKizaiHeadData = getValues();

      // 返却受注機材明細データ、返却受注コンテナ明細データ
      const [returnJuchuKizaiMeisaiData, returnJuchuContainerMeisaiData] = await Promise.all([
        getReturnJuchuKizaiMeisai(
          juchuKizaiHeadData.juchuHeadId,
          juchuKizaiHeadData.juchuKizaiHeadId,
          juchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
        getReturnJuchuContainerMeisai(
          juchuKizaiHeadData.juchuHeadId,
          juchuKizaiHeadData.juchuKizaiHeadId,
          juchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
      ]);

      // 返却入庫日
      const returnNyukoDate = getNyukoDate(
        juchuKizaiHeadData.kicsNyukoDat && new Date(juchuKizaiHeadData.kicsNyukoDat),
        juchuKizaiHeadData.yardNyukoDat && new Date(juchuKizaiHeadData.yardNyukoDat)
      );
      // 出庫日から入庫日
      const dateRange = getRange(returnNyukoDate, oyaNyukoDate);

      // 機材在庫データ
      const updatedEqStockData =
        returnJuchuKizaiMeisaiData.length > 0
          ? await updateEqStock(
              juchuKizaiHeadData?.juchuHeadId,
              juchuKizaiHeadData?.juchuKizaiHeadId,
              returnNyukoDate,
              returnJuchuKizaiMeisaiData
            )
          : [];

      setOriginReturnJuchuKizaiMeisaiList(returnJuchuKizaiMeisaiData);
      setReturnJuchuKizaiMeisaiList(returnJuchuKizaiMeisaiData);
      setOriginReturnJuchuContainerMeisaiList(returnJuchuContainerMeisaiData);
      setReturnJuchuContainerMeisaiList(returnJuchuContainerMeisaiData);
      setOriginEqStockList(updatedEqStockData);
      setEqStockList(updatedEqStockData);
      // setOriginReturnPlanQty(
      //   returnJuchuKizaiMeisaiData.reduce((acc, current) => {
      //     const key = current.kizaiId;
      //     const total = acc.get(key);
      //     if (total) {
      //       const currentTotal = total + current.planQty;
      //       acc.set(key, currentTotal);
      //     } else {
      //       acc.set(key, current.planQty);
      //     }
      //     return acc;
      //   }, new Map<number, number>())
      // );
      setReturnNyukoDate(returnNyukoDate);
      setDateRange(dateRange);
      setSelectDate(returnNyukoDate ?? props.oyaShukoDate);

      setIsDetailLoading(false);
    };
    if (saveKizaiHead && user && user.permission.juchu !== permission.none) {
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!user) return;
    const asyncProcess = async () => {
      const lockData = await lockCheck(1, juchuHeadData.juchuHeadId, user.name, user.email);
      setLockData(lockData);
      if (lockData) {
        setEdit(false);
      }
      setIsLoading(false);
    };

    if (user?.permission.juchu === permission.juchu_ref) setEdit(false);

    if (props.edit && user?.permission.juchu && !!(user?.permission.juchu & permission.juchu_upd)) {
      asyncProcess();
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const dirty = isDirty || otherDirty ? true : false;
    setIsDirty(dirty);
  }, [isDirty, otherDirty, setIsDirty]);

  useEffect(() => {
    const filterJuchuKizaiMeisaiList = returnJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const filterJuchuContainerMeisaiList = returnJuchuContainerMeisaiList.filter((data) => !data.delFlag);
    if (
      JSON.stringify(originReturnJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originReturnJuchuContainerMeisaiList) === JSON.stringify(filterJuchuContainerMeisaiList)
    ) {
      setOtherDirty(false);
    } else {
      setOtherDirty(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnJuchuKizaiMeisaiList, returnJuchuContainerMeisaiList]);

  useEffect(() => {
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

  // ロック制御
  const lock = async () => {
    if (!user) return;
    const lockData = await lockCheck(1, getValues('juchuHeadId'), user.name, user.email);
    setLockData(lockData);

    if (!lockData) return true;

    setEdit(false);

    setAlertOpen(false);
    setDirtyOpen(false);
    setEqSelectionDialogOpen(false);
    setDeleteEqOpen(false);
    setDeleteCtnOpen(false);

    setAlertTitle('編集中');
    setAlertMessage(`${lockData.addUser}が編集中です`);
    setAlertOpen(true);

    // 受注ヘッダーデータ、親受注機材入出庫データ、入庫フラグ
    const [juchuHeadData, oyaJuchuKizaiHeadData, nyukoFixFlag] = await Promise.all([
      getDetailJuchuHead(getValues('juchuHeadId')),
      getJuchuKizaiNyushuko(getValues('juchuHeadId'), getValues('oyaJuchuKizaiHeadId')),
      getNyushukoFixFlag(getValues('juchuHeadId'), getValues('juchuKizaiHeadId'), 70),
    ]);

    if (!juchuHeadData || !oyaJuchuKizaiHeadData) {
      return <div>受注情報が見つかりません。</div>;
    }
    // 親出庫日
    const oyaShukoDate = getShukoDate(oyaJuchuKizaiHeadData.kicsShukoDat, oyaJuchuKizaiHeadData.yardShukoDat);
    // 親入庫日
    const oyaNyukoDate = getNyukoDate(oyaJuchuKizaiHeadData.kicsNyukoDat, oyaJuchuKizaiHeadData.yardNyukoDat);

    if (!oyaShukoDate || !oyaNyukoDate) {
      return <div>受注情報が見つかりません。</div>;
    }

    // 在庫テーブルヘッダー用日付範囲
    const stockTableHeaderDateRange = getRange(oyaShukoDate, oyaNyukoDate);

    setJuchuHeadData(juchuHeadData);
    setOyaJuchuKizaiHeadData(oyaJuchuKizaiHeadData);
    setNyukoFixFlag(nyukoFixFlag);
    setOyaShukoDate(oyaShukoDate);
    setOyaNyukoDate(oyaNyukoDate);
    setStockTableHeaderDateRange(stockTableHeaderDateRange);

    if (getValues('juchuKizaiHeadId') === 0) {
      // 親本番日数
      const oyaJuchuHonbanbiQty = await getJuchuHonbanbiQty(getValues('juchuHeadId'), getValues('oyaJuchuKizaiHeadId'));
      // 返却受注機材ヘッダーデータ(初期値)
      const newReturnJuchuKizaiHeadData: ReturnJuchuKizaiHeadValues = {
        juchuHeadId: juchuHeadData.juchuHeadId,
        juchuKizaiHeadId: 0,
        juchuKizaiHeadKbn: 2,
        juchuHonbanbiQty: oyaJuchuHonbanbiQty ?? 0,
        //nebikiAmt: null,
        mem: null,
        headNam: juchuHeadData.koenNam,
        oyaJuchuKizaiHeadId: getValues('oyaJuchuKizaiHeadId'),
        kicsNyukoDat: null,
        yardNyukoDat: null,
      };
      reset(newReturnJuchuKizaiHeadData);
      setSelectDate(oyaShukoDate);
    } else {
      setIsDetailLoading(true);
      // 返却受注機材ヘッダーデータ
      const returnJuchuKizaiHeadData = await getReturnJuchuKizaiHead(
        getValues('juchuHeadId'),
        getValues('juchuKizaiHeadId')
      );

      if (!returnJuchuKizaiHeadData) {
        return <div>受注機材情報が見つかりません。</div>;
      }

      // 返却受注機材明細データ、返却受注コンテナ明細データ
      const [returnJuchuKizaiMeisaiData, returnJuchuContainerMeisaiData] = await Promise.all([
        getReturnJuchuKizaiMeisai(
          returnJuchuKizaiHeadData.juchuHeadId,
          returnJuchuKizaiHeadData.juchuKizaiHeadId,
          returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
        getReturnJuchuContainerMeisai(
          returnJuchuKizaiHeadData.juchuHeadId,
          returnJuchuKizaiHeadData.juchuKizaiHeadId,
          returnJuchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
      ]);

      // 返却入庫日
      const returnNyukoDate = getNyukoDate(
        returnJuchuKizaiHeadData.kicsNyukoDat && new Date(returnJuchuKizaiHeadData.kicsNyukoDat),
        returnJuchuKizaiHeadData.yardNyukoDat && new Date(returnJuchuKizaiHeadData.yardNyukoDat)
      );
      // 出庫日から入庫日
      const dateRange = getRange(returnNyukoDate, oyaNyukoDate);

      // 機材在庫データ
      const updatedEqStockData =
        returnJuchuKizaiMeisaiData.length > 0
          ? await updateEqStock(
              returnJuchuKizaiHeadData.juchuHeadId,
              returnJuchuKizaiHeadData.juchuKizaiHeadId,
              returnNyukoDate,
              returnJuchuKizaiMeisaiData
            )
          : [];

      reset(returnJuchuKizaiHeadData);
      setOriginReturnJuchuKizaiMeisaiList(returnJuchuKizaiMeisaiData ?? []);
      setReturnJuchuKizaiMeisaiList(returnJuchuKizaiMeisaiData ?? []);
      setOriginReturnJuchuContainerMeisaiList(returnJuchuContainerMeisaiData);
      setReturnJuchuContainerMeisaiList(returnJuchuContainerMeisaiData);
      setReturnNyukoDate(returnNyukoDate);
      setDateRange(dateRange);
      setSelectDate(returnNyukoDate ?? oyaShukoDate);
      setOriginEqStockList(updatedEqStockData);
      setEqStockList(updatedEqStockData);
      setIsDetailLoading(false);
    }

    return false;
  };

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
    if (!user) return;
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

      await lockRelease(1, juchuHeadData.juchuHeadId, user.name, user.email);
      setEdit(false);
      // 閲覧→編集
    } else {
      const lockResult = await lock();

      if (lockResult) {
        setEdit(true);
      }
    }
  };

  /**
   * 戻るボタン押下
   */
  const back = () => {
    const mode = edit ? 'edit' : 'view';
    const path = `/order/${juchuHeadData.juchuHeadId}/${mode}`;
    if (!isDirty && !otherDirty) {
      setIsLoading(true);
      router.push(path);
    } else {
      setPath(path);
      setDirtyOpen(true);
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
    if (!user || isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setIsLoading(true);

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
        setIsProcessing(false);
        return;
      }

      // 新規
      if (data.juchuKizaiHeadId === 0) {
        // 新規受注機材ヘッダー追加
        const newJuchuKizaiHeadId = await saveNewReturnJuchuKizaiHead(data, updateDateRange, userNam);

        if (newJuchuKizaiHeadId) {
          router.replace(
            `/eq-return-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/${data.oyaJuchuKizaiHeadId}/edit`
          );
        } else {
          console.log('保存失敗');
          setIsLoading(false);
        }

        // 更新
      } else {
        const kicsMeisai = returnJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 1 && !d.delFlag);
        const yardMeisai = returnJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 2 && !d.delFlag);
        const kicsContainer = returnJuchuContainerMeisaiList.filter((d) => d.planKicsKizaiQty && !d.delFlag);
        const yardContainer = returnJuchuContainerMeisaiList.filter((d) => d.planYardKizaiQty && !d.delFlag);

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
          setAlertTitle('入出庫日時が入力されていません');
          setAlertMessage('入出庫日時を入力してください');
          setAlertOpen(true);
          setIsLoading(false);
          setIsProcessing(false);
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
        const checkKicsDat = dirtyFields.kicsNyukoDat ? true : false;
        const checkYardDat = dirtyFields.yardNyukoDat ? true : false;

        const updateResult = await saveReturnJuchuKizai(
          checkJuchuKizaiHead,
          checkJuchuKizaiMeisai,
          checkJuchuContainerMeisai,
          checkKicsDat,
          checkYardDat,
          defaultValues?.kicsNyukoDat,
          defaultValues?.yardNyukoDat,
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
              oyaJuchuKizaiHeadData.juchuKizaiHeadId
            );
            if (juchuKizaiMeisaiData) {
              setReturnJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
              setOriginReturnJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
              // setOriginReturnPlanQty(
              //   juchuKizaiMeisaiData.reduce((acc, current) => {
              //     const key = current.kizaiId;
              //     const total = acc.get(key);
              //     if (total) {
              //       const currentTotal = total + current.planQty;
              //       acc.set(key, currentTotal);
              //     } else {
              //       acc.set(key, current.planQty);
              //     }
              //     return acc;
              //   }, new Map<number, number>())
              // );
              const updatedEqStockData = await updateEqStock(
                data.juchuHeadId,
                data.juchuKizaiHeadId,
                updateNyukoDate,
                juchuKizaiMeisaiData
              );
              setOriginEqStockList(updatedEqStockData);
              setEqStockList(updatedEqStockData);
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
            setEqStockList(updatedEqStockData);
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
              // setOriginReturnPlanQty(
              //   juchuKizaiMeisaiData.reduce((acc, current) => {
              //     const key = current.kizaiId;
              //     const total = acc.get(key);
              //     if (total) {
              //       const currentTotal = total + current.planQty;
              //       acc.set(key, currentTotal);
              //     } else {
              //       acc.set(key, current.planQty);
              //     }
              //     return acc;
              //   }, new Map<number, number>())
              // );
              const updatedEqStockData = await updateEqStock(
                data.juchuHeadId,
                data.juchuKizaiHeadId,
                updateNyukoDate,
                juchuKizaiMeisaiData
              );
              setOriginEqStockList(updatedEqStockData);
              setEqStockList(updatedEqStockData);
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
          setOtherDirty(false);

          setSnackBarMessage('保存しました');
          setSnackBarOpen(true);
        } else {
          setSnackBarMessage('保存に失敗しました');
          setSnackBarOpen(true);
        }
        setIsLoading(false);
      }
    }
    setIsProcessing(false);
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
    nyukoDate: Date | null,
    juchuKizaiMeisaiData: ReturnJuchuKizaiMeisaiValues[]
  ) => {
    // 受注機材idリスト
    const ids = juchuKizaiMeisaiData.filter((d) => !d.delFlag).map((data) => data.kizaiId);
    // 機材在庫データ
    const updatedEqStockData: StockTableValues[][] = [];
    // id確認用セット
    const checkIds = new Set<number>();
    if (ids && nyukoDate) {
      for (const id of ids) {
        if (checkIds.has(id)) {
          const stock = updatedEqStockData.find((d) => d[0].kizaiId === id);
          updatedEqStockData.push(stock!);
        } else {
          checkIds.add(id);
          const stock: StockTableValues[] = await getStockList(
            juchuHeadId,
            juchuKizaiHeadId,
            id,
            subDays(nyukoDate, 1)
          );
          updatedEqStockData.push(stock);
        }
      }
    }
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
        const sum = filterJuchuKizaiMeisaiList
          .filter((d) => !d.delFlag)
          .reduce((acc, current) => {
            const key = current.kizaiId;
            const total = acc.get(key);
            if (total) {
              const currentTotal = total + current.planQty;
              acc.set(key, currentTotal);
            } else {
              acc.set(key, current.planQty);
            }

            return acc;
          }, new Map<number, number>());

        const targetIndex = updatedEqStockData[0]
          .map((d, index) => (dateRange.includes(toJapanYMDString(d.calDat)) ? index : -1))
          .filter((index) => index !== -1);

        const subUpdatedEqStockData = updatedEqStockData.map((data, index) =>
          data.map((d, i) =>
            targetIndex.includes(i)
              ? {
                  ...d,
                  zaikoQty: Number(d.zaikoQty) - (originReturnPlanQty.get(d.kizaiId) ?? 0) + sum.get(d.kizaiId)!,
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
   * @param rowIndex 行数
   * @param memo メモ内容
   */
  const handleMemoChange = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setReturnJuchuKizaiMeisaiList((prev) => {
        const visibleIndex = prev
          .map((data, index) => (!data.delFlag ? index : null))
          .filter((index) => index !== null) as number[];

        const index = visibleIndex[rowIndex];
        if (index === undefined) return prev;

        return prev.map((data, i) => (i === index ? { ...data, mem: memo } : data));
      });
    }
    setIsProcessing(false);
  };

  /**
   * 機材テーブルの受注数、予備数入力時
   * @param rowIndex 行数
   * @param kizaiId 機材id
   * @param planQty 合計
   */
  const handleCellChange = (rowIndex: number, kizaiId: number, planQty: number) => {
    const updatedEqStockData = eqStockListRef.current[rowIndex];
    const targetIndex = updatedEqStockData
      .map((d, index) => (dateRange.includes(toJapanYMDString(d.calDat)) ? index : -1))
      .filter((index) => index !== -1);

    const originPlanQty = returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag)[rowIndex].planQty;
    setEqStockList((prev) =>
      prev.map((data) =>
        data[0].kizaiId === kizaiId
          ? data.map((d, i) =>
              targetIndex.includes(i) ? { ...d, zaikoQty: Number(d.zaikoQty) - originPlanQty + planQty } : d
            )
          : data
      )
    );

    setReturnJuchuKizaiMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) => (i === index ? { ...data, planQty: planQty } : data));
    });
  };

  // 機材明細削除ボタン押下時
  const handleEqMeisaiDelete = async (rowIndex: number, row: ReturnJuchuKizaiMeisaiValues) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setDeleteEqOpen(true);
      setDeleteEq({ rowIndex: rowIndex, row: row });
    }
    setIsProcessing(false);
  };

  // 明細削除ダイアログの押下ボタンによる処理
  const handleEqMeisaiDeleteResult = async (result: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!deleteEq) {
      setDeleteEqOpen(false);
      setIsProcessing(false);
      return;
    }

    const lockResult = await lock();

    if (lockResult) {
      if (result) {
        setReturnJuchuKizaiMeisaiList((prev) => {
          const visibleIndex = prev
            .map((data, index) => (!data.delFlag ? index : null))
            .filter((index) => index !== null) as number[];

          const index = visibleIndex[deleteEq.rowIndex];
          if (index === undefined) return prev;

          return prev.map((data, i) => (i === index ? { ...data, delFlag: true } : data));
        });

        const updatedEqStockData = eqStockListRef.current[deleteEq.rowIndex];
        const targetIndex = updatedEqStockData
          .map((d, index) => (dateRange.includes(toJapanYMDString(d.calDat)) ? index : -1))
          .filter((index) => index !== -1);
        setEqStockList((prev) =>
          prev
            .filter((_, index) => index !== deleteEq.rowIndex)
            .map((data) =>
              data[0].kizaiId === deleteEq.row.kizaiId
                ? data.map((d, i) =>
                    targetIndex.includes(i) ? { ...d, zaikoQty: d.zaikoQty - deleteEq.row.planQty } : d
                  )
                : data
            )
        );
        setDeleteEqOpen(false);
        setDeleteEq(null);
      } else {
        setDeleteEqOpen(false);
        setDeleteEq(null);
      }
    }
    setIsProcessing(false);
  };

  /**
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleReturnContainerMemoChange = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setReturnJuchuContainerMeisaiList((prev) => {
        const visibleIndex = prev
          .map((data, index) => (!data.delFlag ? index : null))
          .filter((index) => index !== null) as number[];

        const index = visibleIndex[rowIndex];
        if (index === undefined) return prev;

        return prev.map((data, i) => (i === index ? { ...data, mem: memo } : data));
      });
    }
    setIsProcessing(false);
  };

  /**
   * コンテナテーブル使用数入力時
   * @param kizaiId 機材id
   * @param planKicsKizaiQty KICSコンテナ数
   * @param planYardKizaiQty YARDコンテナ数
   * @param planQty コンテナ合計数
   */
  const handleReturnContainerCellChange = (rowIndex: number, planKicsKizaiQty: number, planYardKizaiQty: number) => {
    setReturnJuchuContainerMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) =>
        i === index
          ? {
              ...data,
              planKicsKizaiQty: planKicsKizaiQty,
              planYardKizaiQty: planYardKizaiQty,
              planQty: planKicsKizaiQty + planYardKizaiQty,
            }
          : data
      );
    });
  };

  // コンテナ明細削除ボタン押下時
  const handleCtnMeisaiDelete = async (row: ReturnJuchuContainerMeisaiValues) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setDeleteCtnOpen(true);
      setDeleteCtn(row);
    }
    setIsProcessing(false);
  };

  // コンテナ明細削除ダイアログの押下ボタンによる処理
  const handleCtnMeisaiDeleteResult = async (result: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!deleteCtn) {
      setDeleteCtnOpen(false);
      setIsProcessing(false);
      return;
    }

    const lockResult = await lock();

    if (lockResult) {
      if (result) {
        setReturnJuchuContainerMeisaiList((prev) =>
          prev.map((data) => (data.kizaiId === deleteCtn.kizaiId && !data.delFlag ? { ...data, delFlag: true } : data))
        );
        setDeleteCtnOpen(false);
        setDeleteCtn(null);
      } else {
        setDeleteCtnOpen(false);
        setDeleteCtn(null);
      }
    }
    setIsProcessing(false);
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
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      if (newDate === null) return;
      trigger(['kicsNyukoDat', 'yardNyukoDat']);

      const yardNyukoDat = getValues('yardNyukoDat');

      if (yardNyukoDat === null) {
        clearErrors('yardNyukoDat');
      }
    }
    setIsProcessing(false);
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
  const handleYardNyukoAccept = async (newDate: Dayjs | null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      if (newDate === null) return;
      trigger(['kicsNyukoDat', 'yardNyukoDat']);

      const kicsNyukoDat = getValues('kicsNyukoDat');

      if (kicsNyukoDat === null) {
        clearErrors('kicsNyukoDat');
      }
    }
    setIsProcessing(false);
  };

  // /**
  //  * 本番日数変更時
  //  * @param value 本番日数
  //  */
  // const handleHonbanbiChange = (value: number | null) => {
  //   setValue('juchuHonbanbiQty', value, { shouldDirty: true });
  //   const updatedPriceTotal = returnJuchuKizaiMeisaiList
  //     .filter((data) => !data.delFlag)
  //     .reduce((sum, row) => sum + row.kizaiTankaAmt * (row.planKizaiQty ?? 0) * (value ?? 0), 0);
  //   setPriceTotal(updatedPriceTotal);
  // };

  /**
   * 警告ダイアログの押下ボタンによる処理
   * @param result 結果
   */
  const handleResultDialog = async (result: boolean) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    if (result && path) {
      setIsLoading(true);
      router.push(path);
      setPath(null);
    } else if (result && !path) {
      await lockRelease(1, juchuHeadData.juchuHeadId, user.name, user.email);
      setEdit(false);
      reset();
      setSelectDate(oyaShukoDate ?? new Date());
      setReturnJuchuKizaiMeisaiList(originReturnJuchuKizaiMeisaiList);
      setReturnJuchuContainerMeisaiList(originReturnJuchuContainerMeisaiList);
      // setOriginReturnPlanQty(
      //   originReturnJuchuKizaiMeisaiList.reduce((acc, current) => {
      //     const key = current.kizaiId;
      //     const total = acc.get(key);
      //     if (total) {
      //       const currentTotal = total + current.planQty;
      //       acc.set(key, currentTotal);
      //     } else {
      //       acc.set(key, current.planQty);
      //     }
      //     return acc;
      //   }, new Map<number, number>())
      // );
      setEqStockList(originEqStockList);
      setDirtyOpen(false);
      setIsLoading(false);
    } else {
      setDirtyOpen(false);
      setPath(null);
    }
    setIsProcessing(false);
  };

  /**
   * 機材追加時
   * @param data 親受注機材明細データ
   */
  const setEqpts = async (eqData: OyaJuchuKizaiMeisaiValues[], containerData: OyaJuchuContainerMeisaiValues[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setIsDetailLoading(true);
      // 同じ並び順のものははじくようにする
      const eqIds = new Set(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
      const dspOrdNums = new Set(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.dspOrdNum));
      const filterEqData = eqData.filter((d) => !dspOrdNums.has(d.dspOrdNum));
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
        oyaPlanKizaiQty: d.planKizaiQty,
        oyaPlanYobiQty: d.planYobiQty,
        planQty: 0,
        dspOrdNum: d.dspOrdNum,
        indentNum: d.indentNum,
        delFlag: false,
        saveFlag: false,
      }));

      const newIds = newReturnJuchuKizaiMeisaiData.map((data) => data.kizaiId);
      // 機材在庫データ
      const selectEqStockData: StockTableValues[][] = [];
      for (const id of newIds) {
        if (eqIds.has(id)) {
          const stock = eqStockListRef.current.find((d) => d[0].kizaiId === id);
          selectEqStockData.push(stock!);
        } else {
          const stock: StockTableValues[] = await getStockList(
            getValues('juchuHeadId'),
            getValues('juchuKizaiHeadId'),
            id,
            subDays(selectDate, 1)
          );
          if (originReturnPlanQty.get(id)) {
            const updateStock = stock.map((d) =>
              dateRange.includes(toJapanYMDString(d.calDat))
                ? { ...d, zaikoQty: d.zaikoQty - originReturnPlanQty.get(id)! }
                : d
            );
            selectEqStockData.push(updateStock);
          } else {
            selectEqStockData.push(stock);
          }
        }
      }
      // ソート後の機材id
      const sortKizaiId = [...returnJuchuKizaiMeisaiList, ...newReturnJuchuKizaiMeisaiData]
        .sort((a, b) => a.dspOrdNum - b.dspOrdNum)
        .map((d) => d.kizaiId);

      const containerIds = new Set(returnJuchuContainerMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
      const filterContainerData = containerData.filter((d) => !containerIds.has(d.kizaiId));
      const newReturnJuchuContainerMeisaiData: ReturnJuchuContainerMeisaiValues[] = filterContainerData.map((d) => ({
        juchuHeadId: getValues('juchuHeadId'),
        juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
        juchuKizaiMeisaiId: 0,
        mem: '',
        kizaiId: d.kizaiId,
        kizaiNam: d.kizaiNam,
        oyaPlanKicsKizaiQty: d.planKicsKizaiQty,
        oyaPlanYardKizaiQty: d.planYardKizaiQty,
        planKicsKizaiQty: 0,
        planYardKizaiQty: 0,
        planQty: 0,
        dspOrdNum: d.dspOrdNum,
        indentNum: d.indentNum,
        delFlag: false,
        saveFlag: false,
      }));

      setReturnJuchuKizaiMeisaiList((prev) =>
        [...prev, ...newReturnJuchuKizaiMeisaiData].sort((a, b) => a.dspOrdNum - b.dspOrdNum)
      );
      setEqStockList((prev) => {
        const updateStockData = [...prev, ...selectEqStockData];
        const sortStockData = sortKizaiId.map((id) => updateStockData.find((data) => data[0].kizaiId === id)!);
        return sortStockData;
      });
      setReturnJuchuContainerMeisaiList((prev) =>
        [...prev, ...newReturnJuchuContainerMeisaiData].sort((a, b) => a.dspOrdNum - b.dspOrdNum)
      );
      setIsDetailLoading(false);
    }
    setIsProcessing(false);
  };

  // 機材入力ダイアログ開
  const handleOpenEqDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setEqSelectionDialogOpen(true);
    }
    setIsProcessing(false);
  };

  // 機材入力ダイアログ閉
  const handleCloseEqDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setEqSelectionDialogOpen(false);
    }
    setIsProcessing(false);
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  return (
    <>
      {isLoading ? (
        <LoadingOverlay />
      ) : (
        <PermissionGuard
          category={'juchu'}
          required={getValues('juchuKizaiHeadId') === 0 ? permission.juchu_upd : permission.juchu_ref}
        >
          <Container disableGutters sx={{ minWidth: '100%', pb: 10 }} maxWidth={'xl'}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box display={'flex'} justifyContent={'end'} mb={1}>
                <Grid2 container spacing={4}>
                  {lockData && (
                    <Grid2 container alignItems={'center'} spacing={2}>
                      <Typography>{lockData.addDat && toJapanTimeString(new Date(lockData.addDat))}</Typography>
                      <Typography>{lockData.addUser}</Typography>
                      <Typography>編集中</Typography>
                    </Grid2>
                  )}
                  {nyukoFixFlag && (
                    <Box display={'flex'} alignItems={'center'}>
                      <Typography>到着済</Typography>
                    </Box>
                  )}
                  <Grid2 container display={saveKizaiHead ? 'flex' : 'none'} alignItems={'center'} spacing={1}>
                    {!edit ? <Typography>閲覧モード</Typography> : <Typography>編集モード</Typography>}
                    <Button
                      disabled={!!lockData || user?.permission.juchu === permission.juchu_ref}
                      onClick={handleEdit}
                    >
                      変更
                    </Button>
                  </Grid2>
                  <Button onClick={back}>
                    <Box display={'flex'} alignItems={'center'}>
                      <ArrowLeftIcon fontSize="small" />
                      受注
                    </Box>
                  </Button>
                </Grid2>
              </Box>
              {/*受注ヘッダー*/}
              <Accordion
                expanded={expanded}
                onChange={handleExpansion}
                sx={{
                  marginTop: 2,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
                variant="outlined"
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  component="div"
                  sx={{
                    minHeight: '30px',
                    maxHeight: '30px',
                    '&.Mui-expanded': {
                      minHeight: '30px',
                      maxHeight: '30px',
                    },
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" width="100%">
                    <Grid2 container display="flex" justifyContent="space-between" spacing={2}>
                      <Typography>受注ヘッダー</Typography>
                      <Grid2 container display={expanded ? 'none' : 'flex'} spacing={2}>
                        <Typography>公演名</Typography>
                        <Typography>{juchuHeadData.koenNam}</Typography>
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
                            <TextField value={juchuHeadData.juchuHeadId} disabled></TextField>
                          </Grid2>
                          <Grid2 display="flex" direction="row" alignItems="center">
                            <Typography mr={2}>受注ステータス</Typography>
                            <FormControl size="small" sx={{ width: 120 }}>
                              <Select value={juchuHeadData.juchuSts} disabled>
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
                        <TestDate date={juchuHeadData.juchuDat} onChange={() => {}} disabled />
                      </Box>
                      <Box sx={styles.container}>
                        <Typography marginRight={5} whiteSpace="nowrap">
                          入力者
                        </Typography>
                        <TextField value={juchuHeadData.nyuryokuUser} disabled></TextField>
                      </Box>
                    </Grid2>
                    <Grid2>
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                        <Typography marginRight={5} whiteSpace="nowrap">
                          公演名
                        </Typography>
                        <TextField value={juchuHeadData.koenNam} disabled></TextField>
                      </Box>
                      <Box sx={styles.container}>
                        <Typography marginRight={3} whiteSpace="nowrap">
                          公演場所
                        </Typography>
                        <TextField
                          value={juchuHeadData.koenbashoNam ? juchuHeadData.koenbashoNam : ''}
                          disabled
                        ></TextField>
                      </Box>
                      <Box sx={styles.container}>
                        <Typography marginRight={7} whiteSpace="nowrap">
                          相手
                        </Typography>
                        <TextField value={juchuHeadData.kokyaku.kokyakuNam} disabled></TextField>
                      </Box>
                    </Grid2>
                  </Grid2>
                </AccordionDetails>
              </Accordion>
              {/*返却受注明細ヘッダー*/}

              <Accordion
                sx={{
                  marginTop: 2,
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
                variant="outlined"
                defaultExpanded={!saveKizaiHead}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  component="div"
                  sx={{
                    minHeight: '30px',
                    maxHeight: '30px',
                    '&.Mui-expanded': {
                      minHeight: '30px',
                      maxHeight: '30px',
                    },
                    bgcolor: 'red',
                    color: 'white',
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between" width={'100%'}>
                    <Typography>受注機材ヘッダー(返却)</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  <Divider />
                  <Grid2 container alignItems="center" spacing={2} p={2}>
                    <Grid2 container alignItems="baseline">
                      <Typography>受注明細名</Typography>
                      <TextFieldElement name="headNam" control={control} disabled={!edit}></TextFieldElement>
                    </Grid2>
                    {/* <Grid2 container alignItems="center">
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
                  </Grid2> */}
                  </Grid2>
                  <Grid2 container p={2} spacing={2}>
                    <Grid2 container spacing={2}>
                      <Grid2 width={300} order={{ xl: 1 }}>
                        <Typography>親伝票出庫日時</Typography>
                        <Grid2>
                          <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                          <DateTime
                            date={oyaJuchuKizaiHeadData.kicsShukoDat}
                            onChange={() => {}}
                            disabled
                            onAccept={() => {}}
                          />
                        </Grid2>
                        <Grid2>
                          <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                          <DateTime
                            date={oyaJuchuKizaiHeadData.yardShukoDat}
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
                            date={oyaJuchuKizaiHeadData.kicsNyukoDat}
                            onChange={() => {}}
                            onAccept={() => {}}
                            disabled
                          />
                        </Grid2>
                        <Grid2>
                          <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                          <DateTime
                            date={oyaJuchuKizaiHeadData.yardNyukoDat}
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
                                minDate={oyaJuchuKizaiHeadData.kicsShukoDat ?? undefined}
                                maxDate={oyaJuchuKizaiHeadData.kicsNyukoDat ?? undefined}
                                onChange={handleKicsNyukoChange}
                                onAccept={handleKicsNyukoAccept}
                                fieldstate={fieldState}
                                disabled={!edit || nyukoFixFlag}
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
                                minDate={oyaJuchuKizaiHeadData.yardShukoDat ?? undefined}
                                maxDate={oyaJuchuKizaiHeadData.yardNyukoDat ?? undefined}
                                onChange={handleYardNyukoChange}
                                onAccept={handleYardNyukoAccept}
                                fieldstate={fieldState}
                                disabled={!edit || nyukoFixFlag}
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
                  {/* <Box display={'flex'} p={2}>
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
                      //onChange={(value) => handleHonbanbiChange(Number(value.target.value))}
                      //slotProps={{ input: { readOnly: true } }}
                      disabled={!edit}
                    ></TextFieldElement>
                    <Typography>日</Typography>
                  </Grid2>
                </Box> */}
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
              {/** 固定ボタン 保存＆ページトップ */}
              <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
                <Fab
                  variant="extended"
                  color="primary"
                  type="submit"
                  sx={{ mr: 2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled={!edit || isLoading || isDetailLoading}
                >
                  <SaveAsIcon sx={{ mr: 1 }} />
                  保存
                </Fab>
                <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <ArrowUpwardIcon />
                </Fab>
              </Box>
            </form>
            {/*返却受注明細(機材)*/}
            {saveKizaiHead && (
              <Paper variant="outlined" sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" px={2} height={'30px'}>
                  <Typography>受注明細(機材)</Typography>
                </Box>
                <Divider />
                <Dialog open={EqSelectionDialogOpen} maxWidth="sm" fullWidth>
                  <OyaEqSelectionDialog
                    juchuHeadId={juchuHeadData.juchuHeadId}
                    oyaJuchuKizaiHeadId={oyaJuchuKizaiHeadData.juchuKizaiHeadId}
                    setEqpts={setEqpts}
                    onClose={handleCloseEqDialog}
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
                          <Button disabled={!edit} onClick={handleOpenEqDialog}>
                            <AddIcon fontSize="small" />
                            機材追加
                          </Button>
                        </Box>
                        <Box
                          display={
                            Object.keys(returnJuchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0
                              ? 'block'
                              : 'none'
                          }
                        >
                          <ReturnEqTable
                            rows={returnJuchuKizaiMeisaiList}
                            edit={edit}
                            handleCellChange={handleCellChange}
                            handleMeisaiDelete={handleEqMeisaiDelete}
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
                          stockTableHeaderDateRange={stockTableHeaderDateRange}
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
                        handleContainerCellChange={handleReturnContainerCellChange}
                        handleMeisaiDelete={handleCtnMeisaiDelete}
                      />
                    </Box>
                  </>
                )}
              </Paper>
            )}
          </Container>
        </PermissionGuard>
      )}
      <AlertDialog open={alertOpen} title={alertTitle} message={alertMessage} onClick={() => setAlertOpen(false)} />
      <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
      <DeleteAlertDialog open={deleteEqOpen} onClick={handleEqMeisaiDeleteResult} />
      <DeleteAlertDialog open={deleteCtnOpen} onClick={handleCtnMeisaiDeleteResult} />
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
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
