'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
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
  MenuItem,
  Paper,
  Popper,
  Select,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { addLock, delLock, getLock } from '@/app/(main)/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, DateTime, TestDate } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import {
  DetailOerValues,
  OyaJuchuContainerMeisaiValues,
  OyaJuchuKizaiMeisaiValues,
  OyaJuchuKizaiNyushukoValues,
} from '@/app/(main)/(eq-order-detail)/_lib/types';
import { AlertDialog, DeleteAlertDialog } from '@/app/(main)/(eq-order-detail)/_ui/caveat-dialog';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import { JuchuContainerMeisaiValues } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import {
  getKeepJuchuContainerMeisai,
  getKeepJuchuKizaiMeisai,
  saveKeepJuchuKizai,
  saveNewKeepJuchuKizaiHead,
} from '../_lib/funcs';
import {
  KeepJuchuContainerMeisaiValues,
  KeepJuchuKizaiHeadSchema,
  KeepJuchuKizaiHeadValues,
  KeepJuchuKizaiMeisaiValues,
} from '../_lib/types';
import { KeepContainerTable, KeepEqTable } from './equipment-keep-order-detail-table';

export const EquipmentKeepOrderDetail = (props: {
  juchuHeadData: DetailOerValues;
  oyaJuchuKizaiHeadData: OyaJuchuKizaiNyushukoValues;
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues;
  // keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] | undefined;
  // keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[] | undefined;
  oyaShukoDate: Date;
  oyaNyukoDate: Date;
  // keepShukoDate: Date | null;
  // keepNyukoDate: Date | null;
  edit: boolean;
  shukoFixFlag: boolean;
  nyukoFixFlag: boolean;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.keepJuchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;
  // 出庫フラグ
  const shukoFixFlag = props.shukoFixFlag;
  // 入庫フラグ
  const nyukoFixFlag = props.nyukoFixFlag;
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);

  // 受注機材ヘッダー以外の編集フラグ
  const [otherDirty, setOtherDirty] = useState(false);

  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 機材明細ローディング
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);

  // キープ受注機材明細元リスト
  const [originKeepJuchuKizaiMeisaiList, setOriginKeepJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>(
    /*props.keepJuchuKizaiMeisaiData ??*/ []
  );
  // キープ受注機材明細リスト
  const [keepJuchuKizaiMeisaiList, setKeepJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>(
    /*props.keepJuchuKizaiMeisaiData ??*/ []
  );
  // キープ受注コンテナ明細元リスト
  const [originKeepJuchuContainerMeisaiList, setOriginKeepJuchuContainerMeisaiList] = useState<
    KeepJuchuContainerMeisaiValues[]
  >(/*props.keepJuchuContainerMeisaiData ??*/ []);
  // キープ受注コンテナ明細リスト
  const [keepJuchuContainerMeisaiList, setKeepJuchuContainerMeisaiList] = useState<KeepJuchuContainerMeisaiValues[]>(
    /*props.keepJuchuContainerMeisaiData ??*/ []
  );
  // 削除機材
  const [deleteEqIndex, setDeleteEqIndex] = useState<number | null>(null);
  // 削除コンテナ
  const [deleteCtnIndex, setDeleteCtnIndex] = useState<number | null>(null);

  // 親出庫日
  const [oyaShukoDate, setShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
  // キープ出庫日
  const [keepShukoDate, setKeepShukoDate] = useState<Date | null>(/*props.keepShukoDate*/ null);
  // キープ入庫日
  const [keepNyukoDate, setKeepNyukoDate] = useState<Date | null>(/*props.keepNyukoDate*/ null);

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

  // context
  const { setIsDirty, setLock } = useDirty();

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
      juchuHeadId: props.keepJuchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.keepJuchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.keepJuchuKizaiHeadData.juchuKizaiHeadKbn,
      mem: props.keepJuchuKizaiHeadData.mem,
      headNam: props.keepJuchuKizaiHeadData.headNam,
      oyaJuchuKizaiHeadId: props.keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId,
      kicsShukoDat: props.keepJuchuKizaiHeadData.kicsShukoDat
        ? new Date(props.keepJuchuKizaiHeadData.kicsShukoDat)
        : null,
      kicsNyukoDat: props.keepJuchuKizaiHeadData.kicsNyukoDat
        ? new Date(props.keepJuchuKizaiHeadData.kicsNyukoDat)
        : null,
      yardShukoDat: props.keepJuchuKizaiHeadData.yardShukoDat
        ? new Date(props.keepJuchuKizaiHeadData.yardShukoDat)
        : null,
      yardNyukoDat: props.keepJuchuKizaiHeadData.yardNyukoDat
        ? new Date(props.keepJuchuKizaiHeadData.yardNyukoDat)
        : null,
    },
    resolver: zodResolver(KeepJuchuKizaiHeadSchema),
  });

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

      // キープ受注機材明細データ
      const juchuKizaiMeisaiData = await getKeepJuchuKizaiMeisai(
        juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadData.juchuKizaiHeadId,
        juchuKizaiHeadData.oyaJuchuKizaiHeadId
      );

      // キープ受注コンテナ明細データ
      const keepJuchuContainerMeisaiData = await getKeepJuchuContainerMeisai(
        juchuKizaiHeadData.juchuHeadId,
        juchuKizaiHeadData.juchuKizaiHeadId,
        juchuKizaiHeadData.oyaJuchuKizaiHeadId
      );

      // キープ出庫日
      const keepShukoDate = getShukoDate(
        juchuKizaiHeadData.kicsShukoDat && new Date(juchuKizaiHeadData.kicsShukoDat),
        juchuKizaiHeadData.yardShukoDat && new Date(juchuKizaiHeadData.yardShukoDat)
      );
      // キープ入庫日
      const keepNyukoDate = getNyukoDate(
        juchuKizaiHeadData.kicsNyukoDat && new Date(juchuKizaiHeadData.kicsNyukoDat),
        juchuKizaiHeadData.yardNyukoDat && new Date(juchuKizaiHeadData.yardNyukoDat)
      );

      setOriginKeepJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
      setKeepJuchuKizaiMeisaiList(juchuKizaiMeisaiData);
      setOriginKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData);
      setKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData);
      setKeepShukoDate(keepShukoDate);
      setKeepNyukoDate(keepNyukoDate);

      setIsDetailLoading(false);
    };
    if (saveKizaiHead) {
      getData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const asyncProcess = async () => {
      if (!user || !props.edit) return;

      setIsLoading(true);
      const lockData = await getLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (lockData === null) {
        await addLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await getLock(1, props.juchuHeadData.juchuHeadId);
        setLockData(newLockData);
      } else if (lockData !== null && lockData.addUser !== user.name) {
        setEdit(false);
      }
      setIsLoading(false);
    };
    asyncProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const dirty = isDirty || otherDirty ? true : false;
    setIsDirty(dirty);
  }, [isDirty, otherDirty, setIsDirty]);

  useEffect(() => {
    const filterJuchuKizaiMeisaiList = keepJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const filterJuchuContainerMeisaiList = keepJuchuContainerMeisaiList.filter((data) => !data.delFlag);
    if (
      JSON.stringify(originKeepJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originKeepJuchuContainerMeisaiList) === JSON.stringify(filterJuchuContainerMeisaiList)
    ) {
      setOtherDirty(false);
    } else {
      setOtherDirty(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepJuchuKizaiMeisaiList, keepJuchuContainerMeisaiList]);

  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  /**
   * 編集モード変更
   */
  const handleEdit = async () => {
    // 編集→閲覧
    if (edit) {
      const filterJuchuKizaiMeisaiList = keepJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
      const filterJuchuContainerMeisaiList = keepJuchuContainerMeisaiList.filter((data) => !data.delFlag);
      if (
        isDirty ||
        JSON.stringify(originKeepJuchuKizaiMeisaiList) !== JSON.stringify(filterJuchuKizaiMeisaiList) ||
        JSON.stringify(originKeepJuchuContainerMeisaiList) !== JSON.stringify(filterJuchuContainerMeisaiList)
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
  const onSubmit = async (data: KeepJuchuKizaiHeadValues) => {
    console.log('保存開始', data);
    if (!user) return;
    setIsLoading(true);

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

    if (!updateNyukoDate) {
      setIsLoading(false);
      return;
    }

    // 新規
    if (data.juchuKizaiHeadId === 0) {
      // 新規受注機材ヘッダー追加
      const newJuchuKizaiHeadId = await saveNewKeepJuchuKizaiHead(data, userNam);

      if (newJuchuKizaiHeadId) {
        router.push(
          `/eq-keep-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/${data.oyaJuchuKizaiHeadId}/edit`
        );
      } else {
        console.log('保存失敗');
      }

      // 更新
    } else {
      const kicsMeisai = keepJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 1 && !d.delFlag);
      const yardMeisai = keepJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 2 && !d.delFlag);
      const kicsContainer = keepJuchuContainerMeisaiList.filter((d) => d.kicsKeepQty && !d.delFlag);
      const yardContainer = keepJuchuContainerMeisaiList.filter((d) => d.yardKeepQty && !d.delFlag);

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
        return;
      }

      // 更新判定
      const checkJuchuKizaiHead = isDirty;
      const checkKicsShukoDat = dirtyFields.kicsShukoDat ? true : false;
      const checkKicsNyukoDat = dirtyFields.kicsNyukoDat ? true : false;
      const checkYardShukoDat = dirtyFields.yardShukoDat ? true : false;
      const checkYardNyukoDat = dirtyFields.yardNyukoDat ? true : false;
      const checkJuchuKizaiMeisai =
        JSON.stringify(originKeepJuchuKizaiMeisaiList) !==
        JSON.stringify(keepJuchuKizaiMeisaiList.filter((data) => !data.delFlag));
      const checkJuchuContainerMeisai =
        JSON.stringify(originKeepJuchuContainerMeisaiList) !==
        JSON.stringify(keepJuchuContainerMeisaiList.filter((data) => !data.delFlag));

      const updateResult = await saveKeepJuchuKizai(
        checkJuchuKizaiHead,
        checkKicsShukoDat,
        checkKicsNyukoDat,
        checkYardShukoDat,
        checkYardNyukoDat,
        checkJuchuKizaiMeisai,
        checkJuchuContainerMeisai,
        defaultValues?.kicsShukoDat,
        defaultValues?.kicsNyukoDat,
        defaultValues?.yardShukoDat,
        defaultValues?.yardNyukoDat,
        data,
        updateShukoDate,
        updateNyukoDate,
        keepJuchuKizaiMeisaiList,
        keepJuchuContainerMeisaiList,
        userNam
      );

      // 画面情報更新
      if (updateResult) {
        if (checkJuchuKizaiHead) {
          reset(data);
          // 出庫日更新
          setKeepShukoDate(updateShukoDate);
          // 入庫日更新
          setKeepNyukoDate(updateNyukoDate);
        }

        if (checkJuchuKizaiMeisai) {
          // 受注機材明細
          const keepJuchuKizaiMeisaiData = await getKeepJuchuKizaiMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            data.oyaJuchuKizaiHeadId
          );
          if (keepJuchuKizaiMeisaiData) {
            setKeepJuchuKizaiMeisaiList(keepJuchuKizaiMeisaiData);
            setOriginKeepJuchuKizaiMeisaiList(keepJuchuKizaiMeisaiData);
          }
        }

        if (checkJuchuContainerMeisai) {
          const keepJuchuContainerMeisaiData = await getKeepJuchuContainerMeisai(
            data.juchuHeadId,
            data.juchuKizaiHeadId,
            data.oyaJuchuKizaiHeadId
          );
          setOriginKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData ?? []);
          setKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData ?? []);
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
  };

  /**
   * 機材キープメモ入力時
   * @param rowIndex 入力された行番号
   * @param memo キープメモ内容
   */
  const handleMemoChange = (rowIndex: number, memo: string) => {
    setKeepJuchuKizaiMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) => (i === index ? { ...data, mem: memo } : data));
    });
  };

  /**
   * 機材テーブルのキープ数入力時
   * @param kizaiId 機材id
   * @param keepValue キープ数
   */
  const handleCellChange = (rowIndex: number, keepValue: number) => {
    setKeepJuchuKizaiMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) => (i === index ? { ...data, keepQty: keepValue } : data));
    });
  };

  // 機材明細削除ボタン押下時
  const handleEqMeisaiDelete = (rowIndex: number) => {
    setDeleteEqOpen(true);
    setDeleteEqIndex(rowIndex);
  };

  // 機材明細削除ダイアログの押下ボタンによる処理
  const handleEqMeisaiDeleteResult = (result: boolean) => {
    setDeleteEqOpen(false);
    if (deleteEqIndex === null) return;

    if (result) {
      setKeepJuchuKizaiMeisaiList((prev) => {
        const visibleIndex = prev
          .map((data, index) => (!data.delFlag ? index : null))
          .filter((index) => index !== null) as number[];

        const index = visibleIndex[deleteEqIndex];
        if (index === undefined) return prev;

        return prev.map((data, i) => (i === index ? { ...data, delFlag: true } : data));
      });
      setDeleteEqIndex(null);
    } else {
      setDeleteEqOpen(false);
      setDeleteEqIndex(null);
    }
  };

  /**
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleKeepContainerMemoChange = (rowIndex: number, memo: string) => {
    setKeepJuchuContainerMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) => (i === index ? { ...data, mem: memo } : data));
    });
  };

  /**
   * コンテナテーブル使用数入力時
   * @param kizaiId 機材id
   * @param kicsKeepQty KICSコンテナ数
   * @param yardKeepQty YARDコンテナ数
   */
  const handleKeepContainerCellChange = (rowIndex: number, kicsKeepQty: number, yardKeepQty: number) => {
    setKeepJuchuContainerMeisaiList((prev) => {
      const visibleIndex = prev
        .map((data, index) => (!data.delFlag ? index : null))
        .filter((index) => index !== null) as number[];

      const index = visibleIndex[rowIndex];
      if (index === undefined) return prev;

      return prev.map((data, i) =>
        i === index ? { ...data, kicsKeepQty: kicsKeepQty, yardKeepQty: yardKeepQty } : data
      );
    });
  };

  // コンテナ明細削除ボタン押下時
  const handleCtnMeisaiDelete = (rowIndex: number) => {
    setDeleteCtnOpen(true);
    setDeleteCtnIndex(rowIndex);
  };

  // コンテナ明細削除ダイアログの押下ボタンによる処理
  const handleCtnMeisaiDeleteResult = (result: boolean) => {
    setDeleteCtnOpen(false);
    if (deleteCtnIndex === null) return;

    if (result) {
      setKeepJuchuContainerMeisaiList((prev) => {
        const visibleIndex = prev
          .map((data, index) => (!data.delFlag ? index : null))
          .filter((index) => index !== null) as number[];

        const index = visibleIndex[deleteCtnIndex];
        console.log(index);
        if (index === undefined) return prev;

        return prev.map((data, i) => (i === index ? { ...data, delFlag: true } : data));
      });
      setDeleteCtnIndex(null);
    } else {
      setDeleteCtnOpen(false);
      setDeleteCtnIndex(null);
    }
  };

  /**
   * KICS出庫日変更時
   * @param newDate KICS出庫日
   */
  const handleKicsShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsShukoDat', newDate.toDate(), { shouldDirty: true });
  };

  // /**
  //  * KICS出庫日確定時
  //  * @param newDate KICS出庫日
  //  */
  // const handleKicsShukoAccept = async (newDate: Dayjs | null) => {
  //   if (newDate === null) return;
  //   trigger(['kicsShukoDat', 'yardShukoDat']);

  //   const yardShukoDat = getValues('yardShukoDat');

  //   if (yardShukoDat === null) {
  //     clearErrors('yardShukoDat');
  //   }
  // };

  /**
   * YARD出庫日変更時
   * @param newDate YARD出庫日
   */
  const handleYardShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('yardShukoDat', newDate.toDate(), { shouldDirty: true });
  };

  // /**
  //  * YARD出庫日確定時
  //  * @param newDate YARD出庫日
  //  */
  // const handleYardShukoAccept = async (newDate: Dayjs | null) => {
  //   if (newDate === null) return;
  //   trigger(['kicsShukoDat', 'yardShukoDat']);

  //   const kicsShukoDat = getValues('kicsShukoDat');

  //   if (kicsShukoDat === null) {
  //     clearErrors('kicsShukoDat');
  //   }
  // };

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
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (eqData: OyaJuchuKizaiMeisaiValues[], containerData: OyaJuchuContainerMeisaiValues[]) => {
    // 同じ並び順のものははじくようにする
    const dspOrdNums = new Set(keepJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.dspOrdNum));
    const filterEqData = eqData.filter((d) => !dspOrdNums.has(d.dspOrdNum));
    const newOyaJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = filterEqData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
      juchuKizaiMeisaiId: 0,
      shozokuId: d.shozokuId,
      shozokuNam: d.shozokuNam,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      oyaPlanKizaiQty: d.planKizaiQty,
      oyaPlanYobiQty: d.planYobiQty,
      keepQty: 0,
      dspOrdNum: d.dspOrdNum,
      indentNum: d.indentNum,
      delFlag: false,
      saveFlag: false,
    }));

    const containerIds = new Set(keepJuchuContainerMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterContainerData = containerData.filter((d) => !containerIds.has(d.kizaiId));
    const newKeepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[] = filterContainerData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
      juchuKizaiMeisaiId: 0,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      oyaPlanKicsKizaiQty: d.planKicsKizaiQty,
      oyaPlanYardKizaiQty: d.planYardKizaiQty,
      kicsKeepQty: 0,
      yardKeepQty: 0,
      dspOrdNum: d.dspOrdNum,
      indentNum: d.indentNum,
      delFlag: false,
      saveFlag: false,
    }));

    setKeepJuchuKizaiMeisaiList((prev) =>
      [...prev, ...newOyaJuchuKizaiMeisaiData].sort((a, b) => a.dspOrdNum - b.dspOrdNum)
    );
    setKeepJuchuContainerMeisaiList((prev) =>
      [...prev, ...newKeepJuchuContainerMeisaiData].sort((a, b) => a.dspOrdNum - b.dspOrdNum)
    );
  };

  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = () => {
    setEqSelectionDialogOpen(true);
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
      setKeepJuchuKizaiMeisaiList(originKeepJuchuKizaiMeisaiList);
      setKeepJuchuContainerMeisaiList(originKeepJuchuContainerMeisaiList);
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
    }
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
        <Container disableGutters sx={{ minWidth: '100%', pb: 10 }} maxWidth={'xl'}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box display={'flex'} justifyContent={'end'} mb={1}>
              <Grid2 container spacing={4}>
                {lockData !== null && lockData.addUser !== user?.name && (
                  <Grid2 container alignItems={'center'} spacing={2}>
                    <Typography>{lockData.addDat && toJapanTimeString(new Date(lockData.addDat))}</Typography>
                    <Typography>{lockData.addUser}</Typography>
                    <Typography>編集中</Typography>
                  </Grid2>
                )}
                {shukoFixFlag ? (
                  <Box display={'flex'} alignItems={'center'}>
                    <Typography>出庫済</Typography>
                  </Box>
                ) : nyukoFixFlag ? (
                  <Box display={'flex'} alignItems={'center'}>
                    <Typography>入庫済</Typography>
                  </Box>
                ) : (
                  <></>
                )}
                <Grid2 container alignItems={'center'} spacing={1}>
                  {!edit || (lockData !== null && lockData?.addUser !== user?.name) || shukoFixFlag ? (
                    <Typography>閲覧モード</Typography>
                  ) : (
                    <Typography>編集モード</Typography>
                  )}
                  <Button
                    disabled={(lockData && lockData?.addUser !== user?.name ? true : false) || shukoFixFlag}
                    onClick={handleEdit}
                  >
                    変更
                  </Button>
                </Grid2>
                <BackButton label={'戻る'} />
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
                          <TextField defaultValue={props.juchuHeadData.juchuHeadId} disabled></TextField>
                        </Grid2>
                        <Grid2 display="flex" direction="row" alignItems="center">
                          <Typography mr={2}>受注ステータス</Typography>
                          <Select value={props.juchuHeadData.juchuSts} disabled>
                            <MenuItem value={0}>入力中</MenuItem>
                            <MenuItem value={1}>仮受注</MenuItem>
                            <MenuItem value={2}>処理中</MenuItem>
                            <MenuItem value={3}>確定</MenuItem>
                            <MenuItem value={4}>貸出済み</MenuItem>
                            <MenuItem value={5}>返却済み</MenuItem>
                            <MenuItem value={9}>受注キャンセル</MenuItem>
                          </Select>
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
                      <TextField defaultValue={props.juchuHeadData.nyuryokuUser} disabled></TextField>
                    </Box>
                  </Grid2>
                  <Grid2>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                      <Typography marginRight={5} whiteSpace="nowrap">
                        公演名
                      </Typography>
                      <TextField defaultValue={props.juchuHeadData.koenNam} disabled></TextField>
                    </Box>
                    <Box sx={styles.container}>
                      <Typography marginRight={3} whiteSpace="nowrap">
                        公演場所
                      </Typography>
                      <TextField defaultValue={props.juchuHeadData.koenbashoNam} disabled></TextField>
                    </Box>
                    <Box sx={styles.container}>
                      <Typography marginRight={7} whiteSpace="nowrap">
                        相手
                      </Typography>
                      <TextField defaultValue={props.juchuHeadData.kokyaku.kokyakuNam} disabled></TextField>
                    </Box>
                  </Grid2>
                </Grid2>
              </AccordionDetails>
            </Accordion>
            {/*受注明細ヘッダー(キープ)*/}
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
                  bgcolor: 'green',
                  color: 'white',
                }}
              >
                <Box display="flex" alignItems={'center'} justifyContent="space-between" width={'100%'}>
                  <Typography>受注機材ヘッダー(キープ)</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ padding: 0 }}>
                <Divider />
                <Grid2 container alignItems="center" spacing={2} p={2}>
                  <Grid2 container alignItems="center">
                    <Typography>機材明細名</Typography>
                    <TextFieldElement name="headNam" control={control} disabled={!edit}></TextFieldElement>
                  </Grid2>
                </Grid2>
                <Grid2 container p={2} spacing={2}>
                  <Grid2 order={{ xl: 1 }} width={300}>
                    <Typography>親伝票出庫日時</Typography>
                    <Grid2>
                      <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <DateTime
                        date={
                          props.oyaJuchuKizaiHeadData.kicsShukoDat && new Date(props.oyaJuchuKizaiHeadData.kicsShukoDat)
                        }
                        onChange={() => {}}
                        onAccept={() => {}}
                        disabled
                      />
                    </Grid2>
                    <Grid2>
                      <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <DateTime
                        date={
                          props.oyaJuchuKizaiHeadData.yardShukoDat && new Date(props.oyaJuchuKizaiHeadData.yardShukoDat)
                        }
                        onChange={() => {}}
                        onAccept={() => {}}
                        disabled
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 width={300} order={{ xl: 4 }}>
                    <Typography>親伝票入庫日時</Typography>
                    <Grid2>
                      <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <DateTime
                        date={
                          props.oyaJuchuKizaiHeadData.kicsNyukoDat && new Date(props.oyaJuchuKizaiHeadData.kicsNyukoDat)
                        }
                        onChange={() => {}}
                        onAccept={() => {}}
                        disabled
                      />
                    </Grid2>
                    <Grid2>
                      <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <DateTime
                        date={
                          props.oyaJuchuKizaiHeadData.yardNyukoDat && new Date(props.oyaJuchuKizaiHeadData.yardNyukoDat)
                        }
                        onChange={() => {}}
                        onAccept={() => {}}
                        disabled
                      />
                    </Grid2>
                  </Grid2>
                  <Grid2 width={300} order={{ xl: 2 }}>
                    <Typography>キープ入庫日時</Typography>
                    <Grid2>
                      <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <Controller
                        name="kicsNyukoDat"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateTime
                            date={field.value}
                            // maxDate={keepShukoDate ? keepShukoDate : (oyaShukoDate ?? undefined)}
                            // minDate={oyaShukoDate ?? undefined}
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
                            // maxDate={keepShukoDate ? keepShukoDate : (oyaShukoDate ?? undefined)}
                            // minDate={oyaNyukoDate ?? undefined}
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
                  <Grid2 width={300} order={{ xl: 3 }}>
                    <Typography>キープ出庫日時</Typography>
                    <Grid2>
                      <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                      <Controller
                        name="kicsShukoDat"
                        control={control}
                        render={({ field, fieldState }) => (
                          <DateTime
                            date={field.value}
                            // maxDate={oyaShukoDate ?? undefined}
                            // minDate={keepNyukoDate ? keepNyukoDate : (oyaNyukoDate ?? undefined)}
                            onChange={handleKicsShukoChange}
                            onAccept={/*handleKicsShukoAccept*/ () => {}}
                            fieldstate={fieldState}
                            disabled={!edit}
                            onClear={() => {
                              field.onChange(null);
                              trigger(['kicsShukoDat', 'yardShukoDat']);
                            }}
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
                            // maxDate={oyaShukoDate ?? undefined}
                            // minDate={keepNyukoDate ? keepNyukoDate : (oyaNyukoDate ?? undefined)}
                            onChange={handleYardShukoChange}
                            onAccept={/*handleYardShukoAccept*/ () => {}}
                            fieldstate={fieldState}
                            disabled={!edit}
                            onClear={() => {
                              field.onChange(null);
                              trigger(['kicsShukoDat', 'yardShukoDat']);
                            }}
                          />
                        )}
                      />
                    </Grid2>
                  </Grid2>
                </Grid2>
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
                disabled={!edit}
              >
                <SaveAsIcon sx={{ mr: 1 }} />
                保存
              </Fab>
              <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                <ArrowUpwardIcon />
              </Fab>
            </Box>
          </form>
          {/*受注明細(機材)*/}
          {saveKizaiHead && (
            <Paper variant="outlined" sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" px={2} height={'30px'}>
                <Typography>受注明細(機材)</Typography>
              </Box>
              <Divider />

              <Dialog open={EqSelectionDialogOpen} maxWidth="sm" fullWidth>
                <OyaEqSelectionDialog
                  juchuHeadId={props.juchuHeadData.juchuHeadId}
                  oyaJuchuKizaiHeadId={props.oyaJuchuKizaiHeadData.juchuKizaiHeadId}
                  setEqpts={setEqpts}
                  onClose={setEqSelectionDialogOpen}
                />
              </Dialog>
              {isDetailLoading ? (
                <Loading />
              ) : (
                <>
                  <Box width="100%">
                    <Box my={1} mx={2}>
                      <Button disabled={!edit || nyukoFixFlag} onClick={() => handleOpenEqDialog()}>
                        <AddIcon fontSize="small" />
                        機材追加
                      </Button>
                    </Box>
                    <Box
                      width={'min-content'}
                      display={
                        Object.keys(keepJuchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'
                      }
                    >
                      <KeepEqTable
                        rows={keepJuchuKizaiMeisaiList}
                        edit={edit}
                        shukoFixFlag={shukoFixFlag}
                        handleMeisaiDelete={handleEqMeisaiDelete}
                        handleMemoChange={handleMemoChange}
                        handleCellChange={handleCellChange}
                      />
                    </Box>
                  </Box>
                  <Box
                    display={keepJuchuContainerMeisaiList.filter((d) => !d.delFlag).length > 0 ? 'block' : 'none'}
                    py={2}
                    width={'fit-content'}
                  >
                    <KeepContainerTable
                      rows={keepJuchuContainerMeisaiList}
                      edit={edit}
                      nyukoFixFlag={nyukoFixFlag}
                      handleContainerMemoChange={handleKeepContainerMemoChange}
                      handleContainerCellChange={handleKeepContainerCellChange}
                      handleMeisaiDelete={handleCtnMeisaiDelete}
                    />
                  </Box>
                </>
              )}
            </Paper>
          )}
        </Container>
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
