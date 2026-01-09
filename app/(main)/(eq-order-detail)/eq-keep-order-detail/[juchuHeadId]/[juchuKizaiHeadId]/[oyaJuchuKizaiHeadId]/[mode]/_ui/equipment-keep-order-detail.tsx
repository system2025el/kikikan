'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
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
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
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
  getKeepJuchuKizaiHead,
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
  oyaShukoDate: Date;
  oyaNyukoDate: Date;
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
  const [shukoFixFlag, setShukoFixFlag] = useState(props.shukoFixFlag);
  // 入庫フラグ
  const [nyukoFixFlag, setNyukoFixFlag] = useState(props.nyukoFixFlag);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);

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

  // 受注ヘッダーデータ
  const [juchuHeadData, setJuchuHeadData] = useState(props.juchuHeadData);
  // 親受注機材ヘッダーデータ
  const [oyaJuchuKizaiHeadData, setOyaJuchuKizaiHeadData] = useState(props.oyaJuchuKizaiHeadData);
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
  const [oyaShukoDate, setOyaShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setOyaNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
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
  const { setIsDirty /*setLock*/ } = useDirty();

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

      // キープ受注機材明細データ、キープ受注コンテナ明細データ
      const [juchuKizaiMeisaiData, keepJuchuContainerMeisaiData] = await Promise.all([
        getKeepJuchuKizaiMeisai(
          juchuKizaiHeadData.juchuHeadId,
          juchuKizaiHeadData.juchuKizaiHeadId,
          juchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
        getKeepJuchuContainerMeisai(
          juchuKizaiHeadData.juchuHeadId,
          juchuKizaiHeadData.juchuKizaiHeadId,
          juchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
      ]);

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

    // 受注ヘッダーデータ、親受注機材入出庫データ、出庫フラグ、入庫フラグ
    const [juchuHeadData, oyaJuchuKizaiHeadData, shukoFixFlag, nyukoFixFlag] = await Promise.all([
      getDetailJuchuHead(getValues('juchuHeadId')),
      getJuchuKizaiNyushuko(getValues('juchuHeadId'), getValues('oyaJuchuKizaiHeadId')),
      getNyushukoFixFlag(getValues('juchuHeadId'), getValues('juchuKizaiHeadId'), 60),
      getNyushukoFixFlag(getValues('juchuHeadId'), getValues('juchuKizaiHeadId'), 70),
    ]);
    if (!juchuHeadData || !oyaJuchuKizaiHeadData) {
      return <div>受注情報が見つかりません。</div>;
    }
    // 親出庫日
    const oyaShukoDate = getShukoDate(
      oyaJuchuKizaiHeadData.kicsShukoDat ? new Date(oyaJuchuKizaiHeadData.kicsShukoDat) : null,
      oyaJuchuKizaiHeadData.yardShukoDat ? new Date(oyaJuchuKizaiHeadData.yardShukoDat) : null
    );
    // 親入庫日
    const oyaNyukoDate = getNyukoDate(
      oyaJuchuKizaiHeadData.kicsNyukoDat ? new Date(oyaJuchuKizaiHeadData.kicsNyukoDat) : null,
      oyaJuchuKizaiHeadData.yardNyukoDat ? new Date(oyaJuchuKizaiHeadData.yardNyukoDat) : null
    );
    if (!oyaShukoDate || !oyaNyukoDate) {
      return <div>受注情報が見つかりません。</div>;
    }
    setJuchuHeadData(juchuHeadData);
    setOyaJuchuKizaiHeadData(oyaJuchuKizaiHeadData);
    setShukoFixFlag(shukoFixFlag);
    setNyukoFixFlag(nyukoFixFlag);
    setOyaShukoDate(oyaShukoDate);
    setOyaNyukoDate(oyaNyukoDate);

    if (getValues('juchuKizaiHeadId') === 0) {
      const newJuchuKizaiHeadData: KeepJuchuKizaiHeadValues = {
        juchuHeadId: juchuHeadData.juchuHeadId,
        juchuKizaiHeadId: 0,
        juchuKizaiHeadKbn: 3,
        mem: null,
        headNam: juchuHeadData.koenNam,
        oyaJuchuKizaiHeadId: getValues('oyaJuchuKizaiHeadId'),
        kicsShukoDat: null,
        kicsNyukoDat: null,
        yardShukoDat: null,
        yardNyukoDat: null,
      };
      reset(newJuchuKizaiHeadData);
    } else {
      setIsDetailLoading(true);
      // キープ受注機材ヘッダーデータ
      const keepJuchuKizaiHeadData = await getKeepJuchuKizaiHead(
        getValues('juchuHeadId'),
        getValues('juchuKizaiHeadId')
      );

      if (!keepJuchuKizaiHeadData) {
        return <div>受注機材情報が見つかりません。</div>;
      }

      // キープ受注機材明細データ、キープ受注コンテナ明細データ
      const [keepJuchuKizaiMeisaiData, keepJuchuContainerMeisaiData] = await Promise.all([
        getKeepJuchuKizaiMeisai(
          keepJuchuKizaiHeadData.juchuHeadId,
          keepJuchuKizaiHeadData.juchuKizaiHeadId,
          keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
        getKeepJuchuContainerMeisai(
          keepJuchuKizaiHeadData.juchuHeadId,
          keepJuchuKizaiHeadData.juchuKizaiHeadId,
          keepJuchuKizaiHeadData.oyaJuchuKizaiHeadId
        ),
      ]);

      // キープ出庫日
      const keepShukoDate = getShukoDate(
        keepJuchuKizaiHeadData.kicsShukoDat && new Date(keepJuchuKizaiHeadData.kicsShukoDat),
        keepJuchuKizaiHeadData.yardShukoDat && new Date(keepJuchuKizaiHeadData.yardShukoDat)
      );
      // キープ入庫日
      const keepNyukoDate = getNyukoDate(
        keepJuchuKizaiHeadData.kicsNyukoDat && new Date(keepJuchuKizaiHeadData.kicsNyukoDat),
        keepJuchuKizaiHeadData.yardNyukoDat && new Date(keepJuchuKizaiHeadData.yardNyukoDat)
      );

      reset(keepJuchuKizaiHeadData);
      setOriginKeepJuchuKizaiMeisaiList(keepJuchuKizaiMeisaiData ?? []);
      setKeepJuchuKizaiMeisaiList(keepJuchuKizaiMeisaiData ?? []);
      setOriginKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData);
      setKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData);
      setKeepShukoDate(keepShukoDate);
      setKeepNyukoDate(keepNyukoDate);
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

  /**
   * 保存ボタン押下時
   * @param data 受注機材ヘッダーデータ
   * @returns
   */
  const onSubmit = async (data: KeepJuchuKizaiHeadValues) => {
    console.log('保存開始', data);
    if (!user || isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
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
        setIsProcessing(false);
        return;
      }

      // 新規
      if (data.juchuKizaiHeadId === 0) {
        // 新規受注機材ヘッダー追加
        const newJuchuKizaiHeadId = await saveNewKeepJuchuKizaiHead(data, userNam);

        if (newJuchuKizaiHeadId) {
          router.replace(
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
          setIsProcessing(false);
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
    }
    setIsProcessing(false);
  };

  /**
   * 機材キープメモ入力時
   * @param rowIndex 入力された行番号
   * @param memo キープメモ内容
   */
  const handleMemoChange = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setKeepJuchuKizaiMeisaiList((prev) => {
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
  const handleEqMeisaiDelete = async (rowIndex: number) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setDeleteEqOpen(true);
      setDeleteEqIndex(rowIndex);
    }
    setIsProcessing(false);
  };

  // 機材明細削除ダイアログの押下ボタンによる処理
  const handleEqMeisaiDeleteResult = async (result: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (deleteEqIndex === null) {
      setDeleteEqOpen(false);
      setIsProcessing(false);
      return;
    }

    const lockResult = await lock();

    if (lockResult) {
      if (result) {
        setKeepJuchuKizaiMeisaiList((prev) => {
          const visibleIndex = prev
            .map((data, index) => (!data.delFlag ? index : null))
            .filter((index) => index !== null) as number[];

          const index = visibleIndex[deleteEqIndex];
          if (index === undefined) return prev;

          return prev.map((data, i) => (i === index ? { ...data, delFlag: true } : data));
        });
        setDeleteEqOpen(false);
        setDeleteEqIndex(null);
      } else {
        setDeleteEqOpen(false);
        setDeleteEqIndex(null);
      }
    }
    setIsProcessing(false);
  };

  /**
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleKeepContainerMemoChange = async (rowIndex: number, memo: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setKeepJuchuContainerMeisaiList((prev) => {
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
  const handleCtnMeisaiDelete = async (rowIndex: number) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
      setDeleteCtnOpen(true);
      setDeleteCtnIndex(rowIndex);
    }
    setIsProcessing(false);
  };

  // コンテナ明細削除ダイアログの押下ボタンによる処理
  const handleCtnMeisaiDeleteResult = async (result: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);

    if (deleteCtnIndex === null) {
      setDeleteCtnOpen(false);
      setIsProcessing(false);
      return;
    }

    const lockResult = await lock();

    if (lockResult) {
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
        setDeleteCtnOpen(false);
        setDeleteCtnIndex(null);
      } else {
        setDeleteCtnOpen(false);
        setDeleteCtnIndex(null);
      }
    }
    setIsProcessing(false);
  };

  /**
   * KICS出庫日変更時
   * @param newDate KICS出庫日
   */
  const handleKicsShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsShukoDat', newDate.toDate(), { shouldDirty: true });
  };

  /**
   * KICS出庫日確定時
   * @param newDate KICS出庫日
   */
  const handleKicsShukoAccept = async (newDate: Dayjs | null) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    setIsProcessing(false);
    // if (newDate === null) return;
    // trigger(['kicsShukoDat', 'yardShukoDat']);

    // const yardShukoDat = getValues('yardShukoDat');

    // if (yardShukoDat === null) {
    //   clearErrors('yardShukoDat');
    // }
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

    const lockResult = await lock();

    setIsProcessing(false);
    // if (newDate === null) return;
    // trigger(['kicsShukoDat', 'yardShukoDat']);

    // const kicsShukoDat = getValues('kicsShukoDat');

    // if (kicsShukoDat === null) {
    //   clearErrors('kicsShukoDat');
    // }
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

  /**
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (eqData: OyaJuchuKizaiMeisaiValues[], containerData: OyaJuchuContainerMeisaiValues[]) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const lockResult = await lock();

    if (lockResult) {
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
      setKeepJuchuKizaiMeisaiList(originKeepJuchuKizaiMeisaiList);
      setKeepJuchuContainerMeisaiList(originKeepJuchuContainerMeisaiList);
      setDirtyOpen(false);
      setIsLoading(false);
    } else {
      setDirtyOpen(false);
      setPath(null);
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
                  {shukoFixFlag ? (
                    <Box display={'flex'} alignItems={'center'}>
                      <Typography>出発済</Typography>
                    </Box>
                  ) : nyukoFixFlag ? (
                    <Box display={'flex'} alignItems={'center'}>
                      <Typography>到着済</Typography>
                    </Box>
                  ) : (
                    <></>
                  )}
                  <Grid2 container display={saveKizaiHead ? 'flex' : 'none'} alignItems={'center'} spacing={1}>
                    {!edit || shukoFixFlag ? <Typography>閲覧モード</Typography> : <Typography>編集モード</Typography>}
                    <Button
                      disabled={!!lockData || shukoFixFlag || user?.permission.juchu === permission.juchu_ref}
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
                            <TextField defaultValue={juchuHeadData.juchuHeadId} disabled></TextField>
                          </Grid2>
                          <Grid2 display="flex" direction="row" alignItems="center">
                            <Typography mr={2}>受注ステータス</Typography>
                            <Select value={juchuHeadData.juchuSts} disabled>
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
                        <TestDate date={juchuHeadData.juchuDat} onChange={() => {}} disabled />
                      </Box>
                      <Box sx={styles.container}>
                        <Typography marginRight={5} whiteSpace="nowrap">
                          入力者
                        </Typography>
                        <TextField defaultValue={juchuHeadData.nyuryokuUser} disabled></TextField>
                      </Box>
                    </Grid2>
                    <Grid2>
                      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mt: { xs: 0, sm: 0, md: 2 } }}>
                        <Typography marginRight={5} whiteSpace="nowrap">
                          公演名
                        </Typography>
                        <TextField defaultValue={juchuHeadData.koenNam} disabled></TextField>
                      </Box>
                      <Box sx={styles.container}>
                        <Typography marginRight={3} whiteSpace="nowrap">
                          公演場所
                        </Typography>
                        <TextField defaultValue={juchuHeadData.koenbashoNam} disabled></TextField>
                      </Box>
                      <Box sx={styles.container}>
                        <Typography marginRight={7} whiteSpace="nowrap">
                          相手
                        </Typography>
                        <TextField defaultValue={juchuHeadData.kokyaku.kokyakuNam} disabled></TextField>
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
                      <Typography>受注明細名</Typography>
                      <TextFieldElement name="headNam" control={control} disabled={!edit}></TextFieldElement>
                    </Grid2>
                  </Grid2>
                  <Grid2 container p={2} spacing={2}>
                    <Grid2 order={{ xl: 1 }} width={300}>
                      <Typography>親伝票出庫日時</Typography>
                      <Grid2>
                        <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={oyaJuchuKizaiHeadData.kicsShukoDat && new Date(oyaJuchuKizaiHeadData.kicsShukoDat)}
                          onChange={() => {}}
                          onAccept={() => {}}
                          disabled
                        />
                      </Grid2>
                      <Grid2>
                        <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={oyaJuchuKizaiHeadData.yardShukoDat && new Date(oyaJuchuKizaiHeadData.yardShukoDat)}
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
                          date={oyaJuchuKizaiHeadData.kicsNyukoDat && new Date(oyaJuchuKizaiHeadData.kicsNyukoDat)}
                          onChange={() => {}}
                          onAccept={() => {}}
                          disabled
                        />
                      </Grid2>
                      <Grid2>
                        <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                        <DateTime
                          date={oyaJuchuKizaiHeadData.yardNyukoDat && new Date(oyaJuchuKizaiHeadData.yardNyukoDat)}
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
                              onAccept={handleKicsShukoAccept}
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
                              onAccept={handleYardShukoAccept}
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
            {/*受注明細(機材)*/}
            {saveKizaiHead && (
              <Paper variant="outlined" sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center" px={2} height={'30px'}>
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
                    <Box width="100%">
                      <Box my={1} mx={2}>
                        <Button disabled={!edit || nyukoFixFlag} onClick={handleOpenEqDialog}>
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
