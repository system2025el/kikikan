'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  ClickAwayListener,
  Container,
  Dialog,
  Divider,
  Fab,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, set, setDate, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { redirect, useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
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
  getALLStockList,
  getDetailJuchuHead,
  getDic,
  getJuchuContainerMeisai,
  getNyushukoFixFlag,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { DetailOerValues } from '@/app/(main)/(eq-order-detail)/_lib/types';

import { AlertDialog, DeleteAlertDialog, MoveAlertDialog } from '../../../../../_ui/caveat-dialog';
import {
  getHonbanbi,
  getIdoJuchuKizaiMeisai,
  getJuchuKizaiHead,
  getJuchuKizaiMeisai,
  juchuMeisaiCopy,
  juchuMeisaiseparation,
  saveJuchuKizai,
  saveNewJuchuKizaiHead,
} from '../_lib/funcs';
import {
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadSchema,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  SelectedEqptsValues,
  StockTableValues,
} from '../_lib/types';
import { CopyDialog } from './copy-dialog';
import { DateSelectDialog } from './date-selection-dialog';
import { ContainerTable, EqTable, IdoEqTable, StockTable } from './equipment-order-detail-table';
import { EqptSelectionDialog } from './equipment-selection-dailog';
import { SeparationDialog } from './separation-dialog';
import { SortDialog } from './sort-dialog';

const EquipmentOrderDetail = (props: {
  juchuHeadData: DetailOerValues;
  juchuKizaiHeadData: JuchuKizaiHeadValues;
  juchuHonbanbiData: JuchuKizaiHonbanbiValues[] | undefined;
  edit: boolean;
  fixFlag: boolean;
}) => {
  const router = useRouter();
  /** ダイアログ上部に戻るためのref */
  const scrollRef = useRef<HTMLDivElement>(null);
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.juchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;

  // 受注機材ヘッダー以外の編集フラグ
  const [otherDirty, setOtherDirty] = useState(false);

  // 全体ローディング
  const [isLoading, setIsLoading] = useState(true);
  // 機材明細ローディング
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  // 処理中
  const [isProcessing, setIsProcessing] = useState(false);
  // エラーハンドリング
  const [isError, setIsError] = useState<Error | null>(null);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // 遷移先path
  const [path, setPath] = useState<string | null>(null);

  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 出発フラグ
  const [fixFlag, setFixFlag] = useState(props.fixFlag);
  // 受注ヘッダーデータ
  const [juchuHeadData, setJuchuHeadData] = useState(props.juchuHeadData);
  // 受注機材明細元データ
  const [originJuchuKizaiMeisaiList, setOriginJuchuKizaiMeisaiList] = useState<JuchuKizaiMeisaiValues[]>(
    /*props.juchuKizaiMeisaiData ??*/ []
  );
  // 受注機材明細リスト
  const [juchuKizaiMeisaiList, setJuchuKizaiMeisaiList] = useState<JuchuKizaiMeisaiValues[]>(
    /*props.juchuKizaiMeisaiData ??*/ []
  );
  // 移動受注機材明細元データ
  const [originIdoJuchuKizaiMeisaiList, setOriginIdoJuchuKizaiMeisaiList] = useState<IdoJuchuKizaiMeisaiValues[]>(
    /*props.idoJuchuKizaiMeisaiData ??*/ []
  );
  // 移動受注機材明細リスト
  const [idoJuchuKizaiMeisaiList, setIdoJuchuKizaiMeisaiList] = useState<IdoJuchuKizaiMeisaiValues[]>(
    /*props.idoJuchuKizaiMeisaiData ??*/ []
  );
  // 受注コンテナ明細元データ
  const [originJuchuContainerMeisaiList, setOriginJuchuContainerMeisaiList] = useState<JuchuContainerMeisaiValues[]>(
    /*props.juchuContainerMeisaiData ??*/ []
  );
  // 受注コンテナ明細リスト
  const [juchuContainerMeisaiList, setJuchuContainerMeisaiList] = useState<JuchuContainerMeisaiValues[]>(
    /*props.juchuContainerMeisaiData ??*/ []
  );
  // 機材在庫元データ
  const [originEqStockList, setOriginEqStockList] = useState<StockTableValues[][]>(/*props.eqStockData ??*/ []);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(/*props.eqStockData ??*/ []);
  // 受注本番日元データ
  const [originJuchuHonbanbiList, setOriginJuchuHonbanbiList] = useState<JuchuKizaiHonbanbiValues[]>(
    props.juchuHonbanbiData ?? []
  );
  // 受注本番日リスト
  const [juchuHonbanbiList, setJuchuHonbanbiList] = useState<JuchuKizaiHonbanbiValues[]>(props.juchuHonbanbiData ?? []);
  // 受注本番日削除リスト
  const [juchuHonbanbiDeleteList, setJuchuHonbanbiDeleteList] = useState<JuchuKizaiHonbanbiValues[]>([]);
  // 受注機材明細元合計数
  const originPlanQty = originJuchuKizaiMeisaiList.reduce((acc, current) => {
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
  // const [originPlanQty, setOriginPlanQty] = useState<Map<number, number>>(
  //   juchuKizaiMeisaiList.reduce((acc, current) => {
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
  const [deleteEq, setDeleteEq] = useState<{ rowIndex: number; row: JuchuKizaiMeisaiValues } | null>(null);
  // 削除コンテナ
  const [deleteCtn, setDeleteCtn] = useState<JuchuContainerMeisaiValues | null>(null);

  // 出庫日
  const [shukoDate, setShukoDate] = useState<Date | null>(/*props.shukoDate*/ null);
  // 入庫日
  const [nyukoDate, setNyukoDate] = useState<Date | null>(/*props.nyukoDate*/ null);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(/*props.dateRange*/ []);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(/*props.shukoDate ? props.shukoDate :*/ new Date());
  // 移動日
  const [idoDat, setIdoDat] = useState<Date | null>(null);

  // 警告ダイアログ制御
  const [alertOpen, setAlertOpen] = useState(false);
  // 警告ダイアログタイトル
  const [alertTitle, setAlertTitle] = useState('');
  // 警告ダイアログ用メッセージ
  const [alertMessage, setAlertMessage] = useState('');
  // 編集内容が未保存ダイアログ制御
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 移動日更新ダイアログ制御
  const [moveOpen, setMoveOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // コピーダイアログ制御
  const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  // 分離ダイアログ制御
  const [separationDialogOpen, setSeparationDialogOpen] = useState(false);
  // 並び替えダイアログ制御
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  // 日付選択カレンダーダイアログ制御
  const [dateSelectionDialogOpne, setDateSelectionDialogOpne] = useState(false);
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

  // 編集中かどうか
  const [isNebikiRatEditing, setIsNebikiRatEditing] = useState(false);
  // 編集中かどうか
  const [isNebikiAmtEditing, setIsNebikiAmtEditing] = useState(false);

  // context
  const { setIsDirty /*setLock*/ } = useDirty();

  // ref
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
    formState: { isDirty, dirtyFields, errors, defaultValues },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      juchuHeadId: props.juchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.juchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.juchuKizaiHeadData.juchuKizaiHeadKbn,
      juchuHonbanbiQty: props.juchuKizaiHeadData.juchuHonbanbiQty,
      nebikiAmt: props.juchuKizaiHeadData.nebikiAmt,
      nebikiRat: props.juchuKizaiHeadData.nebikiRat ?? props.juchuHeadData.nebikiRat,
      mem: props.juchuKizaiHeadData.mem,
      headNam: props.juchuKizaiHeadData.headNam,
      kicsShukoDat: props.juchuKizaiHeadData.kicsShukoDat ? new Date(props.juchuKizaiHeadData.kicsShukoDat) : null,
      kicsNyukoDat: props.juchuKizaiHeadData.kicsNyukoDat ? new Date(props.juchuKizaiHeadData.kicsNyukoDat) : null,
      yardShukoDat: props.juchuKizaiHeadData.yardShukoDat ? new Date(props.juchuKizaiHeadData.yardShukoDat) : null,
      yardNyukoDat: props.juchuKizaiHeadData.yardNyukoDat ? new Date(props.juchuKizaiHeadData.yardNyukoDat) : null,
    },
    resolver: zodResolver(JuchuKizaiHeadSchema),
  });
  /** 本番日数の監視 */
  const juchuHonbanbiQty = watch('juchuHonbanbiQty');
  /** 割引率の監視 */
  const nebikiRat = watch('nebikiRat');
  /** 割引金額の監視 */
  const nebikiAmt = watch('nebikiAmt');

  // 合計金額
  const priceTotal = juchuKizaiMeisaiList.reduce(
    (sum, row) => sum + row.kizaiTankaAmt * row.planKizaiQty * (juchuHonbanbiQty ?? 0),
    0
  );

  // 割引率（金額）
  const waribikiRatAmt = priceTotal * ((nebikiRat ?? 0) / 100);
  // const waribikiRatAmt = useMemo(() => priceTotal * ((nebikiRat ?? 0) / 100), [priceTotal, nebikiRat]);

  // 割引後金額（割引金額）
  const nebikiAftAmt = priceTotal - (nebikiAmt ?? 0);
  // const nebikiAftAmt = useMemo(() => {
  //   return priceTotal - (nebikiAmt ?? 0);
  // }, [priceTotal, nebikiAmt]);

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

      try {
        // 受注機材明細データ、移動受注機材明細データ、受注コンテナ明細データ
        const [juchuKizaiMeisaiData, idoJuchuKizaiMeisaiData, juchuContainerMeisaiData] = await Promise.all([
          getJuchuKizaiMeisai(juchuKizaiHeadData.juchuHeadId, juchuKizaiHeadData.juchuKizaiHeadId),
          getIdoJuchuKizaiMeisai(juchuKizaiHeadData.juchuHeadId, juchuKizaiHeadData.juchuKizaiHeadId),
          getJuchuContainerMeisai(juchuKizaiHeadData.juchuHeadId, juchuKizaiHeadData.juchuKizaiHeadId),
        ]);

        // 出庫日
        const shukoDate = getShukoDate(
          juchuKizaiHeadData.kicsShukoDat && new Date(juchuKizaiHeadData.kicsShukoDat),
          juchuKizaiHeadData.yardShukoDat && new Date(juchuKizaiHeadData.yardShukoDat)
        );
        // 入庫日
        const nyukoDate = getNyukoDate(
          juchuKizaiHeadData.kicsNyukoDat && new Date(juchuKizaiHeadData.kicsNyukoDat),
          juchuKizaiHeadData.yardNyukoDat && new Date(juchuKizaiHeadData.yardNyukoDat)
        );

        // 出庫日から入庫日
        const dateRange = getRange(shukoDate, nyukoDate);

        // 機材在庫データ
        const updatedEqStockData =
          juchuKizaiMeisaiData.length > 0
            ? await updateEqStock(
                juchuKizaiHeadData?.juchuHeadId,
                juchuKizaiHeadData?.juchuKizaiHeadId,
                shukoDate,
                juchuKizaiMeisaiData
              )
            : [];

        setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData ?? []);
        setJuchuKizaiMeisaiList(juchuKizaiMeisaiData ?? []);
        setOriginIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);
        setIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);
        setOriginJuchuContainerMeisaiList(juchuContainerMeisaiData);
        setJuchuContainerMeisaiList(juchuContainerMeisaiData);
        setShukoDate(shukoDate);
        setNyukoDate(nyukoDate);
        setSelectDate(shukoDate ?? new Date());
        setDateRange(dateRange);
        setOriginEqStockList(updatedEqStockData);
        setEqStockList(updatedEqStockData);
        // setOriginPlanQty(
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
      } catch (e) {
        setIsError(e instanceof Error ? e : new Error(String(e)));
      }
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
      try {
        const lockData = await lockCheck(1, juchuHeadData.juchuHeadId, user.name, user.email);
        setLockData(lockData);
        if (lockData) {
          setEdit(false);
        }
      } catch (e) {
        setIsError(e instanceof Error ? e : new Error(String(e)));
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
    const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const filterJuchuContainerMeisaiList = juchuContainerMeisaiList.filter((data) => !data.delFlag);
    if (
      JSON.stringify(originJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originJuchuContainerMeisaiList) === JSON.stringify(filterJuchuContainerMeisaiList) &&
      JSON.stringify(originJuchuHonbanbiList) === JSON.stringify(juchuHonbanbiList)
    ) {
      setOtherDirty(false);
      console.log('変更なし');
    } else {
      setOtherDirty(true);
      console.log('変更あり');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juchuKizaiMeisaiList, juchuContainerMeisaiList, juchuHonbanbiList]);

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
  }, [juchuKizaiMeisaiList, isLoading, isDetailLoading]);

  useEffect(() => {
    // 機材idをキーとして受注数、予備数、合計数の各合計値算出
    const sum = juchuKizaiMeisaiList
      .filter((d) => !d.delFlag)
      .reduce((acc, current) => {
        const key = current.kizaiId;
        const currentTotals = acc.get(key) ?? { planKizaiQty: 0, planYobiQty: 0, planQty: 0 };
        currentTotals.planKizaiQty += current.planKizaiQty;
        currentTotals.planYobiQty += current.planYobiQty;
        currentTotals.planQty += current.planQty;

        acc.set(key, currentTotals);

        return acc;
      }, new Map<number, { planKizaiQty: number; planYobiQty: number; planQty: number }>());

    // setIdoJuchuKizaiMeisaiList((prev) =>
    //   prev.map((d) =>
    //     sum.get(d.kizaiId) && !d.delFlag
    //       ? {
    //           ...d,
    //           planKizaiQty: sum.get(d.kizaiId)!.planKizaiQty,
    //           planYobiQty: sum.get(d.kizaiId)!.planYobiQty,
    //           planQty: sum.get(d.kizaiId)!.planQty,
    //         }
    //       : !d.delFlag
    //         ? { ...d, delFlag: true }
    //         : d
    //   )
    // );

    setIdoJuchuKizaiMeisaiList((prev) =>
      prev.map((d) => {
        const s = sum.get(d.kizaiId);
        if (s && !d.delFlag) {
          return {
            ...d,
            planKizaiQty: s.planKizaiQty,
            planYobiQty: s.planYobiQty,
            planQty: s.planQty,
          };
        }
        if (!s && !d.delFlag) {
          return { ...d, delFlag: true };
        }
        return d;
      })
    );

    // const updatedPriceTotal = juchuKizaiMeisaiList
    //   .filter((data) => !data.delFlag)
    //   .reduce(
    //     (sum, row) =>
    //       getValues('juchuHonbanbiQty') !== null
    //         ? sum + row.kizaiTankaAmt * row.planKizaiQty * (getValues('juchuHonbanbiQty') ?? 0)
    //         : 0,
    //     0
    //   );
    // setPriceTotal(updatedPriceTotal);
  }, [getValues, juchuKizaiMeisaiList]);

  // ロック制御
  const lock = async () => {
    if (!user) return;

    try {
      const lockData = await lockCheck(1, getValues('juchuHeadId'), user.name, user.email);
      setLockData(lockData);

      if (!lockData) return true;

      setEdit(false);

      setAlertOpen(false);
      setDirtyOpen(false);
      setMoveOpen(false);
      setEqSelectionDialogOpen(false);
      setSeparationDialogOpen(false);
      setSortDialogOpen(false);
      setDateSelectionDialogOpne(false);
      setDeleteEqOpen(false);
      setDeleteCtnOpen(false);

      setAlertTitle('編集中');
      setAlertMessage(`${lockData.addUser}が編集中です`);
      setAlertOpen(true);

      // 受注ヘッダーデータ、出発フラグ
      const [juchuHeadData, fixFlag] = await Promise.all([
        getDetailJuchuHead(getValues('juchuHeadId')),
        getNyushukoFixFlag(getValues('juchuHeadId'), getValues('juchuKizaiHeadId'), 60),
      ]);
      if (!juchuHeadData) {
        return <div>受注情報が見つかりません。</div>;
      }
      setJuchuHeadData(juchuHeadData);
      setFixFlag(fixFlag);

      if (getValues('juchuKizaiHeadId') === 0) {
        const newJuchuKizaiHeadData: JuchuKizaiHeadValues = {
          juchuHeadId: juchuHeadData.juchuHeadId,
          juchuKizaiHeadId: 0,
          juchuKizaiHeadKbn: 1,
          juchuHonbanbiQty: null,
          nebikiAmt: null,
          nebikiRat: null,
          mem: null,
          headNam: juchuHeadData.koenNam,
          kicsShukoDat: null,
          kicsNyukoDat: null,
          yardShukoDat: juchuHeadData.juchuRange ? juchuHeadData.juchuRange[0] : null,
          yardNyukoDat: juchuHeadData.juchuRange ? juchuHeadData.juchuRange[1] : null,
        };
        reset(newJuchuKizaiHeadData);
      } else {
        setIsDetailLoading(true);
        // 受注機材ヘッダーデータ、受注本番日データ
        const [juchuKizaiHeadData, juchuHonbanbiData] = await Promise.all([
          getJuchuKizaiHead(getValues('juchuHeadId'), getValues('juchuKizaiHeadId')),
          getHonbanbi(getValues('juchuHeadId'), getValues('juchuKizaiHeadId')),
        ]);

        if (!juchuKizaiHeadData) {
          return <div>受注機材情報が見つかりません。</div>;
        }

        // 受注機材明細データ、移動受注機材明細データ、受注コンテナ明細データ
        const [juchuKizaiMeisaiData, idoJuchuKizaiMeisaiData, juchuContainerMeisaiData] = await Promise.all([
          getJuchuKizaiMeisai(juchuKizaiHeadData.juchuHeadId, juchuKizaiHeadData.juchuKizaiHeadId),
          getIdoJuchuKizaiMeisai(juchuKizaiHeadData.juchuHeadId, juchuKizaiHeadData.juchuKizaiHeadId),
          getJuchuContainerMeisai(juchuKizaiHeadData.juchuHeadId, juchuKizaiHeadData.juchuKizaiHeadId),
        ]);

        // 出庫日
        const shukoDate = getShukoDate(
          juchuKizaiHeadData.kicsShukoDat && new Date(juchuKizaiHeadData.kicsShukoDat),
          juchuKizaiHeadData.yardShukoDat && new Date(juchuKizaiHeadData.yardShukoDat)
        );
        // 入庫日
        const nyukoDate = getNyukoDate(
          juchuKizaiHeadData.kicsNyukoDat && new Date(juchuKizaiHeadData.kicsNyukoDat),
          juchuKizaiHeadData.yardNyukoDat && new Date(juchuKizaiHeadData.yardNyukoDat)
        );

        // 出庫日から入庫日
        const dateRange = getRange(shukoDate, nyukoDate);

        // 機材在庫データ
        const updatedEqStockData =
          juchuKizaiMeisaiData.length > 0
            ? await updateEqStock(
                juchuKizaiHeadData?.juchuHeadId,
                juchuKizaiHeadData?.juchuKizaiHeadId,
                shukoDate,
                juchuKizaiMeisaiData
              )
            : [];

        reset(juchuKizaiHeadData);
        setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData ?? []);
        setJuchuKizaiMeisaiList(juchuKizaiMeisaiData ?? []);
        setOriginIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);
        setIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);
        setOriginJuchuContainerMeisaiList(juchuContainerMeisaiData);
        setJuchuContainerMeisaiList(juchuContainerMeisaiData);
        setShukoDate(shukoDate);
        setNyukoDate(nyukoDate);
        setSelectDate(shukoDate ?? new Date());
        setDateRange(dateRange);
        setOriginEqStockList(updatedEqStockData);
        setEqStockList(updatedEqStockData);
        setOriginJuchuHonbanbiList(juchuHonbanbiData ?? []);
        setJuchuHonbanbiList(juchuHonbanbiData ?? []);
        setIsDetailLoading(false);
      }
      return false;
    } catch (e) {
      throw e;
    }
  };

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
    if (!user) return;
    // 編集→閲覧
    if (edit) {
      const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
      if (
        isDirty ||
        JSON.stringify(originJuchuHonbanbiList) !== JSON.stringify(juchuHonbanbiList) ||
        JSON.stringify(originJuchuContainerMeisaiList) !== JSON.stringify(juchuContainerMeisaiList) ||
        JSON.stringify(originJuchuKizaiMeisaiList) !== JSON.stringify(filterJuchuKizaiMeisaiList)
      ) {
        setDirtyOpen(true);
        return;
      }

      try {
        await lockRelease(1, juchuHeadData.juchuHeadId, user.name, user.email);
      } catch (e) {
        setSnackBarMessage('ロック解除に失敗しました');
        setSnackBarOpen(true);
      }
      setEdit(false);
      // 閲覧→編集
    } else {
      try {
        const lockResult = await lock();

        if (lockResult) {
          setEdit(true);
        }
      } catch (e) {
        setSnackBarMessage('サーバー接続エラー');
        setSnackBarOpen(true);
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
   * 保存ボタン押下時
   * @param data 受注機材ヘッダーデータ
   * @returns
   */
  const onSubmit = async (data: JuchuKizaiHeadValues) => {
    if (!user || isProcessing) return;
    setIsProcessing(true);
    setIsLoading(true);

    try {
      const lockResult = await lock();
      if (!lockResult) {
        setIsProcessing(false);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      setIsProcessing(false);
      setIsLoading(false);
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
      return;
    }

    // ユーザー名
    const userNam = user.name;

    // 出庫日
    const updateShukoDate = getShukoDate(
      data.kicsShukoDat && new Date(data.kicsShukoDat),
      data.yardShukoDat && new Date(data.yardShukoDat)
    );
    // 入庫日
    const updateNyukoDate = getNyukoDate(
      data.kicsNyukoDat && new Date(data.kicsNyukoDat),
      data.yardNyukoDat && new Date(data.yardNyukoDat)
    );
    // 出庫日から入庫日
    const updateDateRange = getRange(updateShukoDate, updateNyukoDate);
    console.log('出庫日から入庫日', updateDateRange);

    if (!updateShukoDate || !updateNyukoDate) {
      setIsLoading(false);
      setIsProcessing(false);
      return;
    }

    // 新規
    if (data.juchuKizaiHeadId === 0) {
      // 新規受注機材ヘッダー追加
      const newJuchuKizaiHeadId = await saveNewJuchuKizaiHead(
        data,
        updateShukoDate,
        updateNyukoDate,
        updateDateRange,
        userNam
      );

      if (newJuchuKizaiHeadId) {
        router.replace(`/eq-main-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/edit`);
      } else {
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
      }

      // 更新
    } else {
      const kicsMeisai = juchuKizaiMeisaiList.filter((d) => d.shozokuId === 1 && !d.delFlag);
      const yardMeisai = juchuKizaiMeisaiList.filter((d) => d.shozokuId === 2 && !d.delFlag);
      const kicsContainer = juchuContainerMeisaiList.filter((d) => d.planKicsKizaiQty > 0 && !d.delFlag);
      const yardContainer = juchuContainerMeisaiList.filter((d) => d.planYardKizaiQty > 0 && !d.delFlag);

      if (
        ((kicsMeisai.length > 0 || kicsContainer.length > 0) && (!data.kicsShukoDat || !data.kicsNyukoDat)) ||
        ((yardMeisai.length > 0 || yardContainer.length > 0) && (!data.yardShukoDat || !data.yardNyukoDat))
      ) {
        if ((kicsMeisai.length > 0 || kicsContainer.length > 0) && !data.kicsShukoDat) {
          setError('kicsShukoDat', {
            type: 'manual',
            message: '',
          });
        }
        if ((kicsMeisai.length > 0 || kicsContainer.length > 0) && !data.kicsNyukoDat) {
          setError('kicsNyukoDat', {
            type: 'manual',
            message: '',
          });
        }
        if ((yardMeisai.length > 0 || yardContainer.length > 0) && !data.yardShukoDat) {
          setError('yardShukoDat', {
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
      const checkKicsDat = dirtyFields.kicsShukoDat || dirtyFields.kicsNyukoDat ? true : false;
      const checkYardDat = dirtyFields.yardShukoDat || dirtyFields.yardNyukoDat ? true : false;
      const checkJuchuHonbanbi = JSON.stringify(originJuchuHonbanbiList) !== JSON.stringify(juchuHonbanbiList);
      const checkJuchuKizaiMeisai =
        JSON.stringify(originJuchuKizaiMeisaiList) !==
        JSON.stringify(juchuKizaiMeisaiList.filter((data) => !data.delFlag));
      const checkIdoJuchuKizaiMeisai =
        JSON.stringify(originIdoJuchuKizaiMeisaiList) !==
        JSON.stringify(idoJuchuKizaiMeisaiList.filter((data) => !data.delFlag));
      const checkJuchuContainerMeisai =
        JSON.stringify(originJuchuContainerMeisaiList) !==
        JSON.stringify(juchuContainerMeisaiList.filter((data) => !data.delFlag));

      const updateResult = await saveJuchuKizai(
        checkJuchuKizaiHead,
        checkKicsDat,
        checkYardDat,
        checkJuchuHonbanbi,
        checkJuchuKizaiMeisai,
        checkIdoJuchuKizaiMeisai,
        checkJuchuContainerMeisai,
        defaultValues?.kicsShukoDat,
        defaultValues?.yardShukoDat,
        data,
        updateShukoDate,
        updateNyukoDate,
        updateDateRange,
        juchuHonbanbiList,
        juchuHonbanbiDeleteList,
        juchuKizaiMeisaiList,
        idoJuchuKizaiMeisaiList,
        juchuContainerMeisaiList,
        userNam
      );

      // 画面情報更新
      if (updateResult) {
        try {
          if (checkJuchuHonbanbi) {
            // 受注機材本番日データ更新
            setOriginJuchuHonbanbiList(juchuHonbanbiList);
            setJuchuHonbanbiDeleteList([]);
          }
          if (checkJuchuKizaiHead && (checkJuchuKizaiMeisai || checkJuchuContainerMeisai)) {
            // 受注機材ヘッダー状態管理更新
            reset(data);
            // 出庫日更新
            setShukoDate(updateShukoDate);
            // 入庫日更新
            setNyukoDate(updateNyukoDate);
            // カレンダー選択日更新
            setSelectDate(updateShukoDate ? updateShukoDate : new Date());
            // 出庫日から入庫日更新
            setDateRange(updateDateRange);

            // 受注機材明細データ、移動受注機材明細データ、受注コンテナ明細データ
            const [juchuKizaiMeisaiData, idoJuchuKizaiMeisaiData, juchuCtnMeisaiData] = await Promise.all([
              getJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId),
              getIdoJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId),
              getJuchuContainerMeisai(data.juchuHeadId, data.juchuKizaiHeadId),
            ]);
            if (juchuKizaiMeisaiData) {
              setJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
              setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
              // setOriginPlanQty(
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
                updateShukoDate,
                juchuKizaiMeisaiData
              );
              setOriginEqStockList(updatedEqStockData);
              setEqStockList(updatedEqStockData);
            }
            // 移動受注機材明細更新
            setIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);
            setOriginIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);

            // 受注コンテナ明細更新
            setJuchuContainerMeisaiList(juchuCtnMeisaiData);
            setOriginJuchuContainerMeisaiList(juchuCtnMeisaiData);
          } else if (checkJuchuKizaiHead) {
            // 受注機材ヘッダー状態管理更新
            reset(data);
            // 出庫日更新
            setShukoDate(updateShukoDate);
            // 入庫日更新
            setNyukoDate(updateNyukoDate);
            // カレンダー選択日更新
            setSelectDate(updateShukoDate ? updateShukoDate : new Date());
            // 出庫日から入庫日更新
            setDateRange(updateDateRange);

            // 機材在庫テーブル更新
            const updatedEqStockData = await updateEqStock(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              updateShukoDate,
              juchuKizaiMeisaiList
            );
            setOriginEqStockList(updatedEqStockData);
            setEqStockList(updatedEqStockData);
          } else if (checkJuchuKizaiMeisai || checkJuchuContainerMeisai) {
            // 受注機材明細データ、移動受注機材明細データ、受注コンテナ明細データ
            const [juchuKizaiMeisaiData, idoJuchuKizaiMeisaiData, juchuCtnMeisaiData] = await Promise.all([
              getJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId),
              getIdoJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId),
              getJuchuContainerMeisai(data.juchuHeadId, data.juchuKizaiHeadId),
            ]);
            if (juchuKizaiMeisaiData) {
              setJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
              setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
              // setOriginPlanQty(
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
                updateShukoDate,
                juchuKizaiMeisaiData
              );
              setOriginEqStockList(updatedEqStockData);
              setEqStockList(updatedEqStockData);
            }
            // 移動受注機材明細更新
            setIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);
            setOriginIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiData);

            // 受注コンテナ明細更新
            setOriginJuchuContainerMeisaiList(juchuCtnMeisaiData);
            setJuchuContainerMeisaiList(juchuCtnMeisaiData);
          }
          if (checkIdoJuchuKizaiMeisai) {
            setOriginIdoJuchuKizaiMeisaiList(idoJuchuKizaiMeisaiList);
          }
          setOtherDirty(false);

          setSnackBarMessage('保存しました');
          setSnackBarOpen(true);
        } catch (e) {
          setSnackBarMessage('データの再取得に失敗しました');
          setSnackBarOpen(true);
        }
      } else {
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
      }
    }
    setIsLoading(false);
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
    shukoDate: Date | null,
    juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[]
  ) => {
    // 受注機材idリスト
    const ids = juchuKizaiMeisaiData.filter((d) => !d.delFlag).map((data) => data.kizaiId);
    // 機材在庫データ
    let updatedEqStockData: StockTableValues[][] = [];
    // id確認用セット
    //const checkIds = new Set<number>();
    // if (ids && shukoDate) {
    //   for (const id of ids) {
    //     if (checkIds.has(id)) {
    //       const stock = updatedEqStockData.find((d) => d[0].kizaiId === id);
    //       updatedEqStockData.push(stock!);
    //     } else {
    //       checkIds.add(id);
    //       const stock: StockTableValues[] = await getStockList(
    //         juchuHeadId,
    //         juchuKizaiHeadId,
    //         id,
    //         subDays(shukoDate, 1)
    //       );
    //       updatedEqStockData.push(stock);
    //     }
    //   }
    // }

    const uniqueIds = Array.from(new Set(juchuKizaiMeisaiData.filter((d) => !d.delFlag).map((data) => data.kizaiId)));
    try {
      if (uniqueIds.length > 0 && shukoDate) {
        const allStockData: StockTableValues[] = await getALLStockList(
          juchuHeadId,
          juchuKizaiHeadId,
          uniqueIds,
          subDays(shukoDate, 1)
        );

        const idToStockMap = new Map<number, StockTableValues[]>();
        for (const row of allStockData) {
          if (!idToStockMap.has(row.kizaiId)) {
            idToStockMap.set(row.kizaiId, []);
          }
          idToStockMap.get(row.kizaiId)!.push(row);
        }

        updatedEqStockData = ids.map((id) => {
          const stockArray = idToStockMap.get(id);
          if (!stockArray) {
            return [];
          }
          return stockArray;
        });
      }
      return updatedEqStockData;
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
      setIsDetailLoading(true);
      const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
      const filterIdoJuchuKizaiMeisaiList = idoJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
      try {
        const updatedEqStockData = await updateEqStock(
          getValues('juchuHeadId'),
          getValues('juchuKizaiHeadId'),
          date.toDate(),
          filterJuchuKizaiMeisaiList
        );

        if (
          juchuKizaiMeisaiList &&
          juchuKizaiMeisaiList.length > 0 &&
          updatedEqStockData &&
          updatedEqStockData.length > 0
        ) {
          const targetIndex = updatedEqStockData[0]
            .map((d, index) => (dateRange.includes(toJapanYMDString(d.calDat)) ? index : -1))
            .filter((index) => index !== -1);

          const subUpdatedEqStockData = updatedEqStockData.map((data, index) =>
            data.map((d, i) =>
              targetIndex.includes(i)
                ? {
                    ...d,
                    zaikoQty:
                      Number(d.zaikoQty) +
                      (originPlanQty.get(d.kizaiId) ?? 0) -
                      (filterIdoJuchuKizaiMeisaiList.find((data) => data.kizaiId === d.kizaiId)?.planQty ?? 0),
                  }
                : d
            )
          );

          setEqStockList(subUpdatedEqStockData);
        }
      } catch (e) {
        setSnackBarMessage('データの取得に失敗しました');
        setSnackBarOpen(true);
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
  const handleMemoChange = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setJuchuKizaiMeisaiList((prev) => {
          const visibleIndex = prev
            .map((data, index) => (!data.delFlag ? index : null))
            .filter((index) => index !== null) as number[];

          const index = visibleIndex[rowIndex];
          if (index === undefined) return prev;

          return prev.map((data, i) => (i === index ? { ...data, mem: memo } : data));
        });
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * 機材連絡メモ入力時
   * @param kizaiId 機材id
   * @param memo メモ内容
   */
  const handleMemo2Change = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setJuchuKizaiMeisaiList((prev) => {
          const visibleIndex = prev
            .map((data, index) => (!data.delFlag ? index : null))
            .filter((index) => index !== null) as number[];

          const index = visibleIndex[rowIndex];
          if (index === undefined) return prev;

          return prev.map((data, i) => (i === index ? { ...data, mem2: memo } : data));
        });
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * 機材テーブルの受注数、予備数入力時
   * @param kizaiId 機材id
   * @param planKizaiQty 受注数
   * @param planYobiQty 予備数
   * @param planQty 合計
   */
  const handleCellChange = (
    rowIndex: number,
    kizaiId: number,
    planKizaiQty: number,
    planYobiQty: number,
    planQty: number
  ) => {
    const updatedEqStockData = eqStockListRef.current[rowIndex];
    const targetIndex = updatedEqStockData
      .map((d, index) => (dateRange.includes(toJapanYMDString(d.calDat)) ? index : -1))
      .filter((index) => index !== -1);

    setEqStockList((prev) =>
      prev.map((data) =>
        data[0].kizaiId === kizaiId
          ? data.map((d, i) =>
              targetIndex.includes(i)
                ? { ...d, zaikoQty: Number(d.zaikoQty) + planQty - planKizaiQty - planYobiQty }
                : d
            )
          : data
      )
    );

    setJuchuKizaiMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) =>
        i === index
          ? { ...data, planKizaiQty: planKizaiQty, planYobiQty: planYobiQty, planQty: planKizaiQty + planYobiQty }
          : data
      );
    });
  };

  // 機材明細削除ボタン押下時
  const handleEqMeisaiDelete = async (rowIndex: number, row: JuchuKizaiMeisaiValues) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setDeleteEqOpen(true);
        setDeleteEq({ rowIndex: rowIndex, row: row });
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 機材明細削除ダイアログの押下ボタンによる処理
  const handleEqMeisaiDeleteResult = async (result: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (!deleteEq) {
      setDeleteEqOpen(false);
      setIsProcessing(false);
      return;
    }

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (result) {
          setJuchuKizaiMeisaiList((prev) => {
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
                      targetIndex.includes(i) ? { ...d, zaikoQty: d.zaikoQty + deleteEq.row.planQty } : d
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
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * 移動機材テーブルの移動日時の×ボタン押下時
   * @param kizaiId 機材id
   */
  const handleCellDateClear = (kizaiId: number) => {
    setIdoJuchuKizaiMeisaiList((prev) =>
      prev.map((row) =>
        row.kizaiId === kizaiId && !row.delFlag
          ? { ...row, sagyoDenDat: null, sagyoSijiId: null, shozokuId: row.mShozokuId }
          : row
      )
    );

    setJuchuKizaiMeisaiList((prev) =>
      prev.map((row) => (row.kizaiId === kizaiId && !row.delFlag ? { ...row, shozokuId: row.mShozokuId } : row))
    );
  };

  /**
   * 移動機材テーブルの移動日変更時
   * @param kizaiId 機材id
   * @param date 日付
   */
  const handleCellDateChange = (kizaiId: number, date: Dayjs | null) => {
    if (date !== null) {
      const newDate = date.toDate();
      // 移動機材明細、所属変更
      setIdoJuchuKizaiMeisaiList((prev) =>
        prev.map((row) =>
          row.kizaiId === kizaiId && !row.delFlag
            ? {
                ...row,
                sagyoDenDat: newDate,
                sagyoSijiId: row.mShozokuId === 1 ? 1 : 2,
                shozokuId: row.mShozokuId === 1 ? 2 : 1,
              }
            : row
        )
      );

      // 受注機材明細、所属変更
      setJuchuKizaiMeisaiList((prev) =>
        prev.map((row) =>
          row.kizaiId === kizaiId && !row.delFlag ? { ...row, shozokuId: row.mShozokuId === 1 ? 2 : 1 } : row
        )
      );
    }
  };

  /**
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleContainerMemoChange = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setJuchuContainerMeisaiList((prev) => {
          const visibleIndex = prev
            .map((data, index) => (!data.delFlag ? index : null))
            .filter((index) => index !== null) as number[];

          const index = visibleIndex[rowIndex];
          if (index === undefined) return prev;

          return prev.map((data, i) => (i === index ? { ...data, mem: memo } : data));
        });
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * コンテナテーブル使用数入力時
   * @param kizaiId 機材id
   * @param planKicsKizaiQty KICSコンテナ数
   * @param planYardKizaiQty YARDコンテナ数
   */
  const handleContainerCellChange = (rowIndex: number, planKicsKizaiQty: number, planYardKizaiQty: number) => {
    setJuchuContainerMeisaiList((prev) => {
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
  const handleCtnMeisaiDelete = async (row: JuchuContainerMeisaiValues) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setDeleteCtnOpen(true);
        setDeleteCtn(row);
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
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

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (result) {
          setJuchuContainerMeisaiList((prev) =>
            prev.map((data) =>
              data.kizaiId === deleteCtn.kizaiId && !data.delFlag ? { ...data, delFlag: true } : data
            )
          );
          setDeleteCtnOpen(false);
          setDeleteCtn(null);
        } else {
          setDeleteCtnOpen(false);
          setDeleteCtn(null);
        }
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * KICS出庫日変更時
   * @param newDate KICS出庫日
   */
  const handleKicsShukoChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsShukoDat', newDate.toDate(), { shouldDirty: true });
  };

  /**
   * KICS出庫日確定時
   * @param newDate KICS出庫日
   * @returns
   */
  const handleKicsShukoAccept = async (newDate: Dayjs | null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (newDate === null) return;
        trigger(['kicsShukoDat', 'yardShukoDat']);

        const yardShukoDat = getValues('yardShukoDat');

        if (idoJuchuKizaiMeisaiList.length > 0 && yardShukoDat === null) {
          setIdoDat(subDays(newDate.toDate(), 1));
          setMoveOpen(true);
        } else if (idoJuchuKizaiMeisaiList.length > 0 && yardShukoDat !== null) {
          setIdoDat(null);
          setMoveOpen(true);
        }
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * YARD出庫日変更時
   * @param newDate YARD出庫日
   */
  const handleYardShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('yardShukoDat', newDate.toDate(), { shouldDirty: true });
  };

  /**
   * YARD出庫日確定時
   * @param newDate YARD出庫日
   */
  const handleYardShukoAccept = async (newDate: Dayjs | null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (newDate === null) return;
        trigger(['kicsShukoDat', 'yardShukoDat']);

        const kicsShukoDat = getValues('kicsShukoDat');

        if (idoJuchuKizaiMeisaiList.length > 0 && kicsShukoDat === null && newDate.hour() < 12) {
          setIdoDat(subDays(newDate.toDate(), 1));
          setMoveOpen(true);
        } else if (idoJuchuKizaiMeisaiList.length > 0 && kicsShukoDat === null && newDate.hour() >= 12) {
          setIdoDat(newDate.toDate());
          setMoveOpen(true);
        } else if (idoJuchuKizaiMeisaiList.length > 0 && kicsShukoDat !== null) {
          setIdoDat(null);
          setMoveOpen(true);
        }
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
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

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (newDate === null) return;
        trigger(['kicsNyukoDat', 'yardNyukoDat']);

        const yardNyukoDat = getValues('yardNyukoDat');

        if (yardNyukoDat === null) {
          clearErrors('yardNyukoDat');
        }
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * YARD入庫日時変更時
   * @param newDate YARD入庫日
   */
  const handleYardNyukoChange = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('yardNyukoDat', newDate.toDate(), { shouldDirty: true });
  };

  /**
   * YARD入庫日時確定時
   * @param newDate YARD入庫日
   */
  const handleYardNyukoAccept = async (newDate: Dayjs | null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (newDate === null) return;
        trigger(['kicsNyukoDat', 'yardNyukoDat']);

        const kicsNyukoDat = getValues('kicsNyukoDat');

        if (kicsNyukoDat === null) {
          clearErrors('kicsNyukoDat');
        }
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  /**
   * KICS出庫日時クリアボタン押下時
   */
  const handleKicsClear = () => {
    setValue('kicsShukoDat', null, { shouldDirty: true });
    trigger(['kicsShukoDat', 'yardShukoDat']);
    const yardDat = getValues('yardShukoDat');

    if (juchuKizaiMeisaiList.length > 0 && yardDat !== null) {
      setIdoDat(subDays(yardDat, 1));
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && yardDat === null) {
      setIdoDat(null);
      setMoveOpen(true);
    }
  };

  /**
   * YARD出庫日時クリアボタン押下時
   */
  const handleYardClear = () => {
    setValue('yardShukoDat', null, { shouldDirty: true });
    trigger(['kicsShukoDat', 'yardShukoDat']);
    const kicsDat = getValues('kicsShukoDat');

    if (juchuKizaiMeisaiList.length > 0 && kicsDat !== null) {
      setIdoDat(subDays(kicsDat, 1));
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && kicsDat === null) {
      setIdoDat(null);
      setMoveOpen(true);
    }
  };

  /**
   * MoveAlertDialogの更新、戻るボタン押下
   * @param result 結果(true: 更新、false: 戻る)
   */
  const handleMoveDialog = (result: boolean) => {
    if (result) {
      if (idoDat !== null && getValues('yardShukoDat') === null) {
        setIdoJuchuKizaiMeisaiList((prev) =>
          prev.map((row) =>
            row.mShozokuId === 2 && !row.delFlag
              ? {
                  ...row,
                  sagyoDenDat: idoDat,
                  sagyoSijiId: 2,
                  shozokuId: 1,
                }
              : row
          )
        );

        setJuchuKizaiMeisaiList((prev) =>
          prev.map((row) => (row.mShozokuId === 2 && !row.delFlag ? { ...row, shozokuId: 1 } : row))
        );

        setIdoDat(null);
        setMoveOpen(false);
      } else if (idoDat !== null && getValues('kicsShukoDat') === null) {
        setIdoJuchuKizaiMeisaiList((prev) =>
          prev.map((row) =>
            row.mShozokuId === 1 && !row.delFlag
              ? {
                  ...row,
                  sagyoDenDat: idoDat,
                  sagyoSijiId: 1,
                  shozokuId: 2,
                }
              : row
          )
        );

        setJuchuKizaiMeisaiList((prev) =>
          prev.map((row) => (row.mShozokuId === 1 && !row.delFlag ? { ...row, shozokuId: 2 } : row))
        );

        setIdoDat(null);
        setMoveOpen(false);
      } else {
        setIdoJuchuKizaiMeisaiList((prev) =>
          prev.map((row) =>
            row.sagyoDenDat ? { ...row, sagyoDenDat: idoDat, sagyoSijiId: null, shozokuId: row.mShozokuId } : row
          )
        );

        setJuchuKizaiMeisaiList((prev) =>
          prev.map((row) => (!row.delFlag ? { ...row, shozokuId: row.mShozokuId } : row))
        );

        setIdoDat(null);
        setMoveOpen(false);
      }
    } else {
      setIdoDat(null);
      setMoveOpen(false);
    }
  };

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
      try {
        await lockRelease(1, juchuHeadData.juchuHeadId, user.name, user.email);
      } catch (e) {
        setSnackBarMessage('ロック解除に失敗しました');
        setSnackBarOpen(true);
      }
      setEdit(false);
      reset();
      setSelectDate(shukoDate ? shukoDate : new Date());
      setJuchuHonbanbiList(originJuchuHonbanbiList);
      setJuchuHonbanbiDeleteList([]);
      setJuchuKizaiMeisaiList(originJuchuKizaiMeisaiList);
      setIdoJuchuKizaiMeisaiList(originIdoJuchuKizaiMeisaiList);
      setJuchuContainerMeisaiList(originJuchuContainerMeisaiList);
      // setOriginPlanQty(
      //   originJuchuKizaiMeisaiList.reduce((acc, current) => {
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
    } else {
      setDirtyOpen(false);
      setPath(null);
    }
    setIsProcessing(false);
  };

  // ぺージトップへ戻る
  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  /**
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (data: SelectedEqptsValues[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    setIsDetailLoading(true);
    setEqSelectionDialogOpen(false);

    try {
      const lockResult = await lock();

      if (lockResult) {
        const indentChara = await getDic(1);

        const kicsDat = getValues('kicsShukoDat');
        const yardDat = getValues('yardShukoDat');
        const kicsIdoDat =
          kicsDat === null && yardDat !== null && yardDat.getHours() < 12
            ? subDays(yardDat, 1)
            : kicsDat === null && yardDat !== null && yardDat.getHours() >= 12
              ? yardDat
              : null;
        const yardIdoDat = yardDat === null && kicsDat !== null ? subDays(kicsDat, 1) : null;

        const kizaiData = data.filter((d) => !d.ctnFlg);
        const uniqueIds = new Set();
        const uniqueEqList = kizaiData.filter((d) => {
          if (uniqueIds.has(d.kizaiId)) {
            return false;
          }
          uniqueIds.add(d.kizaiId);
          return true;
        });
        const kizaiIds = new Set(juchuKizaiMeisaiList.filter((data) => !data.delFlag).map((data) => data.kizaiId));
        const filterKizaiData = uniqueEqList.filter((d) => !kizaiIds.has(d.kizaiId));
        const selectEq: JuchuKizaiMeisaiValues[] = kizaiData.map((d) => ({
          juchuHeadId: getValues('juchuHeadId'),
          juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
          juchuKizaiMeisaiId: 0,
          mShozokuId: d.shozokuId,
          shozokuId:
            d.shozokuId === 1 && kicsIdoDat !== null ? 2 : d.shozokuId === 2 && yardIdoDat !== null ? 1 : d.shozokuId,
          mem: '',
          mem2: '',
          kizaiId: d.kizaiId,
          kizaiTankaAmt: d.regAmt,
          kizaiNam: `${indentChara.repeat(d.indentNum)}${d.kizaiNam}`,
          planKizaiQty: 0,
          planYobiQty: 0,
          planQty: 0,
          dspOrdNum: 0,
          indentNum: d.indentNum,
          delFlag: false,
          saveFlag: false,
        }));

        const newIds = selectEq.map((data) => data.kizaiId);
        // 機材在庫データ
        // const selectEqStockData: StockTableValues[][] = [];
        // for (const id of newIds) {
        //   if (kizaiIds.has(id)) {
        //     const stock = eqStockListRef.current.find((d) => d[0].kizaiId === id);
        //     selectEqStockData.push(stock!);
        //   } else {
        //     const stock: StockTableValues[] = await getStockList(
        //       getValues('juchuHeadId'),
        //       getValues('juchuKizaiHeadId'),
        //       id,
        //       subDays(selectDate, 1)
        //     );
        //     if (originPlanQty.get(id)) {
        //       const updateStock = stock.map((d) =>
        //         dateRange.includes(toJapanYMDString(d.calDat))
        //           ? { ...d, zaikoQty: d.zaikoQty + originPlanQty.get(id)! }
        //           : d
        //       );
        //       selectEqStockData.push(updateStock);
        //     } else {
        //       selectEqStockData.push(stock);
        //     }
        //   }
        // }

        const fetchTargetIds = Array.from(new Set(newIds.filter((id) => !kizaiIds.has(id))));

        let bulkStockData: StockTableValues[] = [];
        if (fetchTargetIds.length > 0) {
          bulkStockData = await getALLStockList(
            getValues('juchuHeadId'),
            getValues('juchuKizaiHeadId'),
            fetchTargetIds,
            subDays(selectDate, 1)
          );
        }

        const bulkStockMap = new Map<number, StockTableValues[]>();
        for (const row of bulkStockData) {
          if (!bulkStockMap.has(row.kizaiId)) bulkStockMap.set(row.kizaiId, []);
          bulkStockMap.get(row.kizaiId)!.push(row);
        }

        const selectEqStockData: StockTableValues[][] = newIds.map((id) => {
          let stock: StockTableValues[];

          if (kizaiIds.has(id)) {
            const refStock = eqStockListRef.current.find((d) => d[0]?.kizaiId === id);
            stock = refStock ? [...refStock] : [];
          } else {
            stock = bulkStockMap.get(id) || [];
          }

          const originQty = originPlanQty.get(id);
          if (originQty && stock.length > 0) {
            return stock.map((d) =>
              dateRange.includes(toJapanYMDString(d.calDat)) ? { ...d, zaikoQty: d.zaikoQty + originQty } : d
            );
          }

          return stock;
        });

        const selectIdoEq: IdoJuchuKizaiMeisaiValues[] = filterKizaiData.map((d) => ({
          juchuHeadId: getValues('juchuHeadId'),
          juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
          idoDenId: null,
          sagyoDenDat:
            d.shozokuId === 1 && kicsIdoDat !== null
              ? kicsIdoDat
              : d.shozokuId === 2 && yardIdoDat !== null
                ? yardIdoDat
                : null,
          sagyoSijiId:
            d.shozokuId === 1 && kicsIdoDat !== null ? 1 : d.shozokuId === 2 && yardIdoDat !== null ? 2 : null,
          mShozokuId: d.shozokuId,
          shozokuId:
            d.shozokuId === 1 && kicsIdoDat !== null ? 2 : d.shozokuId === 2 && yardIdoDat !== null ? 1 : d.shozokuId,
          shozokuNam:
            d.shozokuId === 1 && kicsIdoDat !== null
              ? 'YARD'
              : d.shozokuId === 2 && yardIdoDat !== null
                ? 'KICS'
                : d.shozokuNam,
          kizaiId: d.kizaiId,
          kizaiNam: d.kizaiNam,
          kizaiQty: d.kizaiQty,
          planKizaiQty: 0,
          planYobiQty: 0,
          planQty: 0,
          delFlag: false,
          saveFlag: false,
        }));

        const containerData = data.filter((d) => d.ctnFlg);
        const containerIds = new Set(
          juchuContainerMeisaiList.filter((data) => !data.delFlag).map((data) => data.kizaiId)
        );
        const filterContainerData = containerData.filter((d) => !containerIds.has(d.kizaiId));
        const selectContainer: JuchuContainerMeisaiValues[] = filterContainerData.map((d) => ({
          juchuHeadId: getValues('juchuHeadId'),
          juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
          juchuKizaiMeisaiId: 0,
          kizaiId: d.kizaiId,
          kizaiNam: d.kizaiNam,
          planKicsKizaiQty: 0,
          planYardKizaiQty: 0,
          planQty: 0,
          mem: '',
          dspOrdNum: 0,
          indentNum: 0,
          delFlag: false,
          saveFlag: false,
        }));

        setJuchuKizaiMeisaiList((prev) => [...prev, ...selectEq]);
        setIdoJuchuKizaiMeisaiList((prev) => [...prev, ...selectIdoEq]);
        setJuchuContainerMeisaiList((prev) => [...prev, ...selectContainer]);
        setEqStockList((prev) => [...prev, ...selectEqStockData]);
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsDetailLoading(false);
    setIsProcessing(false);
  };

  // 機材入力ダイアログ開
  const handleOpenEqDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setEqSelectionDialogOpen(true);
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 機材入力ダイアログ閉
  const handleCloseEqDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // const lockResult = await lock();

    // if (lockResult) {
    //   setEqSelectionDialogOpen(false);
    // }
    setEqSelectionDialogOpen(false);
    setIsProcessing(false);
  };

  // コピーダイアログ開
  const handleOpenCopyDialog = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    if (edit) {
      try {
        await lockCheck(1, getValues('juchuHeadId'), user.name, user.email);
      } catch (e) {
        setIsProcessing(false);
        setSnackBarMessage('サーバー接続エラー');
        setSnackBarOpen(true);
        return;
      }
    }

    if (otherDirty || isDirty) {
      setAlertTitle('保存されていません');
      setAlertMessage('1度保存をしてください');
      setIsProcessing(false);
      setAlertOpen(true);
      return;
    }
    setCopyDialogOpen(true);

    setIsProcessing(false);
  };

  // コピーダイアログ閉
  const handleCloseCopyDialog = async () => {
    if (!user || isProcessing) return;
    setIsProcessing(true);

    // if (edit) {
    //   try {
    //     await lockCheck(1, getValues('juchuHeadId'), user.name, user.email);
    //   } catch (e) {
    //     // 閉じるべきか確認
    //     setIsProcessing(false);
    //     setSnackBarMessage('サーバー接続エラー');
    //     setSnackBarOpen(true);
    //     return;
    //   }
    // }

    setCopyDialogOpen(false);

    setIsProcessing(false);
  };

  // コピー処理
  const handleCopyConfirmed = async (
    headNam: string,
    selectEq: JuchuKizaiMeisaiValues[],
    selectCtn: JuchuContainerMeisaiValues[]
  ) => {
    if (!user || !shukoDate || !nyukoDate || isProcessing) return;
    setIsProcessing(true);

    if (edit) {
      try {
        await lockCheck(1, getValues('juchuHeadId'), user.name, user.email);
      } catch (e) {
        setIsProcessing(false);
        setSnackBarMessage('サーバー接続エラー');
        setSnackBarOpen(true);
        return;
      }
    }

    // ユーザー名
    const userNam = user.name;

    // 受注機材ヘッダー
    const newJuchuKizaiHead = { ...getValues(), headNam: headNam };
    console.log('newJuchuKizaiHead', newJuchuKizaiHead);

    // 機材id
    const ids = [...new Set(selectEq.map((d) => d.kizaiId))];
    // 選択された機材に対する移動データ
    const selectIdoList = idoJuchuKizaiMeisaiList
      .filter((d) => ids.includes(d.kizaiId) && !d.delFlag && d.sagyoDenDat)
      .map((d) => ({ ...d, planKizaiQty: 0, planYobiQty: 0, planQty: 0 }));
    console.log('selectIdoList', selectIdoList);

    const sum = selectEq
      .filter((d) => !d.delFlag)
      .reduce((acc, current) => {
        const key = current.kizaiId;
        const currentTotals = acc.get(key) ?? { planKizaiQty: 0, planYobiQty: 0, planQty: 0 };
        currentTotals.planKizaiQty += current.planKizaiQty;
        currentTotals.planYobiQty += current.planYobiQty;
        currentTotals.planQty += current.planQty;

        acc.set(key, currentTotals);

        return acc;
      }, new Map<number, { planKizaiQty: number; planYobiQty: number; planQty: number }>());

    // 移動データの数値更新
    const idoList = selectIdoList.map((d) =>
      sum.get(d.kizaiId)
        ? {
            ...d,
            planKizaiQty: sum.get(d.kizaiId)!.planKizaiQty,
            planYobiQty: sum.get(d.kizaiId)!.planYobiQty,
            planQty: sum.get(d.kizaiId)!.planQty,
          }
        : { ...d, delFlag: true }
    );
    console.log('idoList', idoList);

    // コピー処理
    const newJuchuKizaiHeadId = await juchuMeisaiCopy(
      newJuchuKizaiHead,
      shukoDate,
      nyukoDate,
      dateRange,
      selectEq,
      selectCtn,
      idoList,
      juchuHonbanbiList,
      userNam
    );

    if (newJuchuKizaiHeadId) {
      setCopyDialogOpen(false);
      setSnackBarMessage('コピーしました');
      setSnackBarOpen(true);
      window.open(`/eq-main-order-detail/${juchuHeadData.juchuHeadId}/${newJuchuKizaiHeadId}/view`);
    } else {
      setSnackBarMessage('コピーに失敗しました');
      setSnackBarOpen(true);
    }

    setIsProcessing(false);
  };

  // 分離ダイアログ開
  const handleOpenSeparationDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (otherDirty || isDirty) {
          console.log(otherDirty, isDirty);
          setAlertTitle('保存されていません');
          setAlertMessage('1度保存をしてください');
          setIsProcessing(false);
          setAlertOpen(true);
          return;
        }
        setSeparationDialogOpen(true);
      }
    } catch (e) {
      setIsProcessing(false);
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 分離ダイアログ閉
  const handleCloseSeparationDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // const lockResult = await lock();

    // if (lockResult) {
    //   setSeparationDialogOpen(false);
    // }
    setSeparationDialogOpen(false);
    setIsProcessing(false);
  };

  // 分離処理
  const handleSeparationConfirmed = async (
    headNam: string,
    selectEq: JuchuKizaiMeisaiValues[],
    selectCtn: JuchuContainerMeisaiValues[]
  ) => {
    if (!user || !shukoDate || !nyukoDate || isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();
      if (!lockResult) {
        setIsProcessing(false);
        return;
      }
    } catch (e) {
      setIsProcessing(false);
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
      return;
    }

    // ユーザー名
    const userNam = user.name;

    // 受注機材ヘッダー
    const newJuchuKizaiHead = { ...getValues(), headNam: headNam };
    console.log('newJuchuKizaiHead', newJuchuKizaiHead);

    // 機材id
    const ids = [...new Set(selectEq.map((d) => d.kizaiId))];
    // 選択された機材に対する移動データ
    const selectIdoList = idoJuchuKizaiMeisaiList
      .filter((d) => ids.includes(d.kizaiId) && !d.delFlag && d.sagyoDenDat)
      .map((d) => ({ ...d, planKizaiQty: 0, planYobiQty: 0, planQty: 0 }));
    console.log('selectIdoList', selectIdoList);

    const sum = selectEq
      .filter((d) => !d.delFlag)
      .reduce((acc, current) => {
        const key = current.kizaiId;
        const currentTotals = acc.get(key) ?? { planKizaiQty: 0, planYobiQty: 0, planQty: 0 };
        currentTotals.planKizaiQty += current.planKizaiQty;
        currentTotals.planYobiQty += current.planYobiQty;
        currentTotals.planQty += current.planQty;

        acc.set(key, currentTotals);

        return acc;
      }, new Map<number, { planKizaiQty: number; planYobiQty: number; planQty: number }>());

    // 移動データの数値更新
    const idoList = selectIdoList.map((d) =>
      sum.get(d.kizaiId)
        ? {
            ...d,
            planKizaiQty: sum.get(d.kizaiId)!.planKizaiQty,
            planYobiQty: sum.get(d.kizaiId)!.planYobiQty,
            planQty: sum.get(d.kizaiId)!.planQty,
          }
        : { ...d, delFlag: true }
    );
    console.log('idoList', idoList);

    // 元データ更新
    const selectDspOrdNum = [...selectEq.map((d) => d.dspOrdNum), ...selectCtn.map((d) => d.dspOrdNum)];
    const updateJuchuKizaiMeisaiList = juchuKizaiMeisaiList.map((data) =>
      selectDspOrdNum.includes(data.dspOrdNum)
        ? {
            ...data,
            planKizaiQty: data.planKizaiQty - selectEq.find((d) => d.dspOrdNum === data.dspOrdNum)!.planKizaiQty,
            planYobiQty: data.planYobiQty - selectEq.find((d) => d.dspOrdNum === data.dspOrdNum)!.planYobiQty,
            planQty: data.planQty - selectEq.find((d) => d.dspOrdNum === data.dspOrdNum)!.planQty,
          }
        : data
    );

    const updateJuchuContainerMeisaiList = juchuContainerMeisaiList.map((data) =>
      selectDspOrdNum.includes(data.dspOrdNum)
        ? {
            ...data,
            planKicsKizaiQty:
              data.planKicsKizaiQty - selectCtn.find((d) => d.dspOrdNum === data.dspOrdNum)!.planKicsKizaiQty,
            planYardKizaiQty:
              data.planYardKizaiQty - selectCtn.find((d) => d.dspOrdNum === data.dspOrdNum)!.planYardKizaiQty,
            planQty: data.planQty - selectCtn.find((d) => d.dspOrdNum === data.dspOrdNum)!.planQty,
          }
        : data
    );

    const updateIdoJuchuKizaiMeisaiList = idoJuchuKizaiMeisaiList.map((data) =>
      ids.includes(data.kizaiId)
        ? {
            ...data,
            planKizaiQty: data.planKizaiQty - idoList.find((d) => d.kizaiId === data.kizaiId)!.planKizaiQty,
            planYobiQty: data.planYobiQty - idoList.find((d) => d.kizaiId === data.kizaiId)!.planYobiQty,
            planQty: data.planQty - idoList.find((d) => d.kizaiId === data.kizaiId)!.planQty,
          }
        : data
    );

    // 分離処理
    const newJuchuKizaiHeadId = await juchuMeisaiseparation(
      newJuchuKizaiHead,
      shukoDate,
      nyukoDate,
      dateRange,
      selectEq,
      selectCtn,
      idoList,
      updateJuchuKizaiMeisaiList,
      updateJuchuContainerMeisaiList,
      updateIdoJuchuKizaiMeisaiList,
      juchuHonbanbiList,
      userNam
    );

    if (newJuchuKizaiHeadId) {
      setOriginJuchuKizaiMeisaiList(updateJuchuKizaiMeisaiList);
      setJuchuKizaiMeisaiList(updateJuchuKizaiMeisaiList);
      setOriginJuchuContainerMeisaiList(updateJuchuContainerMeisaiList);
      setJuchuContainerMeisaiList(updateJuchuContainerMeisaiList);
      setOriginIdoJuchuKizaiMeisaiList(updateIdoJuchuKizaiMeisaiList);
      setIdoJuchuKizaiMeisaiList(updateIdoJuchuKizaiMeisaiList);

      setSeparationDialogOpen(false);
      setSnackBarMessage('分離しました');
      setSnackBarOpen(true);
      window.open(`/eq-main-order-detail/${juchuHeadData.juchuHeadId}/${newJuchuKizaiHeadId}/view`);
    } else {
      setSnackBarMessage('分離に失敗しました');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 並び替えダイアログ開
  const handleOpenSortDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setSortDialogOpen(true);
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 並び替えダイアログ閉
  const handleCloseSortDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // const lockResult = await lock();

    // if (lockResult) {
    //   setSortDialogOpen(false);
    // }
    setSortDialogOpen(false);
    setIsProcessing(false);
  };

  /**
   * 並び替え処理
   * @param updatedMeisaiList 並び替え後の明細リスト
   */
  const handleSortConfirmed = async (updatedMeisaiList: JuchuKizaiMeisaiValues[]) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setSortDialogOpen(false);

    try {
      const lockResult = await lock();
      if (lockResult) {
        setJuchuKizaiMeisaiList(updatedMeisaiList);
        setEqStockList((prev) => {
          const map = Object.fromEntries(prev.map((b) => [b[0].kizaiId, b]));
          return updatedMeisaiList.filter((d) => !d.delFlag).map((d) => map[d.kizaiId]);
        });
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 本番日入力ダイアログ開
  const handleOpenDateDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        setDateSelectionDialogOpne(true);
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  // 本番日入力ダイアログ閉
  const handleCloseDateDialog = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // const lockResult = await lock();

    // if (lockResult) {
    //   setDateSelectionDialogOpne(false);
    // }
    setDateSelectionDialogOpne(false);
    setIsProcessing(false);
  };

  /**
   * 本番日入力ダイアログでの入力値反映
   */
  const handleSave = async (
    updatedHonbanbiList: JuchuKizaiHonbanbiValues[],
    updatedHonbanbiDeleteList: JuchuKizaiHonbanbiValues[]
  ) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const lockResult = await lock();

      if (lockResult) {
        const honbanbiQty = updatedHonbanbiList.filter((data) => data.juchuHonbanbiShubetuId === 40).length;
        const addHonbanbiQty = updatedHonbanbiList.reduce((sum, data) => sum + (data.juchuHonbanbiAddQty ?? 0), 0);
        const updatedJuchuHonbanbiQty = honbanbiQty + addHonbanbiQty;
        // const updatedPriceTotal = juchuKizaiMeisaiList
        //   .filter((data) => !data.delFlag)
        //   .reduce((sum, row) => sum + row.kizaiTankaAmt * (row.planKizaiQty ?? 0) * updatedJuchuHonbanbiQty, 0);

        if (getValues('juchuHonbanbiQty') !== updatedJuchuHonbanbiQty) {
          setValue('juchuHonbanbiQty', updatedJuchuHonbanbiQty, { shouldDirty: true });
        }
        // setPriceTotal(updatedPriceTotal);
        setJuchuHonbanbiList(updatedHonbanbiList);
        setJuchuHonbanbiDeleteList(updatedHonbanbiDeleteList);

        setDateSelectionDialogOpne(false);
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsProcessing(false);
  };

  if (isError) throw isError;

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
                  {fixFlag && (
                    <Box display={'flex'} alignItems={'center'}>
                      <Typography>出発済</Typography>
                    </Box>
                  )}
                  <Grid2 container display={saveKizaiHead ? 'flex' : 'none'} alignItems={'center'} spacing={1}>
                    {!edit || fixFlag ? <Typography>閲覧モード</Typography> : <Typography>編集モード</Typography>}
                    <Button
                      disabled={!!lockData || fixFlag || user?.permission.juchu === permission.juchu_ref}
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
              {/*-------受注ヘッダー-------*/}
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
                      <Box sx={styles.container}>
                        <Typography marginRight={5} whiteSpace="nowrap">
                          割引率
                        </Typography>
                        <TextField
                          value={juchuHeadData.nebikiRat ? `${juchuHeadData.nebikiRat} %` : ''}
                          disabled
                        ></TextField>
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
              {/*-------受注機材ヘッダー-------*/}
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
                  }}
                >
                  <Box display="flex" alignItems={'center'} justifyContent="space-between" width={'100%'}>
                    <Typography>受注機材ヘッダー</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ padding: 0 }}>
                  <Divider />
                  <Grid2 container alignItems="baseline" spacing={1} py={1} px={2}>
                    <Typography>受注明細名</Typography>
                    <TextFieldElement name="headNam" control={control} disabled={!edit}></TextFieldElement>
                  </Grid2>
                  <Grid2 container alignItems="baseline" spacing={2} py={1} px={2}>
                    <Grid2 container direction={'column'} spacing={1}>
                      <Grid2 sx={styles.grid2Row}>
                        <Typography mr={3}>機材合計</Typography>
                        <TextField
                          value={`¥${priceTotal.toLocaleString()}`}
                          type="text"
                          sx={{
                            width: 150,
                            '& .MuiInputBase-input': {
                              textAlign: 'right',
                            },
                          }}
                          disabled
                        />
                        <Typography mx={1}>割引率</Typography>
                        <Controller
                          name="nebikiRat"
                          control={control}
                          render={({ field, fieldState }) => (
                            <TextField
                              {...field}
                              value={
                                isNebikiRatEditing
                                  ? (field.value ?? '')
                                  : field.value !== null && !isNaN(field.value)
                                    ? `${Number(field.value).toLocaleString()} %`
                                    : ''
                              }
                              type="text"
                              onFocus={(e) => {
                                setIsNebikiRatEditing(true);
                                const rawValue = e.target.value.replace(/[%,]/g, '');
                                e.target.value = rawValue;
                              }}
                              onBlur={(e) => {
                                const rawValue = e.target.value.replace(/[%,]/g, '');
                                const numericValue = Number(rawValue);
                                field.onChange(numericValue);
                                setIsNebikiRatEditing(false);
                              }}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/[^\d]/g, '');
                                if (/^\d*$/.test(raw)) {
                                  field.onChange(Number(raw));
                                  e.target.value = raw;
                                }
                              }}
                              sx={{
                                width: 80,
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

                    <Grid2 container direction={'column'} spacing={1} size={{ sm: 12, md: 'grow' }}>
                      <Grid2 container width={'100%'} spacing={2}>
                        <Grid2 size={'grow'} sx={styles.grid2Row} justifyContent={{ sm: 'start', md: 'end' }}>
                          <Typography>割引率（金額）</Typography>
                          <TextField
                            value={`¥${waribikiRatAmt.toLocaleString()}`}
                            type="text"
                            sx={{
                              width: 150,
                              '& .MuiInputBase-input': {
                                textAlign: 'right',
                              },
                            }}
                            disabled
                          />
                        </Grid2>
                        <Grid2 size={6} sx={styles.grid2Row}>
                          <Typography mr={2}>割引後金額（割引率）</Typography>
                          <TextField
                            value={`¥${(priceTotal - waribikiRatAmt).toLocaleString()}`}
                            type="text"
                            sx={{
                              width: 150,
                              '& .MuiInputBase-input': {
                                textAlign: 'right',
                              },
                            }}
                            disabled
                          />
                        </Grid2>
                      </Grid2>
                      <Grid2 container width={'100%'} spacing={2}>
                        <Grid2 size={'grow'} sx={styles.grid2Row} justifyContent={{ sm: 'start', md: 'end' }}>
                          <Typography>割引金額（確定）</Typography>
                          <Controller
                            name="nebikiAmt"
                            control={control}
                            rules={{ required: '入力してください' }}
                            render={({ field, fieldState }) => (
                              <TextField
                                {...field}
                                value={
                                  isNebikiAmtEditing
                                    ? (field.value ?? '')
                                    : field.value !== null && field.value !== undefined && !isNaN(field.value)
                                      ? `¥${Number(field.value).toLocaleString()}`
                                      : ''
                                }
                                type="text"
                                onFocus={(e) => {
                                  setIsNebikiAmtEditing(true);
                                  const rawValue = e.target.value.replace(/[¥,]/g, '');
                                  e.target.value = rawValue;
                                }}
                                onBlur={(e) => {
                                  const rawValue = e.target.value.replace(/[¥,]/g, '');
                                  const numericValue = Number(rawValue);
                                  field.onChange(numericValue);
                                  setIsNebikiAmtEditing(false);
                                }}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/[^\d]/g, '');
                                  if (/^\d*$/.test(raw)) {
                                    field.onChange(Number(raw));
                                    e.target.value = raw;
                                  }
                                }}
                                sx={{
                                  width: 150,
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
                        <Grid2 size={6} sx={styles.grid2Row}>
                          <Typography>割引後金額（割引金額）</Typography>
                          <TextField
                            value={nebikiAftAmt ? `¥${nebikiAftAmt.toLocaleString()}` : ''}
                            type="text"
                            sx={{
                              width: 150,
                              '& .MuiInputBase-input': {
                                textAlign: 'right',
                              },
                            }}
                            disabled
                          />
                        </Grid2>
                      </Grid2>
                    </Grid2>
                  </Grid2>
                  <Grid2 container p={2} spacing={2}>
                    <Grid2 width={350}>
                      <Typography>出庫日時</Typography>
                      <Grid2 sx={styles.grid2Row}>
                        <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <Controller
                          name="kicsShukoDat"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Box sx={styles.grid2Row}>
                              <DateTime
                                date={field.value}
                                maxDate={
                                  juchuHonbanbiList.length > 0
                                    ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat)
                                    : undefined
                                }
                                onChange={handleKicsShukoChange}
                                onAccept={handleKicsShukoAccept}
                                fieldstate={fieldState}
                                disabled={!edit}
                                onClear={handleKicsClear}
                              />
                              <Button
                                onClick={() =>
                                  window.open(
                                    `/vehicle-order-detail/${juchuHeadData.juchuHeadId}/0/edit?kbn=1&date=${field.value?.toISOString()}&basho=1`
                                  )
                                }
                                disabled={!field.value ? true : false || !edit}
                              >
                                車両
                              </Button>
                            </Box>
                          )}
                        />
                      </Grid2>
                      <Grid2 sx={styles.grid2Row}>
                        <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <Controller
                          name="yardShukoDat"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Box sx={styles.grid2Row}>
                              <DateTime
                                date={field.value}
                                maxDate={
                                  juchuHonbanbiList.length > 0
                                    ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat)
                                    : undefined
                                }
                                onChange={handleYardShukoChange}
                                onAccept={handleYardShukoAccept}
                                fieldstate={fieldState}
                                disabled={!edit}
                                onClear={handleYardClear}
                              />
                              <Button
                                onClick={() =>
                                  window.open(
                                    `/vehicle-order-detail/${juchuHeadData.juchuHeadId}/0/edit?kbn=1&date=${field.value?.toISOString()}&basho=2`
                                  )
                                }
                                disabled={!field.value ? true : false || !edit}
                              >
                                車両
                              </Button>
                            </Box>
                          )}
                        />
                      </Grid2>
                    </Grid2>
                    <Grid2 size={'auto'}>
                      <Typography>入庫日時</Typography>
                      <Grid2 sx={styles.grid2Row}>
                        <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <Controller
                          name="kicsNyukoDat"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Box sx={styles.grid2Row}>
                              <DateTime
                                date={field.value}
                                minDate={
                                  juchuHonbanbiList.length > 0
                                    ? new Date(juchuHonbanbiList[juchuHonbanbiList.length - 1].juchuHonbanbiDat)
                                    : undefined
                                }
                                onChange={handleKicsNyukoChange}
                                onAccept={handleKicsNyukoAccept}
                                fieldstate={fieldState}
                                disabled={!edit}
                                onClear={() => {
                                  field.onChange(null);
                                  trigger(['kicsNyukoDat', 'yardNyukoDat']);
                                }}
                              />
                              <Button
                                onClick={() =>
                                  window.open(
                                    `/vehicle-order-detail/${juchuHeadData.juchuHeadId}/0/edit?kbn=2&date=${field.value?.toISOString()}&basho=1`
                                  )
                                }
                                disabled={!field.value ? true : false || !edit}
                              >
                                車両
                              </Button>
                            </Box>
                          )}
                        />
                      </Grid2>
                      <Grid2 sx={styles.grid2Row}>
                        <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <Controller
                          name="yardNyukoDat"
                          control={control}
                          render={({ field, fieldState }) => (
                            <Box sx={styles.grid2Row}>
                              <DateTime
                                date={field.value}
                                minDate={
                                  juchuHonbanbiList.length > 0
                                    ? new Date(juchuHonbanbiList[juchuHonbanbiList.length - 1].juchuHonbanbiDat)
                                    : undefined
                                }
                                onChange={handleYardNyukoChange}
                                onAccept={handleYardNyukoAccept}
                                fieldstate={fieldState}
                                disabled={!edit}
                                onClear={() => {
                                  field.onChange(null);
                                  trigger(['kicsNyukoDat', 'yardNyukoDat']);
                                }}
                              />
                              <Button
                                onClick={() =>
                                  window.open(
                                    `/vehicle-order-detail/${juchuHeadData.juchuHeadId}/0/edit?kbn=2&date=${field.value?.toISOString()}&basho=2`
                                  )
                                }
                                disabled={!field.value ? true : false || !edit}
                              >
                                車両
                              </Button>
                            </Box>
                          )}
                        />
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
                        slotProps={{ input: { readOnly: true } }}
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
            {/*-------受注明細(機材)-------*/}
            {saveKizaiHead && (
              <Paper variant="outlined" sx={{ mt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" px={2} height={'30px'}>
                  <Typography>受注明細(機材)</Typography>
                  <Grid2 container spacing={2}>
                    <Button
                      disabled={
                        (juchuKizaiMeisaiList.filter((d) => !d.delFlag).length === 0 &&
                          juchuContainerMeisaiList.filter((d) => !d.delFlag).length === 0) ||
                        isLoading ||
                        isDetailLoading ||
                        !!lockData ||
                        user?.permission.juchu === permission.juchu_ref
                      }
                      onClick={handleOpenCopyDialog}
                    >
                      <ContentCopyIcon fontSize="small" />
                      コピー
                    </Button>
                    <Button
                      disabled={
                        !edit ||
                        (juchuKizaiMeisaiList.filter((d) => !d.delFlag).length === 0 &&
                          juchuContainerMeisaiList.filter((d) => !d.delFlag).length === 0) ||
                        fixFlag ||
                        isLoading ||
                        isDetailLoading
                      }
                      onClick={handleOpenSeparationDialog}
                    >
                      <AltRouteIcon fontSize="small" />
                      分離
                    </Button>
                  </Grid2>
                </Box>
                <Divider />

                <Dialog open={EqSelectionDialogOpen} fullScreen>
                  <EqptSelectionDialog
                    // rank={juchuHeadData.kokyaku.kokyakuRank}
                    setEqpts={setEqpts}
                    handleCloseDialog={handleCloseEqDialog}
                    lock={lock}
                  />
                </Dialog>

                <Dialog
                  open={copyDialogOpen}
                  slotProps={{
                    paper: {
                      sx: {
                        maxWidth: 'none',
                      },
                    },
                  }}
                  sx={{ zIndex: 1201 }}
                >
                  <CopyDialog
                    juchuKizaiMeisaiList={juchuKizaiMeisaiList.filter((d) => !d.delFlag)}
                    juchuContainerMeisaiList={juchuContainerMeisaiList.filter((d) => !d.delFlag)}
                    handleCopyConfirmed={handleCopyConfirmed}
                    handleCloseCopyDialog={handleCloseCopyDialog}
                  />
                </Dialog>

                <Dialog
                  open={separationDialogOpen}
                  slotProps={{
                    paper: {
                      sx: {
                        maxWidth: 'none',
                        minWidth: 'none',
                      },
                    },
                  }}
                  sx={{ zIndex: 1201 }}
                >
                  <SeparationDialog
                    juchuKizaiMeisaiList={juchuKizaiMeisaiList.filter((d) => !d.delFlag)}
                    juchuContainerMeisaiList={juchuContainerMeisaiList.filter((d) => !d.delFlag)}
                    handleSeparationConfirmed={handleSeparationConfirmed}
                    handleCloseSeparationDialog={handleCloseSeparationDialog}
                  />
                </Dialog>
                {isDetailLoading ? (
                  <Loading />
                ) : (
                  <>
                    <Box display={'flex'} flexDirection="row" width="100%" py={2}>
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
                        <Grid2 container my={1} mx={2} spacing={2}>
                          <Button disabled={!edit} onClick={handleOpenEqDialog}>
                            <AddIcon fontSize="small" />
                            機材追加
                          </Button>
                          <Button
                            disabled={!edit}
                            onClick={handleOpenSortDialog}
                            sx={{
                              display:
                                juchuKizaiMeisaiList.filter((d) => !d.delFlag).length === 0 ? 'none' : 'inline-flex',
                            }}
                          >
                            並び替え
                          </Button>

                          <Dialog
                            open={sortDialogOpen}
                            slotProps={{
                              paper: {
                                sx: {
                                  maxWidth: 'none',
                                },
                              },
                            }}
                            sx={{ zIndex: 1201 }}
                          >
                            <SortDialog
                              juchuKizaiMeisai={juchuKizaiMeisaiList}
                              onClose={handleCloseSortDialog}
                              onSave={handleSortConfirmed}
                            />
                          </Dialog>
                        </Grid2>
                        <Box
                          display={
                            Object.keys(juchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'
                          }
                        >
                          <EqTable
                            rows={juchuKizaiMeisaiList}
                            edit={edit}
                            handleCellChange={handleCellChange}
                            handleMeisaiDelete={handleEqMeisaiDelete}
                            handleMemoChange={handleMemoChange}
                            handleMemo2Change={handleMemo2Change}
                            ref={leftRef}
                          />
                        </Box>
                      </Box>
                      <Box
                        display={Object.keys(eqStockList).length > 0 ? 'block' : 'none'}
                        overflow="auto"
                        sx={{ width: { xs: '60%', sm: '60%', md: 'auto' } }}
                      >
                        <Box display={Object.keys(eqStockList).length > 0 ? 'flex' : 'none'} my={1}>
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
                        <StockTable
                          eqStockList={eqStockList}
                          dateRange={dateRange}
                          juchuHonbanbiList={juchuHonbanbiList}
                          ref={rightRef}
                        />
                      </Box>
                    </Box>
                    <Box
                      display={
                        Object.keys(idoJuchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'
                      }
                      py={2}
                    >
                      <IdoEqTable
                        rows={idoJuchuKizaiMeisaiList}
                        edit={edit}
                        handleCellDateChange={handleCellDateChange}
                        handleCellDateClear={handleCellDateClear}
                      />
                    </Box>
                    <Box
                      display={juchuContainerMeisaiList.filter((d) => !d.delFlag).length > 0 ? 'block' : 'none'}
                      py={2}
                      width={'fit-content'}
                    >
                      <ContainerTable
                        rows={juchuContainerMeisaiList}
                        edit={edit}
                        handleContainerMemoChange={handleContainerMemoChange}
                        handleContainerCellChange={handleContainerCellChange}
                        handleMeisaiDelete={handleCtnMeisaiDelete}
                      />
                    </Box>
                  </>
                )}
              </Paper>
            )}
            {/*-------本番日-------*/}
            {saveKizaiHead && (
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
                        juchuHeadId={getValues('juchuHeadId')}
                        juchuKizaiHeadId={getValues('juchuKizaiHeadId')}
                        shukoDate={shukoDate}
                        nyukoDate={nyukoDate}
                        juchuHonbanbiList={juchuHonbanbiList}
                        juchuHonbanbiDeleteList={juchuHonbanbiDeleteList}
                        scrollRef={scrollRef}
                        onClose={handleCloseDateDialog}
                        onSave={handleSave}
                        lock={lock}
                      />
                    </Dialog>
                  </Box>
                  <Box
                    display={'flex'}
                    justifyContent={'center'}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    width={75}
                    bgcolor={'mediumpurple'}
                  >
                    <Typography fontSize={'small'} py={1} px={3} sx={{ color: 'white' }}>
                      仕込
                    </Typography>
                  </Box>
                  <Grid2 container spacing={1} ml={{ xs: 10, sm: 17, md: 17, lg: 17 }} py={2} width={{ md: '50%' }}>
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>日付</Typography>
                    </Grid2>
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>追加日数</Typography>
                    </Grid2>
                    <Grid2 size={6}>
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
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{toJapanYMDString(data.juchuHonbanbiDat)}</Typography>
                              </Grid2>
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{data.juchuHonbanbiAddQty}</Typography>
                              </Grid2>
                              <Grid2 size={6}>
                                <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                              </Grid2>
                            </Grid2>
                          )
                      )}
                  </Grid2>
                  <Box
                    display={'flex'}
                    justifyContent={'center'}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    mt={4}
                    width={75}
                    bgcolor={'orange'}
                  >
                    <Typography fontSize={'small'} py={1} px={3} sx={{ color: 'white' }}>
                      RH
                    </Typography>
                  </Box>
                  <Grid2
                    container
                    display="flex"
                    flexDirection="row"
                    spacing={1}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    py={2}
                    width={{ md: '50%' }}
                  >
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>日付</Typography>
                    </Grid2>
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>追加日数</Typography>
                    </Grid2>
                    <Grid2 size={6}>
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
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{toJapanYMDString(data.juchuHonbanbiDat)}</Typography>
                              </Grid2>
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{data.juchuHonbanbiAddQty}</Typography>
                              </Grid2>
                              <Grid2 size={6}>
                                <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                              </Grid2>
                            </Grid2>
                          )
                      )}
                  </Grid2>
                  <Box
                    display={'flex'}
                    justifyContent={'center'}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    mt={4}
                    width={75}
                    bgcolor={'lightgreen'}
                  >
                    <Typography fontSize={'small'} py={1} px={3} sx={{ color: 'white' }}>
                      GP
                    </Typography>
                  </Box>
                  <Grid2
                    container
                    display="flex"
                    flexDirection="row"
                    spacing={1}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    py={2}
                    width={{ md: '50%' }}
                  >
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>日付</Typography>
                    </Grid2>
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>追加日数</Typography>
                    </Grid2>
                    <Grid2 size={6}>
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
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{toJapanYMDString(data.juchuHonbanbiDat)}</Typography>
                              </Grid2>
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{data.juchuHonbanbiAddQty}</Typography>
                              </Grid2>
                              <Grid2 size={6}>
                                <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                              </Grid2>
                            </Grid2>
                          )
                      )}
                  </Grid2>
                  <Box
                    display={'flex'}
                    justifyContent={'center'}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    mt={4}
                    width={75}
                    bgcolor={'pink'}
                  >
                    <Typography fontSize={'small'} py={1} px={3} sx={{ color: 'white' }}>
                      本番
                    </Typography>
                  </Box>
                  <Grid2
                    container
                    display="flex"
                    flexDirection="row"
                    spacing={1}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    py={2}
                    width={{ md: '50%' }}
                  >
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>日付</Typography>
                    </Grid2>
                    <Grid2 size={3} maxWidth={200}>
                      <Typography>追加日数</Typography>
                    </Grid2>
                    <Grid2 size={6}>
                      <Typography>メモ</Typography>
                    </Grid2>
                  </Grid2>
                  <Grid2
                    container
                    display="flex"
                    flexDirection="column"
                    spacing={1}
                    ml={{ xs: 10, sm: 17, md: 17, lg: 17 }}
                    pb={2}
                    width={{ md: '50%' }}
                  >
                    {juchuHonbanbiList &&
                      juchuHonbanbiList.map(
                        (data, index) =>
                          data.juchuHonbanbiShubetuId === 40 && (
                            <Grid2 key={index} container display="flex" flexDirection="row">
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{toJapanYMDString(data.juchuHonbanbiDat)}</Typography>
                              </Grid2>
                              <Grid2 size={3} maxWidth={200}>
                                <Typography>{data.juchuHonbanbiAddQty}</Typography>
                              </Grid2>
                              <Grid2 size={6}>
                                <Typography sx={{ wordBreak: 'break-word', whiteSpace: 'wrap' }}>{data.mem}</Typography>
                              </Grid2>
                            </Grid2>
                          )
                      )}
                  </Grid2>
                </Box>
              </Paper>
            )}
          </Container>
        </PermissionGuard>
      )}
      <AlertDialog open={alertOpen} title={alertTitle} message={alertMessage} onClick={() => setAlertOpen(false)} />
      <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
      <MoveAlertDialog open={moveOpen} onClick={handleMoveDialog} />
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
  // grid2row
  grid2Row: {
    display: 'flex',
    alignItems: 'baseline',
  },
};
