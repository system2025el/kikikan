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
import { use, useEffect, useRef, useState } from 'react';
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';
import { shouldDisplay } from 'rsuite/esm/internals/Picker';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, TestDate } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import Time, { TestTime } from '@/app/(main)/_ui/time';
import { GetNyukoDate, getRange, GetShukoDate } from '@/app/(main)/(eq-order-detail)/_lib/datefuncs';
import {
  AddHonbanbi,
  AddIdoDen,
  AddJuchuKizaiHead,
  AddJuchuKizaiMeisai,
  AddJuchuKizaiNyushuko,
  ConfirmHonbanbi,
  DeleteHonbanbi,
  DeleteIdoDen,
  DeleteJuchuKizaiMeisai,
  GetHonbanbi,
  GetIdoDenMaxId,
  GetJuchuKizaiHeadDspOrdNum,
  GetJuchuKizaiHeadMaxId,
  GetJuchuKizaiMeisai,
  GetJuchuKizaiMeisaiMaxId,
  GetStockList,
  UpdateHonbanbi,
  UpdateIdoDen,
  UpdateJuchuKizaiHead,
  UpdateJuchuKizaiMeisai,
  UpdateJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import { SelectedEqptsValues } from '@/app/(main)/(masters)/eqpt-master/_lib/types';
import { AddLock, DeleteLock, GetLock } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { LockValues, OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';

import {
  JuchuKizaiHeadSchema,
  JuchuKizaiHeadValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../_lib/types';
import { MoveAlertDialog, SaveAlertDialog } from './caveat-dialog';
import { DateSelectDialog } from './date-selection-dialog';
import { EqTable, StockTable } from './equipment-order-detail-table';
import { EqptSelectionDialog } from './equipment-selection-dailog';

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
  const saveKizaiHead = props.juchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;
  // 全体の保存フラグ
  const [save, setSave] = useState(false);

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
  // 受注本番日元データ
  const [originJuchuHonbanbiList, setOriginJuchuHonbanbiList] = useState<JuchuKizaiHonbanbiValues[]>(
    props.juchuHonbanbiData ? props.juchuHonbanbiData : []
  );
  // 受注本番日削除リスト
  const [juchuHonbanbiDeleteList, setJuchuHonbanbiDeleteList] = useState<JuchuKizaiHonbanbiValues[]>([]);
  // 受注機材明細元合計数
  const [originPlanQty, setOriginPlanQty] = useState<number[]>(originJuchuKizaiMeisaiList.map((data) => data.planQty));

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

  // 未保存ダイアログを出すかどうか
  const [saveOpen, setSaveOpen] = useState(false);
  // 移動日更新ダイアログを出すかどうか
  const [moveOpen, setMoveOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);
  // 日付選択カレンダーダイアログ制御
  const [dateSelectionDialogOpne, setDateSelectionDialogOpne] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // 合計金額
  const [priceTotal, setPriceTotal] = useState(
    juchuKizaiMeisaiList!.reduce(
      (sum, row) =>
        props.juchuKizaiHeadData.juchuHonbanbiQty !== null
          ? sum + row.kizaiTankaAmt * row.planKizaiQty * props.juchuKizaiHeadData.juchuHonbanbiQty
          : 0,
      0
    )
  );

  // context
  const { setIsDirty, setIsSave, setLock, setLockShubetu, setHeadId } = useDirty();

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
  useUnsavedChangesWarning(isDirty, save);

  /**
   * useEffect
   */
  useEffect(() => {
    setLockShubetu(1);
    setHeadId(props.juchuHeadData.juchuHeadId);
    setSave(saveKizaiHead);
    setIsSave(saveKizaiHead);

    if (juchuKizaiMeisaiList && juchuKizaiMeisaiList.length > 0 && eqStockList && eqStockList.length > 0) {
      const updatedEqStockData = eqStockList;
      const targetIndex = updatedEqStockData[0]
        .map((d, index) => (dateRangeRef.current.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
        .filter((index) => index !== -1);

      const subUpdatedEqStockList = updatedEqStockData.map((data, index) =>
        data.map((d, i) =>
          targetIndex.includes(i) ? { ...d, zaikoQty: d.zaikoQty - juchuKizaiMeisaiList[index].planQty } : d
        )
      );

      setEqStockList(subUpdatedEqStockList);
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
    const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);
    if (
      saveKizaiHead &&
      JSON.stringify(originJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originJuchuHonbanbiList) === JSON.stringify(juchuHonbanbiList)
    ) {
      setSave(true);
      setIsSave(true);
    } else {
      setSave(false);
      setIsSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [juchuKizaiMeisaiList, juchuHonbanbiList]);

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

  /**
   * 編集モード変更
   */
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

  /**
   * 保存ボタン押下時
   * @param data 受注機材ヘッダーデータ
   * @returns
   */
  const onSubmit = async (data: JuchuKizaiHeadValues) => {
    console.log('保存開始: ', data, eqStockList);
    if (!user) return;
    setIsLoading(true);
    // 新規
    if (data.juchuKizaiHeadId === 0) {
      const maxId = await GetJuchuKizaiHeadMaxId(data.juchuHeadId);
      const maxDspOrdNum = await GetJuchuKizaiHeadDspOrdNum();
      const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;
      const newDspOrdNum = maxDspOrdNum ? maxDspOrdNum.dsp_ord_num + 1 : 1;
      const headResult = await AddJuchuKizaiHead(newJuchuKizaiHeadId, data, 1, newDspOrdNum, user.name);
      const nyushukoResult = await AddJuchuKizaiNyushuko(newJuchuKizaiHeadId, data, user.name);
      if (headResult && nyushukoResult) {
        redirect(`/eq-main-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/edit`);
      }

      // 更新
    } else {
      // 受注機材ヘッド更新
      const headResult = await UpdateJuchuKizaiHead(data, user.name);
      // 受注機材入出庫更新
      const nyushukoResult = await UpdateJuchuKizaiNyushuko(data, user.name);

      // 受注機材本番日更新
      // 出庫日
      const updateShukoDate = GetShukoDate(
        data.kicsShukoDat && new Date(data.kicsShukoDat),
        data.yardShukoDat && new Date(data.yardShukoDat)
      );
      // 入庫日
      const updateNyukoDate = GetNyukoDate(
        data.kicsNyukoDat && new Date(data.kicsNyukoDat),
        data.yardNyukoDat && new Date(data.yardNyukoDat)
      );

      if (shukoDate && nyukoDate) {
        const deleteJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
          {
            juchuHeadId: data.juchuHeadId,
            juchuKizaiHeadId: data.juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 2,
            juchuHonbanbiDat: shukoDate,
            mem: '',
            juchuHonbanbiAddQty: 0,
          },
          {
            juchuHeadId: data.juchuHeadId,
            juchuKizaiHeadId: data.juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 3,
            juchuHonbanbiDat: nyukoDate,
            mem: '',
            juchuHonbanbiAddQty: 0,
          },
        ];
        const margeDeleteJuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
          ...deleteJuchuHonbanbiData,
          ...juchuHonbanbiDeleteList,
        ];
        for (const item of margeDeleteJuchuHonbanbiData) {
          const result = await DeleteHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, item);
        }
      }
      if (updateShukoDate && updateNyukoDate) {
        const updatedjuchuHonbanbiData: JuchuKizaiHonbanbiValues[] = [
          {
            juchuHeadId: data.juchuHeadId,
            juchuKizaiHeadId: data.juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 2,
            juchuHonbanbiDat: updateShukoDate,
            mem: '',
            juchuHonbanbiAddQty: 0,
          },
          {
            juchuHeadId: data.juchuHeadId,
            juchuKizaiHeadId: data.juchuKizaiHeadId,
            juchuHonbanbiShubetuId: 3,
            juchuHonbanbiDat: updateNyukoDate,
            mem: '',
            juchuHonbanbiAddQty: 0,
          },
        ];
        const margeJuchuHonbanbiData = [...updatedjuchuHonbanbiData, ...juchuHonbanbiList];
        for (const item of margeJuchuHonbanbiData) {
          const confirm = await ConfirmHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, item);
          if (confirm) {
            const result = await UpdateHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, item, user.name);
          } else {
            const result = await AddHonbanbi(data.juchuHeadId, data.juchuKizaiHeadId, item, user.name);
          }
        }
      }

      if (juchuKizaiMeisaiList.length > 0) {
        const copyJuchuKizaiMeisaiData = [...juchuKizaiMeisaiList];
        const juchuKizaiMeisaiMaxId = await GetJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
        const newJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;
        const newJuchuKizaiMeisaiData = copyJuchuKizaiMeisaiData.map((data, index) =>
          data.juchuKizaiMeisaiId === 0
            ? {
                ...data,
                juchuKizaiMeisaiId: newJuchuKizaiMeisaiId + index,
              }
            : data
        );

        // 受注機材明細更新
        const addJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
        const updateJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => !data.delFlag && data.saveFlag);
        const deleteJuchuKizaiMeisaiData = newJuchuKizaiMeisaiData.filter((data) => data.delFlag && data.saveFlag);
        if (deleteJuchuKizaiMeisaiData.length > 0) {
          const deleteJuchuKizaiMeisaiIds = deleteJuchuKizaiMeisaiData.map((data) => data.juchuKizaiMeisaiId);
          const result = await DeleteJuchuKizaiMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            deleteJuchuKizaiMeisaiIds
          );
        }

        if (addJuchuKizaiMeisaiData.length > 0) {
          const result = AddJuchuKizaiMeisai(addJuchuKizaiMeisaiData, user.name);
        }

        if (updateJuchuKizaiMeisaiData.length > 0) {
          const result = await UpdateJuchuKizaiMeisai(updateJuchuKizaiMeisaiData, user.name);
          console.log('UPD Result :', result);
        }

        // 移動伝票更新
        const addIdoKizaiData = newJuchuKizaiMeisaiData.filter(
          (data) => !data.idoDenId && data.idoDenDat && !data.delFlag
        );
        const updateIdoKizaiData = newJuchuKizaiMeisaiData.filter(
          (data) => data.idoDenId && data.idoDenDat && !data.delFlag
        );
        const deleteIdoKizaiData = newJuchuKizaiMeisaiData.filter(
          (data) => data.idoDenId && (!data.idoDenDat || data.delFlag)
        );
        if (deleteIdoKizaiData.length > 0) {
          const deleteIdoDenIds = deleteIdoKizaiData.map((data) => data.idoDenId);
          const result = await DeleteIdoDen(deleteIdoDenIds as number[]);
        }

        if (addIdoKizaiData.length > 0) {
          const idoDenMaxId = await GetIdoDenMaxId();
          const newIdoDenId = idoDenMaxId ? idoDenMaxId.ido_den_id + 1 : 1;
          const result = await AddIdoDen(newIdoDenId, addIdoKizaiData, user.name);
        }

        if (updateIdoKizaiData.length > 0) {
          const result = await UpdateIdoDen(updateIdoKizaiData, user.name);
        }
      }

      // データ更新
      reset(data);

      setShukoDate(updateShukoDate);
      setSelectDate(updateShukoDate ? updateShukoDate : new Date());
      setNyukoDate(updateNyukoDate);

      setOriginJuchuHonbanbiList(juchuHonbanbiList);
      setJuchuHonbanbiDeleteList([]);

      const juchuKizaiMeisaiData = await GetJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId);
      if (juchuKizaiMeisaiData) {
        setJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
        setOriginJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
        setOriginPlanQty(juchuKizaiMeisaiData.map((data) => data.planQty));
        // 出庫日から入庫日
        const updateDateRange = getRange(updateShukoDate, updateNyukoDate);
        setDateRange(updateDateRange);
        // 受注機材idリスト
        const ids = juchuKizaiMeisaiData.map((data) => data.kizaiId);
        // 受注機材合計数リスト
        const planQtys = juchuKizaiMeisaiData.map((data) => data.planQty);
        // 機材在庫データ
        const updatedEqStockData: StockTableValues[][] = [];
        if (ids && planQtys) {
          if (!updateShukoDate) return <div>データに不備があります。</div>;
          for (let i = 0; i < ids.length; i++) {
            const stock: StockTableValues[] = await GetStockList(
              data.juchuHeadId,
              data.juchuKizaiHeadId,
              ids[i],
              planQtys[i],
              subDays(updateShukoDate, 1)
            );
            updatedEqStockData.push(stock);
          }
        }
        if (
          juchuKizaiMeisaiData &&
          juchuKizaiMeisaiData.length > 0 &&
          updatedEqStockData &&
          updatedEqStockData.length > 0
        ) {
          const targetIndex = updatedEqStockData[0]
            .map((d, index) => (dateRangeRef.current.includes(toISOStringYearMonthDay(d.calDat)) ? index : -1))
            .filter((index) => index !== -1);
          const subUpdatedEqStockData = updatedEqStockData.map((data, index) =>
            data.map((d, i) =>
              targetIndex.includes(i) ? { ...d, zaikoQty: d.zaikoQty - juchuKizaiMeisaiData[index].planQty } : d
            )
          );
          setEqStockList(subUpdatedEqStockData);
        }
      }
      setIsLoading(false);
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
   * 日付選択カレンダー選択時
   * @param date カレンダー選択日付
   */
  const handleDateChange = async (date: Dayjs | null) => {
    if (date !== null) {
      setSelectDate(date.toDate());
      const filterJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => !data.delFlag);

      // 受注機材idリスト
      const ids = filterJuchuKizaiMeisaiList.map((data) => data.kizaiId);

      // 機材在庫データ
      const updatedEqStockData: StockTableValues[][] = [];
      if (ids) {
        for (let i = 0; i < ids.length; i++) {
          const stock: StockTableValues[] = await GetStockList(
            props.juchuHeadData.juchuHeadId,
            getValues('juchuKizaiHeadId'),
            ids[i],
            originPlanQty[i],
            subDays(date.toDate(), 1)
          );
          updatedEqStockData.push(stock);
        }
      }

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
            targetIndex.includes(i) ? { ...d, zaikoQty: d.zaikoQty - filterJuchuKizaiMeisaiList[index].planQty } : d
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
   * 機材テーブルの移動日時の×ボタン押下時
   * @param kizaiId 機材id
   */
  const handleCellDateClear = (kizaiId: number) => {
    setJuchuKizaiMeisaiList((prev) => prev.map((row) => (row.kizaiId === kizaiId ? { ...row, idoDenDat: null } : row)));
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
    const kizaiQty = juchuKizaiMeisaiList.find((data) => data.kizaiId === kizaiId)?.planQty || 0;
    console.log(juchuKizaiMeisaiList);
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
    const updatedJuchukizaiMeisaiData = [...juchuKizaiMeisaiList];
    const targetJuchukizaiMeisaiData = updatedJuchukizaiMeisaiData
      .filter((data) => !data.delFlag)
      .find((data) => data.kizaiId === kizaiId);
    if (targetJuchukizaiMeisaiData) targetJuchukizaiMeisaiData.planKizaiQty = planKizaiQty;
    const updatedPriceTotal = updatedJuchukizaiMeisaiData
      .filter((data) => !data.delFlag)
      .reduce(
        (sum, row) =>
          getValues('juchuHonbanbiQty') !== null
            ? sum + row.kizaiTankaAmt * row.planKizaiQty * (getValues('juchuHonbanbiQty') ?? 0)
            : 0,
        0
      );
    setPriceTotal(updatedPriceTotal);
    setJuchuKizaiMeisaiList((prev) =>
      prev.map((data) =>
        data.kizaiId === kizaiId
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
    const rowIndex = juchuKizaiMeisaiList.findIndex((data) => data.kizaiId === kizaiId);
    const updatedJuchuKizaiMeisaiList = juchuKizaiMeisaiList.filter((data) => data.kizaiId !== kizaiId);
    setJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId ? { ...data, delFlag: true } : data))
    );
    setEqStockList((prev) => prev.map((data) => data.filter((d) => d.kizaiId !== kizaiId)));
    setOriginPlanQty((prev) => prev.filter((_, index) => index !== rowIndex));
    setPriceTotal(
      updatedJuchuKizaiMeisaiList.reduce((sum, row) => (!row.delFlag ? sum + (row.kizaiTankaAmt ?? 0) : 0), 0)
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
        prev.map((row) => (row.kizaiId === kizaiId ? { ...row, idoDenDat: newDate } : row))
      );
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

    if (juchuKizaiMeisaiList.length > 0 && yardShukoDat === null) {
      setIdoDat(subDays(newDate.toDate(), 2));
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && yardShukoDat !== null) {
      setIdoDat(null);
      setMoveOpen(true);
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

    if (juchuKizaiMeisaiList.length > 0 && kicsShukoDat === null) {
      setIdoDat(subDays(newDate.toDate(), 2));
      setMoveOpen(true);
    } else if (juchuKizaiMeisaiList.length > 0 && kicsShukoDat !== null) {
      setIdoDat(null);
      setMoveOpen(true);
    }
  };

  /**
   * KICS入庫日時変更時
   * @param newDate KICS入庫日
   */
  const handleKicsNyukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsNyukoDat', newDate.toDate(), { shouldDirty: true });
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
   * KICS出庫日時クリアボタン押下時
   */
  const handleKicsClear = () => {
    setValue('kicsShukoDat', null, { shouldDirty: true });
    const yardDat = getValues('yardShukoDat');
    if (juchuKizaiMeisaiList.length > 0 && yardDat !== null) {
      setIdoDat(subDays(yardDat, 2));
      setMoveOpen(true);
    }
  };

  /**
   * YARD出庫日時クリアボタン押下時
   */
  const handleYardClear = () => {
    setValue('yardShukoDat', null, { shouldDirty: true });
    const kicsDat = getValues('kicsShukoDat');
    if (juchuKizaiMeisaiList.length > 0 && kicsDat !== null) {
      setIdoDat(subDays(kicsDat, 2));
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
          prev.map((row) => (row.shozokuId === 2 ? { ...row, idoDenDat: idoDat } : row))
        );
        setIdoDat(null);
        setMoveOpen(false);
      } else if (idoDat !== null && getValues('kicsShukoDat') === null) {
        setJuchuKizaiMeisaiList((prev) =>
          prev.map((row) => (row.shozokuId === 1 ? { ...row, idoDenDat: idoDat } : row))
        );
        setIdoDat(null);
        setMoveOpen(false);
      } else {
        setJuchuKizaiMeisaiList((prev) => prev.map((row) => ({ ...row, idoDenDat: idoDat })));
        setMoveOpen(false);
      }
    } else {
      setMoveOpen(false);
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
    const addHonbanbiQty = updatedHonbanbiList.reduce((sum, data) => sum + data.juchuHonbanbiAddQty, 0);
    const updatedJuchuHonbanbiQty = honbanbiQty + addHonbanbiQty;
    const updatedPriceTotal = juchuKizaiMeisaiList
      .filter((data) => !data.delFlag)
      .reduce((sum, row) => sum + row.kizaiTankaAmt * row.planKizaiQty * updatedJuchuHonbanbiQty, 0);

    setValue('juchuHonbanbiQty', updatedJuchuHonbanbiQty);
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
    const kicsDat = getValues('kicsShukoDat');
    const yardDat = getValues('yardShukoDat');
    const kicsIdoDat = kicsDat === null && yardDat !== null ? subDays(yardDat, 2) : null;
    const yardIdoDat = yardDat === null && kicsDat !== null ? subDays(kicsDat, 2) : null;
    const ids = new Set(juchuKizaiMeisaiList.filter((data) => !data.delFlag).map((data) => data.kizaiId));
    const filterData = data.filter((d) => !ids.has(d.kizaiId));
    const selectEq: JuchuKizaiMeisaiValues[] = filterData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
      juchuKizaiMeisaiId: 0,
      idoDenId: null,
      idoDenDat:
        d.shozokuId === 1 && kicsIdoDat !== null
          ? kicsIdoDat
          : d.shozokuId === 2 && yardIdoDat !== null
            ? yardIdoDat
            : null,
      idoSijiId:
        d.shozokuId === 1 && kicsIdoDat !== null ? 'K→Y' : d.shozokuId === 2 && yardIdoDat !== null ? 'Y→K' : null,
      shozokuId: d.shozokuId,
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
    const newPlanQtys = selectEq.map((data) => data.planQty);
    // 機材在庫データ
    const selectEqStockData: StockTableValues[][] = [];
    for (let i = 0; i < newIds.length; i++) {
      const stock: StockTableValues[] = await GetStockList(
        getValues('juchuHeadId'),
        getValues('juchuKizaiHeadId'),
        newIds[i],
        0,
        subDays(selectDate, 1)
      );
      selectEqStockData.push(stock);
    }
    setJuchuKizaiMeisaiList((prev) => [...prev, ...selectEq]);
    setEqStockList((prev) => [...prev, ...selectEqStockData]);
    setOriginPlanQty((prev) => [...prev, ...newPlanQtys]);
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
                <TextField
                  value={priceTotal}
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
                  disabled
                />
                <Typography>円</Typography>
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
                          juchuHonbanbiList.length > 0
                            ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat)
                            : nyukoDate
                              ? nyukoDate
                              : undefined
                        }
                        onChange={handleKicsShukoChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={handleKicsClear}
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
                          juchuHonbanbiList.length > 0
                            ? new Date(juchuHonbanbiList[0].juchuHonbanbiDat)
                            : nyukoDate
                              ? nyukoDate
                              : undefined
                        }
                        onChange={handleYardShukoChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={handleYardClear}
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
                            : shukoDate
                              ? shukoDate
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
                            : shukoDate
                              ? shukoDate
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
              <Grid2 container alignItems="center" py={1}>
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
              <Grid2 container alignItems="center">
                <Typography>入出庫ステータス</Typography>
                <TextField disabled defaultValue={'準備中'}></TextField>
              </Grid2>
            </Grid2>
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
            <Box display={Object.keys(juchuKizaiMeisaiList).length > 0 ? 'block' : 'none'}>
              <EqTable
                rows={juchuKizaiMeisaiList}
                edit={edit}
                onChange={handleCellChange}
                handleDelete={handleDelete}
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
            <StockTable
              eqStockList={eqStockList}
              dateRange={dateRange}
              juchuHonbanbiList={juchuHonbanbiList}
              ref={rightRef}
            />
          </Box>
        </Box>
      </Paper>
      {/*-------本番日-------*/}
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
                juchuHonbanbiDeleteList={juchuHonbanbiDeleteList}
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
                      <Grid2 display={'flex'} size={5}>
                        <Typography>{toISOStringYearMonthDay(data.juchuHonbanbiDat)}</Typography>
                        <Typography ml={2}>{data.juchuHonbanbiAddQty}</Typography>
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
      <MoveAlertDialog open={moveOpen} onClick={handleMoveDialog} />
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
