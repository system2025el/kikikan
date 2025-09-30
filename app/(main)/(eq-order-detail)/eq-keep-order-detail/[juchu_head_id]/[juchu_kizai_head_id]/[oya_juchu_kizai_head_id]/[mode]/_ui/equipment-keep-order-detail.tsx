'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
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
  Dialog,
  Divider,
  Fab,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Popper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { addMonths, endOfMonth, subDays, subMonths } from 'date-fns';
import dayjs, { Dayjs } from 'dayjs';
import { redirect } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringMonthDay } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { addLock, delLock, getLock } from '@/app/(main)/_lib/funcs';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, DateTime, TestDate } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import {
  addJuchuKizaiNyushuko,
  getJuchuContainerMeisaiMaxId,
  getJuchuKizaiHeadMaxId,
  getJuchuKizaiMeisaiMaxId,
  updJuchuKizaiNyushuko,
} from '@/app/(main)/(eq-order-detail)/_lib/funcs';
import {
  DetailOerValues,
  OyaJuchuKizaiMeisaiValues,
  OyaJuchuKizaiNyushukoValues,
} from '@/app/(main)/(eq-order-detail)/_lib/types';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import {
  JuchuContainerMeisaiValues,
  JuchuKizaiHeadValues,
  JuchuKizaiMeisaiValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';
import {
  NyushukoAlertDialog,
  SaveAlertDialog,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_ui/caveat-dialog';

import {
  addKeepJuchuContainerMeisai,
  addKeepJuchuKizaiHead,
  addKeepJuchuKizaiMeisai,
  addKeepNyushukoDen,
  delKeepJuchuContainerMeisai,
  delKeepJuchuKizaiMeisai,
  delKeepNyushukoDen,
  getKeepJuchuContainerMeisai,
  getKeepJuchuKizaiMeisai,
  updKeepContainerNyushukoDen,
  updKeepJuchuContainerMeisai,
  updKeepJuchuKizaiHead,
  updKeepJuchuKizaiMeisai,
  updKeepNyushukoDen,
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
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] | undefined;
  keepJuchuContainerMeisaiData: KeepJuchuContainerMeisaiValues[] | undefined;
  oyaShukoDate: Date;
  oyaNyukoDate: Date;
  keepShukoDate: Date | null;
  keepNyukoDate: Date | null;
  edit: boolean;
}) => {
  // user情報
  const user = useUserStore((state) => state.user);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.keepJuchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;

  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 全体の保存フラグ
  const [save, setSave] = useState(false);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);

  // キープ受注機材明細元リスト
  const [originKeepJuchuKizaiMeisaiList, setOriginKeepJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>(
    props.keepJuchuKizaiMeisaiData ? props.keepJuchuKizaiMeisaiData : []
  );
  // キープ受注機材明細リスト
  const [keepJuchuKizaiMeisaiList, setKeepJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>(
    props.keepJuchuKizaiMeisaiData ? props.keepJuchuKizaiMeisaiData : []
  );
  // キープ受注コンテナ明細元リスト
  const [originKeepJuchuContainerMeisaiList, setOriginKeepJuchuContainerMeisaiList] = useState<
    KeepJuchuContainerMeisaiValues[]
  >(props.keepJuchuContainerMeisaiData ?? []);
  // キープ受注コンテナ明細リスト
  const [keepJuchuContainerMeisaiList, setKeepJuchuContainerMeisaiList] = useState<KeepJuchuContainerMeisaiValues[]>(
    props.keepJuchuContainerMeisaiData ?? []
  );

  // 親出庫日
  const [oyaShukoDate, setShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
  // キープ出庫日
  const [keepShukoDate, setKeepShukoDate] = useState<Date | null>(props.keepShukoDate);
  // キープ入庫日
  const [keepNyukoDate, setKeepNyukoDate] = useState<Date | null>(props.keepNyukoDate);

  // 未保存ダイアログ制御
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログ制御
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 入出庫日時ダイアログ制御
  const [nyushukoOpen, setNyushukoOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);

  // context
  const { setIsDirty, setIsSave, setLock } = useDirty();

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
  useUnsavedChangesWarning(isDirty, save);

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
    const filterJuchuKizaiMeisaiList = keepJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
    const filterJuchuContainerMeisaiList = keepJuchuContainerMeisaiList.filter((data) => !data.delFlag);
    if (
      saveKizaiHead &&
      JSON.stringify(originKeepJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList) &&
      JSON.stringify(originKeepJuchuContainerMeisaiList) === JSON.stringify(filterJuchuContainerMeisaiList)
    ) {
      setSave(true);
      setIsSave(true);
    } else {
      setSave(false);
      setIsSave(false);
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

    if (!updateShukoDate || !updateNyukoDate) {
      setIsLoading(false);
      return;
    }

    // 新規
    if (data.juchuKizaiHeadId === 0) {
      // 新規受注機材ヘッダー追加
      await saveNewKeepJuchuKizaiHead(data, userNam);

      // 更新
    } else {
      const kicsMeisai = keepJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 1);
      const yardMeisai = keepJuchuKizaiMeisaiList.filter((d) => d.shozokuId === 2);
      const kicsContainer = keepJuchuContainerMeisaiList.filter((d) => d.kicsKeepQty);
      const yardContainer = keepJuchuContainerMeisaiList.filter((d) => d.yardKeepQty);

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

      // 受注機材ヘッダー関係更新
      if (isDirty) {
        await saveKeepJuchuKizaiHead(data, updateShukoDate, updateNyukoDate, userNam);
      }

      // 受注機材明細関係更新
      const filterKeepJuchuKizaiMeisaiList = keepJuchuKizaiMeisaiList.filter((data) => !data.delFlag);
      if (
        isDirty ||
        JSON.stringify(originKeepJuchuKizaiMeisaiList) !== JSON.stringify(filterKeepJuchuKizaiMeisaiList)
      ) {
        await saveKeepJuchuKizaiMeisai(data, userNam);
      }

      // 受注コンテナ明細更新
      const filterKeepJuchuContainerMeisaiList = keepJuchuContainerMeisaiList.filter((data) => !data.delFlag);
      if (
        isDirty ||
        JSON.stringify(originKeepJuchuContainerMeisaiList) !== JSON.stringify(filterKeepJuchuContainerMeisaiList)
      ) {
        await saveKeepJuchuContainerMeisai(data, userNam);
      }
    }
    setSave(true);
    setIsSave(true);
    setIsLoading(false);
  };

  /**
   *キープ新規受注機材ヘッダー追加
   * @param data 受注機材ヘッダーデータ
   * @param updateShukoDate 更新後出庫日
   * @param updateNyukoDate 更新後入庫日
   * @param updateDateRange 更新後出庫日から入庫日
   * @param userNam ユーザー名
   */
  const saveNewKeepJuchuKizaiHead = async (data: KeepJuchuKizaiHeadValues, userNam: string) => {
    const maxId = await getJuchuKizaiHeadMaxId(data.juchuHeadId);
    const newJuchuKizaiHeadId = maxId ? maxId.juchu_kizai_head_id + 1 : 1;
    // 受注機材ヘッダー追加
    const headResult = await addKeepJuchuKizaiHead(newJuchuKizaiHeadId, data, userNam);
    console.log('受注機材ヘッダー追加', headResult);
    // 受注機材入出庫追加
    const nyushukoResult = await addJuchuKizaiNyushuko(
      data.juchuHeadId,
      newJuchuKizaiHeadId,
      data.kicsShukoDat,
      data.yardShukoDat,
      data.kicsNyukoDat,
      data.yardNyukoDat,
      userNam
    );
    console.log('キープ受注機材入出庫追加', nyushukoResult);

    redirect(`/eq-keep-order-detail/${data.juchuHeadId}/${newJuchuKizaiHeadId}/${data.oyaJuchuKizaiHeadId}/edit`);
  };

  /**
   * キープ受注機材ヘッダー関係更新
   * @param data 受注機材ヘッダーデータ
   * @param updateShukoDate 更新後出庫日
   * @param updateNyukoDate 更新後入庫日
   * @param updateDateRange 更新後出庫日から入庫日
   * @param userNam ユーザー名
   */
  const saveKeepJuchuKizaiHead = async (
    data: KeepJuchuKizaiHeadValues,
    updateShukoDate: Date,
    updateNyukoDate: Date,
    userNam: string
  ) => {
    // 受注機材ヘッド更新
    const headResult = await updKeepJuchuKizaiHead(data, userNam);
    console.log('キープ受注機材ヘッダー更新', headResult);

    // 受注機材入出庫更新
    const nyushukoResult = await updJuchuKizaiNyushuko(
      data.juchuHeadId,
      data.juchuKizaiHeadId,
      data.kicsShukoDat,
      data.yardShukoDat,
      data.kicsNyukoDat,
      data.yardNyukoDat,
      userNam
    );
    console.log('キープ受注機材入出庫更新', nyushukoResult);

    reset(data);
    // 出庫日更新
    setKeepShukoDate(updateShukoDate);
    // 入庫日更新
    setKeepNyukoDate(updateNyukoDate);
  };

  /**
   * キープ受注機材明細関係更新
   * @param juchuHeadId 受注ヘッダーid
   * @param juchuKizaiHeadId 受注機材ヘッダーid
   * @param userNam ユーザー名
   */
  const saveKeepJuchuKizaiMeisai = async (data: KeepJuchuKizaiHeadValues, userNam: string) => {
    const copyKeepJuchuKizaiMeisaiData = [...keepJuchuKizaiMeisaiList];
    const juchuKizaiMeisaiMaxId = await getJuchuKizaiMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
    let newKeepJuchuKizaiMeisaiId = juchuKizaiMeisaiMaxId ? juchuKizaiMeisaiMaxId.juchu_kizai_meisai_id + 1 : 1;

    const newKeepJuchuKizaiMeisaiData = copyKeepJuchuKizaiMeisaiData.map((data) =>
      data.juchuKizaiMeisaiId === 0 && !data.delFlag
        ? { ...data, juchuKizaiMeisaiId: newKeepJuchuKizaiMeisaiId++ }
        : data
    );

    // 受注機材明細更新
    const addKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter((data) => !data.delFlag && !data.saveFlag);
    const updateKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter((data) => !data.delFlag && data.saveFlag);
    const deleteKeepJuchuKizaiMeisaiData = newKeepJuchuKizaiMeisaiData.filter((data) => data.delFlag && data.saveFlag);
    // 削除
    if (deleteKeepJuchuKizaiMeisaiData.length > 0) {
      const deleteKizaiIds = deleteKeepJuchuKizaiMeisaiData.map((data) => data.kizaiId);
      const deleteMeisaiResult = await delKeepJuchuKizaiMeisai(data.juchuHeadId, data.juchuKizaiHeadId, deleteKizaiIds);
      console.log('キープ受注機材明細削除', deleteMeisaiResult);

      const deleteNyushukoDenResult = await delKeepNyushukoDen(data.juchuHeadId, data.juchuKizaiHeadId, deleteKizaiIds);
      console.log('キープ入出庫伝票削除', deleteNyushukoDenResult);
    }
    // 追加
    if (addKeepJuchuKizaiMeisaiData.length > 0) {
      const addMeisaiResult = addKeepJuchuKizaiMeisai(addKeepJuchuKizaiMeisaiData, userNam);
      console.log('キープ受注機材明細追加', addMeisaiResult);

      const addNyushukoDenResult = await addKeepNyushukoDen(data, addKeepJuchuKizaiMeisaiData, userNam);
      console.log('キープ入出庫伝票追加', addNyushukoDenResult);
    }
    // 更新
    if (updateKeepJuchuKizaiMeisaiData.length > 0) {
      const updateMeisaiResult = await updKeepJuchuKizaiMeisai(updateKeepJuchuKizaiMeisaiData, userNam);
      console.log('キープ受注機材明細更新', updateMeisaiResult);

      const updateNyushukoDenResult = await updKeepNyushukoDen(data, updateKeepJuchuKizaiMeisaiData, userNam);
      console.log('キープ入出庫伝票更新', updateNyushukoDenResult);
    }

    // 受注機材明細、機材在庫テーブル更新
    const keepJuchuKizaiMeisaiData = await getKeepJuchuKizaiMeisai(
      data.juchuHeadId,
      data.juchuKizaiHeadId,
      data.oyaJuchuKizaiHeadId
    );
    if (keepJuchuKizaiMeisaiData) {
      setKeepJuchuKizaiMeisaiList(keepJuchuKizaiMeisaiData);
      setOriginKeepJuchuKizaiMeisaiList(keepJuchuKizaiMeisaiData);
    }
  };

  /**
   * キープ受注コンテナ明細更新
   * @param juchuHeadId 受注ヘッダーid
   * @param juchuKizaiHeadId 受注機材ヘッダーid
   * @param userNam ユーザー名
   */
  const saveKeepJuchuContainerMeisai = async (data: KeepJuchuKizaiHeadValues, userNam: string) => {
    const copyKeepJuchuContainerMeisaiData = [...keepJuchuContainerMeisaiList];
    const juchuContainerMeisaiMaxId = await getJuchuContainerMeisaiMaxId(data.juchuHeadId, data.juchuKizaiHeadId);
    let newKeepJuchuContainerMeisaiId = juchuContainerMeisaiMaxId
      ? juchuContainerMeisaiMaxId.juchu_kizai_meisai_id + 1
      : 1;

    const newKeepJuchuContainerMeisaiData = copyKeepJuchuContainerMeisaiData.map((data) =>
      data.juchuKizaiMeisaiId === 0 && !data.delFlag
        ? { ...data, juchuKizaiMeisaiId: newKeepJuchuContainerMeisaiId++ }
        : data
    );

    // 受注コンテナ明細更新
    const addKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
      (data) => !data.delFlag && !data.saveFlag
    );
    const updateKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
      (data) => !data.delFlag && data.saveFlag
    );
    const deleteKeepJuchuContainerMeisaiData = newKeepJuchuContainerMeisaiData.filter(
      (data) => data.delFlag && data.saveFlag
    );
    // 削除
    if (deleteKeepJuchuContainerMeisaiData.length > 0) {
      const deleteKizaiIds = deleteKeepJuchuContainerMeisaiData.map((data) => data.kizaiId);
      const deleteContainerMeisaiResult = await delKeepJuchuContainerMeisai(
        data.juchuHeadId,
        data.juchuKizaiHeadId,
        deleteKizaiIds
      );
      console.log('キープ受注コンテナ明細削除', deleteContainerMeisaiResult);
    }
    // 追加
    if (addKeepJuchuContainerMeisaiData.length > 0) {
      const addContainerMeisaiResult = addKeepJuchuContainerMeisai(addKeepJuchuContainerMeisaiData, userNam);
      console.log('キープ受注コンテナ明細追加', addContainerMeisaiResult);
    }
    // 更新
    if (updateKeepJuchuContainerMeisaiData.length > 0) {
      const updateContainerMeisaiResult = await updKeepJuchuContainerMeisai(
        updateKeepJuchuContainerMeisaiData,
        userNam
      );
      console.log('キープ受注コンテナ明細更新', updateContainerMeisaiResult);
    }

    // キープコンテナ入出庫伝票更新
    const containerNyushukoDenResult = await updKeepContainerNyushukoDen(
      data,
      newKeepJuchuContainerMeisaiData,
      userNam
    );
    console.log('キープコンテナ入出庫伝票更新', containerNyushukoDenResult);

    const keepJuchuContainerMeisaiData = await getKeepJuchuContainerMeisai(
      data.juchuHeadId,
      data.juchuKizaiHeadId,
      data.oyaJuchuKizaiHeadId
    );
    setOriginKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData ?? []);
    setKeepJuchuContainerMeisaiList(keepJuchuContainerMeisaiData ?? []);
  };

  /**
   * 機材キープメモ入力時
   * @param rowIndex 入力された行番号
   * @param memo キープメモ内容
   */
  const handleMemoChange = (kizaiId: number, memo: string) => {
    setKeepJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId ? { ...data, mem: memo } : data))
    );
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
    if (newDate === null) return;
    trigger(['kicsShukoDat', 'yardShukoDat']);

    const yardShukoDat = getValues('yardShukoDat');

    if (yardShukoDat === null) {
      clearErrors('yardShukoDat');
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

    if (kicsShukoDat === null) {
      clearErrors('kicsShukoDat');
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
   * 機材テーブルのキープ数入力時
   * @param kizaiId 機材id
   * @param keepValue キープ数
   */
  const handleCellChange = (kizaiId: number, keepValue: number) => {
    setKeepJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, keepQty: keepValue } : data))
    );
  };

  /**
   * 機材テーブルの削除ボタン押下時
   * @param kizaiId 機材id
   */
  const handleDelete = (kizaiId: number) => {
    setKeepJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, delFlag: true } : data))
    );
  };

  /**
   * コンテナメモ入力時
   * @param kizaiId 機材id
   * @param memo コンテナメモ内容
   */
  const handleKeepContainerMemoChange = (kizaiId: number, memo: string) => {
    setKeepJuchuContainerMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, mem: memo } : data))
    );
  };

  /**
   * コンテナテーブル使用数入力時
   * @param kizaiId 機材id
   * @param kicsKeepQty KICSコンテナ数
   * @param yardKeepQty YARDコンテナ数
   */
  const handleKeepContainerCellChange = (kizaiId: number, kicsKeepQty: number, yardKeepQty: number) => {
    setKeepJuchuContainerMeisaiList((prev) =>
      prev.map((data) =>
        data.kizaiId === kizaiId && !data.delFlag
          ? { ...data, kicsKeepQty: kicsKeepQty, yardKeepQty: yardKeepQty }
          : data
      )
    );
  };

  /**
   * コンテナテーブル削除ボタン押下時
   * @param kizaiId 機材id
   */
  const handleKeepContainerDelete = (kizaiId: number) => {
    setKeepJuchuContainerMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, delFlag: true } : data))
    );
  };

  /**
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (eqData: OyaJuchuKizaiMeisaiValues[], containerData: JuchuContainerMeisaiValues[]) => {
    const eqIds = new Set(keepJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterEqData = eqData.filter((d) => !eqIds.has(d.kizaiId));
    const newOyaJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = filterEqData.map((d) => ({
      juchuHeadId: getValues('juchuHeadId'),
      juchuKizaiHeadId: getValues('juchuKizaiHeadId'),
      juchuKizaiMeisaiId: 0,
      shozokuId: d.shozokuId,
      shozokuNam: d.shozokuNam,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      oyaPlanKizaiQty: d.planKizaiQty ?? 0,
      oyaPlanYobiQty: d.planYobiQty ?? 0,
      keepQty: 0,
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
      oyaPlanKicsKizaiQty: d.planKicsKizaiQty ?? 0,
      oyaPlanYardKizaiQty: d.planYardKizaiQty ?? 0,
      kicsKeepQty: 0,
      yardKeepQty: 0,
      delFlag: false,
      saveFlag: false,
    }));

    setKeepJuchuKizaiMeisaiList((prev) => [...prev, ...newOyaJuchuKizaiMeisaiData]);
    setKeepJuchuContainerMeisaiList((prev) => [...prev, ...newKeepJuchuContainerMeisaiData]);
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
    if (!saveKizaiHead) {
      setSaveOpen(true);
      return;
    }
    setEqSelectionDialogOpen(true);
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
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                component="div"
                sx={{ bgcolor: 'green', color: 'white' }}
              >
                <Grid2
                  container
                  display="flex"
                  alignItems={'center'}
                  justifyContent="space-between"
                  spacing={2}
                  py={1}
                  width={'100%'}
                >
                  <Typography>受注機材ヘッダー(キープ)</Typography>
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
                </Grid2>
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
                            // maxDate={keepShukoDate ? keepShukoDate : (oyaShukoDate ?? undefined)}
                            // minDate={oyaNyukoDate ?? undefined}
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
                <Grid2 container alignItems="center" p={2} spacing={2}>
                  <Typography>入出庫ステータス</Typography>
                  <TextField disabled defaultValue={'準備中'}></TextField>
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
          </form>
          {/*受注明細(機材)*/}
          <Paper variant="outlined" sx={{ mt: 2 }}>
            <Box display="flex" alignItems="center" py={1} px={2}>
              <Grid2 container direction="column" spacing={1}>
                <Typography>受注明細(機材)</Typography>
                <Typography fontSize={'small'}>機材入力</Typography>
              </Grid2>
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
            <Box width="100%">
              <Box my={1} mx={2}>
                <Button disabled={!edit} onClick={() => handleOpenEqDialog()}>
                  <AddIcon fontSize="small" />
                  機材追加
                </Button>
              </Box>
              <Box
                width={'min-content'}
                display={Object.keys(keepJuchuKizaiMeisaiList.filter((d) => !d.delFlag)).length > 0 ? 'block' : 'none'}
              >
                <KeepEqTable
                  rows={keepJuchuKizaiMeisaiList}
                  edit={edit}
                  handleDelete={handleDelete}
                  handleMemoChange={handleMemoChange}
                  onChange={handleCellChange}
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
                handleContainerMemoChange={handleKeepContainerMemoChange}
                onChange={handleKeepContainerCellChange}
                handleContainerDelete={handleKeepContainerDelete}
              />
            </Box>
          </Paper>
          <Fab color="primary" onClick={scrollTop} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
            <ArrowUpwardIcon fontSize="small" />
          </Fab>
          <SaveAlertDialog open={saveOpen} onClick={() => setSaveOpen(false)} />
          <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
          <NyushukoAlertDialog open={nyushukoOpen} onClick={() => setNyushukoOpen(false)} />
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
