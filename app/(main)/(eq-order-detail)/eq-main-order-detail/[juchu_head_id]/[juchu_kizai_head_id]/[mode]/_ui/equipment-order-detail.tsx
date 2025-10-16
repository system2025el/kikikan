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
import { add, addMonths, endOfMonth, set, sub, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { get } from 'http';
import { redirect, useRouter } from 'next/navigation';
import { use, useEffect, useLayoutEffect, useRef, useState } from 'react';
import React from 'react';
import { Controller, ControllerRenderProps, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';
import { shouldDisplay } from 'rsuite/esm/internals/Picker';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';
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
  getJuchuContainerMeisai,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  getStockList,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { DetailOerValues } from '@/app/(main)/(eq-order-detail)/_lib/types';

import {
  DeleteAlertDialog,
  MoveAlertDialog,
  NyushukoAlertDialog,
  NyushukoFixAlertDialog,
  SaveAlertDialog,
} from '../../../../../_ui/caveat-dialog';
import {
  addHonbanbi,
  addIdoDen,
  addIdoFix,
  addJuchuContainerMeisai,
  addJuchuKizaiHead,
  addJuchuKizaiMeisai,
  addNyushukoDen,
  confirmHonbanbi,
  delHonbanbi,
  delIdoDen,
  delIdoFix,
  delJuchuContainerMeisai,
  delJuchuKizaiMeisai,
  delNyushukoDen,
  getIdoDenMaxId,
  getJuchuKizaiMeisai,
  saveJuchuKizai,
  saveNewJuchuKizaiHead,
  updContainerNyushukoDen,
  updHonbanbi,
  updIdoDen,
  updIdoFix,
  updJuchuContainerMeisai,
  updJuchuKizaiHead,
  updJuchuKizaiMeisai,
  updNyushukoDen,
  updNyushukoFix,
  updNyushukoHonbanbi,
} from '../_lib/funcs';
import {
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadSchema,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  SelectedEqptsValues,
  StockTableValues,
} from '../_lib/types';
import { DateSelectDialog } from './date-selection-dialog';
import { ContainerTable, EqTable, StockTable } from './equipment-order-detail-table';
import { EqptSelectionDialog } from './equipment-selection-dailog';

const EquipmentOrderDetail = (props: {
  juchuHeadData: DetailOerValues;
  juchuKizaiHeadData: JuchuKizaiHeadValues;
  juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[] | undefined;
  juchuContainerMeisaiData: JuchuContainerMeisaiValues[];
  shukoDate: Date | null;
  nyukoDate: Date | null;
  dateRange: string[];
  eqStockData: StockTableValues[][] | undefined;
  juchuHonbanbiData: JuchuKizaiHonbanbiValues[] | undefined;
  edit: boolean;
  kicsFixFlag: boolean;
  yardFixFlag: boolean;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.juchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;
  // KICS出発フラグ
  const kicsFixFlag = props.kicsFixFlag;
  // YARD出発フラグ
  const yardFixFlag = props.yardFixFlag;
  // 全体の保存フラグ
  const [save, setSave] = useState(false);

  // 全体ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 機材明細ローディング
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);

  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 受注機材明細元データ
  const [originJuchuKizaiMeisaiList, setOriginJuchuKizaiMeisaiList] = useState<JuchuKizaiMeisaiValues[]>(
    props.juchuKizaiMeisaiData ?? []
  );
  // 受注機材明細リスト
  const [juchuKizaiMeisaiList, setJuchuKizaiMeisaiList] = useState<JuchuKizaiMeisaiValues[]>(
    props.juchuKizaiMeisaiData ?? []
  );
  // 受注コンテナ明細元データ
  const [originJuchuContainerMeisaiList, setOriginJuchuContainerMeisaiList] = useState<JuchuContainerMeisaiValues[]>(
    props.juchuContainerMeisaiData ?? []
  );
  // 受注コンテナ明細リスト
  const [juchuContainerMeisaiList, setJuchuContainerMeisaiList] = useState<JuchuContainerMeisaiValues[]>(
    props.juchuContainerMeisaiData ?? []
  );
  // 機材在庫元データ
  const [originEqStockList, setOriginEqStockList] = useState<StockTableValues[][]>(props.eqStockData ?? []);
  // 機材在庫リスト
  const [eqStockList, setEqStockList] = useState<StockTableValues[][]>(props.eqStockData ? props.eqStockData : []);
  // 受注本番日元データ
  const [originJuchuHonbanbiList, setOriginJuchuHonbanbiList] = useState<JuchuKizaiHonbanbiValues[]>(
    props.juchuHonbanbiData ?? []
  );
  // 受注本番日リスト
  const [juchuHonbanbiList, setJuchuHonbanbiList] = useState<JuchuKizaiHonbanbiValues[]>(props.juchuHonbanbiData ?? []);
  // 受注本番日削除リスト
  const [juchuHonbanbiDeleteList, setJuchuHonbanbiDeleteList] = useState<JuchuKizaiHonbanbiValues[]>([]);
  // 受注機材明細元合計数
  const [originPlanQty, setOriginPlanQty] = useState<number[]>(
    props.juchuKizaiMeisaiData ? props.juchuKizaiMeisaiData.map((data) => data.planQty ?? 0) : []
  );
  // 削除機材
  const [deleteTarget, setDeleteTarget] = useState<{ kizaiId: number; containerFlag: boolean } | null>(null);

  // 出庫日
  const [shukoDate, setShukoDate] = useState<Date | null>(props.shukoDate);
  // 入庫日
  const [nyukoDate, setNyukoDate] = useState<Date | null>(props.nyukoDate);
  // 出庫日から入庫日
  const [dateRange, setDateRange] = useState<string[]>(props.dateRange);
  // カレンダー選択日
  const [selectDate, setSelectDate] = useState<Date>(props.shukoDate ? props.shukoDate : new Date());
  // 移動日
  const [idoDat, setIdoDat] = useState<Date | null>(null);

  // 未保存ダイアログ制御
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログ制御
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 移動日更新ダイアログ制御
  const [moveOpen, setMoveOpen] = useState(false);
  // 入出庫日時ダイアログ制御
  const [nyushukoOpen, setNyushukoOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // 日付選択カレンダーダイアログ制御
  const [dateSelectionDialogOpne, setDateSelectionDialogOpne] = useState(false);
  // 機材削除ダイアログ制御
  const [deleteOpen, setDeleteOpen] = useState(false);
  // 出発中ダイアログ制御
  const [nyushukoFixOpen, setNyushukoFixOpen] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // 合計金額
  const [priceTotal, setPriceTotal] = useState(
    juchuKizaiMeisaiList!.reduce(
      (sum, row) =>
        props.juchuKizaiHeadData.juchuHonbanbiQty && row.planKizaiQty
          ? sum + row.kizaiTankaAmt * row.planKizaiQty * props.juchuKizaiHeadData.juchuHonbanbiQty
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
  useUnsavedChangesWarning(isDirty, save);

  /**
   * useEffect
   */
  useEffect(() => {
    setSave(saveKizaiHead);
    setIsSave(saveKizaiHead);
  }, [saveKizaiHead, setIsSave]);

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
    const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const filterJuchuContainerMeisaiList = juchuContainerMeisaiList.filter((data) => !data.delFlag);
    if (
      saveKizaiHead &&
      JSON.stringify(originJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originJuchuContainerMeisaiList) === JSON.stringify(filterJuchuContainerMeisaiList) &&
      JSON.stringify(originJuchuHonbanbiList) === JSON.stringify(juchuHonbanbiList)
    ) {
      setSave(true);
      setIsSave(true);
    } else {
      setSave(false);
      setIsSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juchuKizaiMeisaiList, juchuContainerMeisaiList, juchuHonbanbiList]);

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
  }, [juchuKizaiMeisaiList, isLoading, isDetailLoading]);

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
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

  /**
   * 保存ボタン押下時
   * @param data 受注機材ヘッダーデータ
   * @returns
   */
  const onSubmit = async (data: JuchuKizaiHeadValues) => {
    console.log('保存開始');
    if (!user) return;
    setIsLoading(true);
    setIsEditing(false);

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
        redirect(`/eq-main-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/edit`);
      } else {
        console.log('保存失敗');
      }

      // 更新
    } else {
      const kicsMeisai = juchuKizaiMeisaiList.filter((d) => d.shozokuId === 1);
      const yardMeisai = juchuKizaiMeisaiList.filter((d) => d.shozokuId === 2);
      const kicsContainer = juchuContainerMeisaiList.filter((d) => d.planKicsKizaiQty);
      const yardContainer = juchuContainerMeisaiList.filter((d) => d.planYardKizaiQty);

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
        setNyushukoOpen(true);
        setIsLoading(false);
        return;
      }

      // 更新判定
      const checkJuchuKizaiHead = isDirty;
      const checkJuchuHonbanbi = JSON.stringify(originJuchuHonbanbiList) !== JSON.stringify(juchuHonbanbiList);
      const checkJuchuKizaiMeisai =
        JSON.stringify(originJuchuKizaiMeisaiList) !==
        JSON.stringify(juchuKizaiMeisaiList.filter((data) => !data.delFlag));
      const checkJuchuContainerMeisai =
        JSON.stringify(originJuchuContainerMeisaiList) !==
        JSON.stringify(juchuContainerMeisaiList.filter((data) => !data.delFlag));

      const updateResult = await saveJuchuKizai(
        checkJuchuKizaiHead,
        checkJuchuHonbanbi,
        checkJuchuKizaiMeisai,
        checkJuchuContainerMeisai,
        data,
        updateShukoDate,
        updateNyukoDate,
        updateDateRange,
        juchuHonbanbiList,
        juchuHonbanbiDeleteList,
        juchuKizaiMeisaiList,
        juchuContainerMeisaiList,
        userNam
      );

      // 画面情報更新
      if (updateResult) {
        if (checkJuchuHonbanbi) {
          // 受注機材本番日データ更新
          setOriginJuchuHonbanbiList(juchuHonbanbiList);
          setJuchuHonbanbiDeleteList([]);
        }
        if (checkJuchuKizaiHead && checkJuchuKizaiMeisai) {
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

          // 受注機材明細、機材在庫テーブル更新
          const juchuKizaiMeisaiData = await getJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId);
          if (juchuKizaiMeisaiData) {
            setJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginPlanQty(juchuKizaiMeisaiData.map((data) => data.planQty ?? 0));
            const updatedEqStockData = await updateEqStock(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              updateShukoDate,
              juchuKizaiMeisaiData
            );
            setOriginEqStockList(updatedEqStockData);
          }
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
        } else if (checkJuchuKizaiMeisai) {
          // 受注機材明細、機材在庫テーブル更新
          const juchuKizaiMeisaiData = await getJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId);
          if (juchuKizaiMeisaiData) {
            setJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
            setOriginPlanQty(juchuKizaiMeisaiData.map((data) => data.planQty ?? 0));
            const updatedEqStockData = await updateEqStock(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              updateShukoDate,
              juchuKizaiMeisaiData
            );
            setOriginEqStockList(updatedEqStockData);
          }
        }
        if (checkJuchuContainerMeisai) {
          const juchuContainerMeisaiData = await getJuchuContainerMeisai(data.juchuHeadId, data.juchuKizaiHeadId);
          setOriginJuchuContainerMeisaiList(juchuContainerMeisaiData);
          setJuchuContainerMeisaiList(juchuContainerMeisaiData);
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
    juchuKizaiMeisaiData: JuchuKizaiMeisaiValues[]
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
      setIsDetailLoading(true);
      const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
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
          .map((d, index) => (dateRange.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
          .filter((index) => index !== -1);

        const subUpdatedEqStockData = updatedEqStockData.map((data, index) =>
          data.map((d, i) =>
            targetIndex.includes(i)
              ? {
                  ...d,
                  zaikoQty:
                    Number(d.zaikoQty) + originPlanQty[index] - (filterJuchuKizaiMeisaiList[index].planQty ?? 0),
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
   * 機材テーブルの移動日時の×ボタン押下時
   * @param kizaiId 機材id
   */
  const handleCellDateClear = (kizaiId: number) => {
    setJuchuKizaiMeisaiList((prev) =>
      prev.map((row) =>
        row.kizaiId === kizaiId ? { ...row, sagyoDenDat: null, sagyoSijiId: null, shozokuId: row.mShozokuId } : row
      )
    );
  };

  /**
   * 機材メモ入力時
   * @param kizaiId 機材id
   * @param memo メモ内容
   */
  const handleMemoChange = (kizaiId: number, memo: string) => {
    setJuchuKizaiMeisaiList((prev) => prev.map((data) => (data.kizaiId === kizaiId ? { ...data, mem: memo } : data)));
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
    const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const kizaiQty = filterJuchuKizaiMeisaiList.find((data) => data.kizaiId === kizaiId)?.planQty || 0;
    if (
      juchuKizaiMeisaiList &&
      juchuKizaiMeisaiList.length > 0 &&
      eqStockListRef.current &&
      eqStockListRef.current.length > 0
    ) {
      const targetIndex = updatedEqStockData
        .map((d, index) => (dateRange.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
        .filter((index) => index !== -1);
      const subUpdatedEqStockList = updatedEqStockData.map((data, index) =>
        targetIndex.includes(index) ? { ...data, zaikoQty: Number(data.zaikoQty) + kizaiQty - planQty } : data
      );
      setEqStockList((prev) => prev.map((data, i) => (i === rowIndex ? [...subUpdatedEqStockList] : data)));
    }
    const updatedPriceTotal = juchuKizaiMeisaiList
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
    setJuchuKizaiMeisaiList((prev) =>
      prev.map((data) =>
        data.kizaiId === kizaiId && !data.delFlag
          ? { ...data, planKizaiQty: planKizaiQty, planYobiQty: planYobiQty, planQty: planQty }
          : data
      )
    );
  };

  /**
   * 機材テーブルの移動日変更時
   * @param kizaiId 機材id
   * @param date 日付
   */
  const handleCellDateChange = (kizaiId: number, date: Dayjs | null) => {
    if (date !== null) {
      const newDate = date.toDate();
      setJuchuKizaiMeisaiList((prev) =>
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
    }
  };

  /**
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleContainerMemoChange = (kizaiId: number, memo: string) => {
    setJuchuContainerMeisaiList((prev) =>
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
  const handleContainerCellChange = (
    kizaiId: number,
    planKicsKizaiQty: number,
    planYardKizaiQty: number,
    planQty: number
  ) => {
    setJuchuContainerMeisaiList((prev) =>
      prev.map((data) =>
        data.kizaiId === kizaiId && !data.delFlag
          ? { ...data, planKicsKizaiQty: planKicsKizaiQty, planYardKizaiQty: planYardKizaiQty, planQty: planQty }
          : data
      )
    );
  };

  // 明細削除ボタン押下時
  const handleMeisaiDelete = (target: { kizaiId: number; containerFlag: boolean }) => {
    // 機材
    if (!target.containerFlag) {
      const deleteData = juchuKizaiMeisaiList.find((d) => d.kizaiId === target.kizaiId && !d.delFlag);
      if ((deleteData?.shozokuId === 1 && kicsFixFlag) || (deleteData?.shozokuId === 2 && yardFixFlag)) {
        setNyushukoFixOpen(true);
        return;
      }
    }

    // コンテナ
    if (target.containerFlag && (kicsFixFlag || yardFixFlag)) {
      setNyushukoFixOpen(true);
      return;
    }

    setDeleteOpen(true);
    setDeleteTarget(target);
  };

  // 明細削除ダイアログの押下ボタンによる処理
  const handleMeisaiDeleteResult = (result: boolean) => {
    if (!deleteTarget) return;

    if (result) {
      setDeleteOpen(false);
      // コンテナ削除
      if (deleteTarget.containerFlag) {
        setJuchuContainerMeisaiList((prev) =>
          prev.map((data) =>
            data.kizaiId === deleteTarget.kizaiId && !data.delFlag ? { ...data, delFlag: true } : data
          )
        );
        // 機材削除
      } else {
        const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
        const rowIndex = filterJuchuKizaiMeisaiList.findIndex((data) => data.kizaiId === deleteTarget.kizaiId);
        const updatedJuchuKizaiMeisaiList = filterJuchuKizaiMeisaiList.filter(
          (data) => data.kizaiId !== deleteTarget.kizaiId
        );
        setJuchuKizaiMeisaiList((prev) =>
          prev.map((data) =>
            data.kizaiId === deleteTarget.kizaiId && !data.delFlag ? { ...data, delFlag: true } : data
          )
        );
        setEqStockList((prev) => prev.filter((data) => !data.every((d) => d.kizaiId === deleteTarget.kizaiId)));
        setOriginPlanQty((prev) => prev.filter((_, index) => index !== rowIndex));
        setPriceTotal(updatedJuchuKizaiMeisaiList.reduce((sum, row) => sum + (row.kizaiTankaAmt ?? 0), 0));
      }
      setDeleteTarget(null);
    } else {
      setDeleteOpen(false);
      setDeleteTarget(null);
    }
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
    if (newDate === null) return;
    trigger(['kicsShukoDat', 'yardShukoDat']);

    const yardShukoDat = getValues('yardShukoDat');

    if (juchuKizaiMeisaiList.length > 0 && yardShukoDat === null) {
      setIdoDat(subDays(newDate.toDate(), 1));
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && yardShukoDat !== null) {
      setIdoDat(null);
      setMoveOpen(true);
    }
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
    if (newDate === null) return;
    trigger(['kicsShukoDat', 'yardShukoDat']);

    const kicsShukoDat = getValues('kicsShukoDat');

    if (juchuKizaiMeisaiList.length > 0 && kicsShukoDat === null && newDate.hour() < 12) {
      setIdoDat(subDays(newDate.toDate(), 1));
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && kicsShukoDat === null && newDate.hour() >= 12) {
      setIdoDat(newDate.toDate());
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && kicsShukoDat !== null) {
      setIdoDat(null);
      setMoveOpen(true);
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
  const handleYardNyukoAccept = (newDate: Dayjs | null) => {
    if (newDate === null) return;
    trigger(['kicsNyukoDat', 'yardNyukoDat']);

    const kicsNyukoDat = getValues('kicsNyukoDat');

    if (kicsNyukoDat === null) {
      clearErrors('kicsNyukoDat');
    }
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
        setJuchuKizaiMeisaiList((prev) =>
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
        setIdoDat(null);
        setMoveOpen(false);
      } else if (idoDat !== null && getValues('kicsShukoDat') === null) {
        setJuchuKizaiMeisaiList((prev) =>
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
        setIdoDat(null);
        setMoveOpen(false);
      } else {
        setJuchuKizaiMeisaiList((prev) =>
          prev.map((row) =>
            row.sagyoDenDat ? { ...row, sagyoDenDat: idoDat, sagyoSijiId: null, shozokuId: row.mShozokuId } : row
          )
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
    if (result) {
      await delLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      reset();
      setSelectDate(shukoDate ? shukoDate : new Date());
      setJuchuHonbanbiList(originJuchuHonbanbiList);
      setJuchuHonbanbiDeleteList([]);
      setJuchuKizaiMeisaiList(originJuchuKizaiMeisaiList);
      setJuchuContainerMeisaiList(originJuchuContainerMeisaiList);
      setOriginPlanQty(originJuchuKizaiMeisaiList.map((data) => data.planQty ?? 0));
      setEqStockList(originEqStockList);
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
    }
  };

  /**
   * 本番日入力ダイアログでの入力値反映
   */
  const handleSave = (
    updatedHonbanbiList: JuchuKizaiHonbanbiValues[],
    updatedHonbanbiDeleteList: JuchuKizaiHonbanbiValues[]
  ) => {
    const honbanbiQty = updatedHonbanbiList.filter((data) => data.juchuHonbanbiShubetuId === 40).length;
    const addHonbanbiQty = updatedHonbanbiList.reduce((sum, data) => sum + (data.juchuHonbanbiAddQty ?? 0), 0);
    const updatedJuchuHonbanbiQty = honbanbiQty + addHonbanbiQty;
    const updatedPriceTotal = juchuKizaiMeisaiList
      .filter((data) => !data.delFlag)
      .reduce((sum, row) => sum + row.kizaiTankaAmt * (row.planKizaiQty ?? 0) * updatedJuchuHonbanbiQty, 0);

    if (getValues('juchuHonbanbiQty') !== updatedJuchuHonbanbiQty) {
      setValue('juchuHonbanbiQty', updatedJuchuHonbanbiQty, { shouldDirty: true });
    }
    setPriceTotal(updatedPriceTotal);
    setJuchuHonbanbiList(updatedHonbanbiList);
    setJuchuHonbanbiDeleteList(updatedHonbanbiDeleteList);

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

  /**
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (data: SelectedEqptsValues[]) => {
    setIsDetailLoading(true);
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
    const kizaiIds = new Set(juchuKizaiMeisaiList.filter((data) => !data.delFlag).map((data) => data.kizaiId));
    const filterKizaiData = kizaiData.filter((d) => !kizaiIds.has(d.kizaiId));
    const selectEq: JuchuKizaiMeisaiValues[] = filterKizaiData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
      juchuKizaiMeisaiId: 0,
      idoDenId: null,
      sagyoDenDat:
        d.shozokuId === 1 && kicsIdoDat !== null
          ? kicsIdoDat
          : d.shozokuId === 2 && yardIdoDat !== null
            ? yardIdoDat
            : null,
      sagyoSijiId: d.shozokuId === 1 && kicsIdoDat !== null ? 1 : d.shozokuId === 2 && yardIdoDat !== null ? 2 : null,
      mShozokuId: d.shozokuId,
      shozokuId:
        d.shozokuId === 1 && kicsIdoDat !== null ? 2 : d.shozokuId === 2 && yardIdoDat !== null ? 1 : d.shozokuId,
      shozokuNam: d.shozokuNam,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiTankaAmt: d.rankAmt,
      kizaiNam: d.kizaiNam,
      kizaiQty: d.kizaiQty,
      planKizaiQty: 0,
      planYobiQty: 0,
      planQty: 0,
      delFlag: false,
      saveFlag: false,
    }));
    const newIds = selectEq.map((data) => data.kizaiId);
    const newPlanQtys = selectEq.map((data) => data.planQty ?? 0);
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

    const containerData = data.filter((d) => d.ctnFlg);
    const containerIds = new Set(juchuContainerMeisaiList.filter((data) => !data.delFlag).map((data) => data.kizaiId));
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
      delFlag: false,
      saveFlag: false,
    }));

    setJuchuKizaiMeisaiList((prev) => [...prev, ...selectEq]);
    setJuchuContainerMeisaiList((prev) => [...prev, ...selectContainer]);
    setEqStockList((prev) => [...prev, ...selectEqStockData]);
    setOriginPlanQty((prev) => [...prev, ...newPlanQtys]);
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
  const handleCloseEqDialog = () => {
    setEqSelectionDialogOpen(false);
  };

  // 本番日入力ダイアログ開閉
  const handleOpenDateDialog = () => {
    if (!saveKizaiHead) {
      setSaveOpen(true);
      return;
    }
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
          {/*-------受注ヘッダー-------*/}
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
          {/*-------受注機材ヘッダー-------*/}
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
                    <TextField
                      value={`¥${priceTotal.toLocaleString()}`}
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
                  <Grid2 width={300}>
                    <Typography>出庫日時</Typography>
                    <Grid2>
                      <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <Controller
                        name="kicsShukoDat"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateTime
                            date={field.value}
                            maxDate={
                              juchuHonbanbiList.length > 0 ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat) : undefined
                            }
                            onChange={handleKicsShukoChange}
                            onAccept={handleKicsShukoAccept}
                            fieldstate={fieldState}
                            disabled={!edit}
                            onClear={handleKicsClear}
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
                          <DateTime
                            date={field.value}
                            maxDate={
                              juchuHonbanbiList.length > 0 ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat) : undefined
                            }
                            onChange={handleYardShukoChange}
                            onAccept={handleYardShukoAccept}
                            fieldstate={fieldState}
                            disabled={!edit}
                            onClear={handleYardClear}
                          />
                        )}
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 width={300}>
                    <Typography>入庫日時</Typography>
                    <Grid2>
                      <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <Controller
                        name="kicsNyukoDat"
                        control={control}
                        render={({ field, fieldState }) => (
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
          </form>
          {/*-------受注明細(機材)-------*/}
          <Paper variant="outlined" sx={{ mt: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" py={1} px={2}>
              <Grid2 container direction="column" spacing={1}>
                <Typography>受注明細(機材)</Typography>
                <Typography fontSize={'small'}>機材入力</Typography>
              </Grid2>
            </Box>
            <Divider />

            <Dialog open={EqSelectionDialogOpen} fullScreen>
              <EqptSelectionDialog
                rank={props.juchuHeadData.kokyaku.kokyakuRank}
                setEqpts={setEqpts}
                handleCloseDialog={handleCloseEqDialog}
              />
            </Dialog>
            {isDetailLoading ? (
              <Loading />
            ) : (
              <>
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
                    <Box my={1} mx={2}>
                      <Button disabled={!edit} onClick={() => handleOpenEqDialog()}>
                        <AddIcon fontSize="small" />
                        機材追加
                      </Button>
                    </Box>
                    <Box
                      display={
                        Object.keys(juchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'
                      }
                    >
                      <EqTable
                        rows={juchuKizaiMeisaiList}
                        edit={edit}
                        onChange={handleCellChange}
                        handleMeisaiDelete={handleMeisaiDelete}
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
                  display={juchuContainerMeisaiList.filter((d) => !d.delFlag).length > 0 ? 'block' : 'none'}
                  py={2}
                  width={'fit-content'}
                >
                  <ContainerTable
                    rows={juchuContainerMeisaiList}
                    edit={edit}
                    handleContainerMemoChange={handleContainerMemoChange}
                    onChange={handleContainerCellChange}
                    handleMeisaiDelete={handleMeisaiDelete}
                  />
                </Box>
              </>
            )}
          </Paper>
          {/*-------本番日-------*/}
          <Paper variant="outlined" sx={{ my: 2 }}>
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
                    onClose={handleCloseDateDialog}
                    onSave={handleSave}
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
                <Grid2 size={6} maxWidth={408}>
                  <Typography>日付</Typography>
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
                          <Grid2 size={6} maxWidth={408}>
                            <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
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
                <Grid2 size={6} maxWidth={408}>
                  <Typography>日付</Typography>
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
                          <Grid2 size={6} maxWidth={408}>
                            <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
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
                <Grid2 size={6} maxWidth={408}>
                  <Typography>日付</Typography>
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
                          <Grid2 size={6} maxWidth={408}>
                            <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
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
                            <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
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
          <Fab color="primary" onClick={scrollTop} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
            <ArrowUpwardIcon fontSize="small" />
          </Fab>
          <SaveAlertDialog open={saveOpen} onClick={() => setSaveOpen(false)} />
          <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
          <MoveAlertDialog open={moveOpen} onClick={handleMoveDialog} />
          <NyushukoAlertDialog open={nyushukoOpen} onClick={() => setNyushukoOpen(false)} />
          <DeleteAlertDialog open={deleteOpen} onClick={handleMeisaiDeleteResult} />
          <NyushukoFixAlertDialog open={nyushukoFixOpen} onClick={() => setNyushukoFixOpen(false)} />
        </Box>
      )}
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
  // ボタン
  button: {},
};
