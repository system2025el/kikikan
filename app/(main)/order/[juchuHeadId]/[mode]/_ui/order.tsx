'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CreateIcon from '@mui/icons-material/Create';
import Delete from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Fab,
  FormControl,
  Grid2,
  MenuItem,
  Modal,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { deleteLock } from '@/app/_lib/db/tables/t-lock';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { getNyukoDate, getRange, getShukoDate } from '@/app/(main)/_lib/date-funcs';
import { addLock, getLock } from '@/app/(main)/_lib/funcs';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import DateX, { RSuiteDateRangePicker, TestDate } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import { SelectTable } from '@/app/(main)/_ui/table';
import { WillDeleteAlertDialog } from '@/app/(main)/(masters)/_ui/dialogs';
import { equipmentRows, users, vehicleHeaders, vehicleRows } from '@/app/(main)/order/[juchuHeadId]/[mode]/_lib/data';
import { delJuchuSharyoMeisais } from '@/app/(main)/vehicle-order-detail/[jhid]/[jshid]/[mode]/_lib/funcs';

import { useUnsavedChangesWarning } from '../../../../_lib/hook';
import {
  addJuchuHead,
  copyJuchuKizaiHeadMeisai,
  delJuchuHead,
  delJuchuMeisai,
  getJuchuHead,
  getJuchuKizaiHeadList,
  getJuchuSharyoHeadList,
  getMaxId,
  updJuchuHead,
} from '../_lib/funcs';
import {
  CopyDialogValue,
  EqTableValues,
  KokyakuValues,
  OrderSchema,
  OrderValues,
  VehicleTableValues,
} from '../_lib/types';
import { AlertDialog, HeadDeleteConfirmDialog, KizaiHeadDeleteConfirmDialog } from './caveat-dialog';
import { CopyDialog } from './copy-dialog';
import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';
import { OrderEqTable, OrderVehicleTable } from './order-table';

export const Order = (props: {
  juchuHeadData: OrderValues;
  juchuKizaiHeadDatas: EqTableValues[] | undefined;
  juchusharyoHeadDatas: VehicleTableValues[] | undefined;
  edit: boolean;
  //lockData: LockValues | null;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // userList
  const userList = users;
  // 保存フラグ
  const save = props.juchuHeadData.juchuHeadId !== 0 ? true : false;

  // 画面全体ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 受注機材ヘッダー一覧ローディング
  const [isJuchuKizaiLoading, setIsJuchuKizaiLoading] = useState(false);

  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);

  // 機材ヘッダーデータ
  const [eqHeaderList, setEqHeaderList] = useState<EqTableValues[] | undefined>(props.juchuKizaiHeadDatas);
  // 車両ヘッダーデータ
  const [vehicleHeaderList, setVehicleHeaderList] = useState<VehicleTableValues[] | undefined>(
    props.juchusharyoHeadDatas
  );
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);

  // 警告ダイアログ制御
  const [alertOpen, setAlertOpen] = useState(false);
  // 警告ダイアログタイトル
  const [alertTitle, setAlertTitle] = useState('');
  // 警告ダイアログ用メッセージ
  const [alertMessage, setAlertMessage] = useState('');
  // 編集内容が未保存ダイアログ制御
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 受注ヘッダー削除ダイアログ制御
  const [headDeleteOpen, setHeadDeleteOpen] = useState(false);
  // コピーダイアログ制御
  const [copyOpen, setCopyOpen] = useState(false);
  // 受注機材ヘッダー削除ダイアログ制御
  const [kizaiHeadDeleteOpen, setKizaiHeadDeleteOpen] = useState(false);
  // 受注車両ヘッダー削除ダイアログ制御
  const [sharyoHeadDeleteOpen, setSharyoHeadDeleteOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  // 機材テーブル選択行
  const [selectEq, setSelectEq] = useState<number | null>(null);
  // 機材選択データ
  const [selectEqHeader, setSelectEqHeader] = useState<EqTableValues | null>(null);
  // 車両テーブル選択ID配列
  const [selectedVehs, setSelectedVehs] = useState<number[]>([]);
  // 遷移先path
  const [path, setPath] = useState<string | null>(null);

  // context
  const { setIsDirty, setLock } = useDirty();
  // 合計金額
  const priceTotal = eqHeaderList!.reduce((sum, row) => sum + (row.shokei ?? 0), 0);

  /* useForm ------------------------- */
  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    clearErrors,
    formState: { isDirty, errors, defaultValues },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      juchuHeadId: props.juchuHeadData.juchuHeadId,
      delFlg: props.juchuHeadData.delFlg,
      juchuSts: props.juchuHeadData.juchuSts,
      juchuDat: new Date(props.juchuHeadData.juchuDat),
      juchuRange:
        props.juchuHeadData.juchuRange !== null
          ? ([
              props.juchuHeadData.juchuRange[0] ? new Date(props.juchuHeadData.juchuRange[0]) : new Date(''),
              props.juchuHeadData.juchuRange[1] ? new Date(props.juchuHeadData.juchuRange[1]) : new Date(''),
            ] as [Date, Date])
          : null,
      nyuryokuUser: props.juchuHeadData.nyuryokuUser,
      koenNam: props.juchuHeadData.koenNam,
      koenbashoNam: props.juchuHeadData.koenbashoNam,
      kokyaku: props.juchuHeadData.kokyaku,
      kokyakuTantoNam: props.juchuHeadData.kokyakuTantoNam,
      mem: props.juchuHeadData.mem,
      // nebikiAmt: props.juchuHeadData.nebikiAmt,
      zeiKbn: props.juchuHeadData.zeiKbn,
    },
    resolver: zodResolver(OrderSchema),
  });

  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty);

  useEffect(() => {
    if (!user) return;

    if (getValues('juchuHeadId') === 0) {
      const data = { ...getValues(), nyuryokuUser: user.name };
      reset(data);
      return;
    }

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
  }, []);

  useEffect(() => {
    setIsDirty(isDirty);
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  // 保存ボタン押下
  const onSubmit = async (data: OrderValues) => {
    console.log('update : 開始');
    if (!user) return;
    setIsLoading(true);

    // 新規
    if (data.juchuHeadId === 0) {
      const maxId = await getMaxId();
      const newOrderId = maxId ? maxId.juchu_head_id + 1 : 1;
      await addJuchuHead(newOrderId, data, user.name);
      router.push(`/order/${newOrderId}/edit`);
      // 更新
    } else {
      const updateResult = await updJuchuHead(data);
      if (updateResult) {
        reset(data);
        setIsLoading(false);
        setSnackBarMessage('保存しました');
        setSnackBarOpen(true);
      } else {
        setIsLoading(false);
        setSnackBarMessage('保存に失敗しました');
        setSnackBarOpen(true);
      }
    }
  };

  // 編集モード変更
  const handleEdit = async () => {
    // 編集→閲覧
    if (edit) {
      if (isDirty) {
        setDirtyOpen(true);
        return;
      }

      await deleteLock(1, props.juchuHeadData.juchuHeadId);
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

  // 伝票削除ボタン押下
  const handleHeadDelete = async (result: boolean) => {
    if (result) {
      setIsLoading(true);
      const deleteResult = await delJuchuHead(getValues('juchuHeadId'));

      if (!deleteResult) {
        setSnackBarMessage('削除に失敗しました');
        setSnackBarOpen(true);
        setIsLoading(false);
      }
    } else {
      setHeadDeleteOpen(false);
    }
  };

  // 機材入力ボタン押下
  const handleAddEq = async () => {
    if (!isDirty) {
      await deleteLock(1, props.juchuHeadData.juchuHeadId);
      router.push(`/eq-main-order-detail/${props.juchuHeadData.juchuHeadId}/0/edit`);
    } else {
      setPath(`/eq-main-order-detail/${props.juchuHeadData.juchuHeadId}/0/edit`);
      setDirtyOpen(true);
    }
  };

  // 返却入力ボタン押下
  const handleAddReturn = async () => {
    if (selectEqHeader) {
      if (selectEqHeader && selectEqHeader.juchuKizaiHeadKbn === 1) {
        if (!isDirty) {
          await deleteLock(1, props.juchuHeadData.juchuHeadId);
          router.push(
            `/eq-return-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectEqHeader.juchuKizaiHeadId}/edit`
          );
        } else {
          setPath(
            `/eq-return-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectEqHeader.juchuKizaiHeadId}/edit`
          );
          setDirtyOpen(true);
        }
      } else {
        setAlertTitle('選択項目を確認してください');
        setAlertMessage('メイン明細を選択してください');
        setAlertOpen(true);
      }
    } else {
      setAlertTitle('選択項目を確認してください');
      setAlertMessage('メイン明細を選択してください');
      setAlertOpen(true);
    }
  };

  // キープ入力ボタン押下
  const handleAddKeep = async () => {
    if (selectEqHeader) {
      if (selectEqHeader && selectEqHeader.juchuKizaiHeadKbn === 1) {
        if (!isDirty) {
          await deleteLock(1, props.juchuHeadData.juchuHeadId);
          router.push(
            `/eq-keep-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectEqHeader.juchuKizaiHeadId}/edit`
          );
        } else {
          setPath(`/eq-keep-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectEqHeader.juchuKizaiHeadId}/edit`);
          setDirtyOpen(true);
        }
      } else {
        setAlertTitle('選択項目を確認してください');
        setAlertMessage('メイン明細を選択してください');
        setAlertOpen(true);
      }
    } else {
      setAlertTitle('選択項目を確認してください');
      setAlertMessage('メイン明細を選択してください');
      setAlertOpen(true);
    }
  };

  // コピーボタン押下
  const handleOpenCopyDialog = async () => {
    if (selectEqHeader && selectEqHeader.juchuKizaiHeadKbn === 1) {
      setCopyOpen(true);
    } else {
      setAlertTitle('選択項目を確認してください');
      setAlertMessage('メイン明細を選択してください');
      setAlertOpen(true);
    }
  };
  const handleCloseCopyDialog = () => {
    setCopyOpen(false);
  };

  /**
   * コピーダイアログボタン押下
   * @param result ボタン押下結果
   */
  const handleCopyConfirmed = async (data: CopyDialogValue) => {
    if (!user || !selectEqHeader) return;

    // ユーザー名
    const userNam = user.name;
    // 受注ヘッダーid
    const newJuchuHeadId = data.juchuHeadid ? Number(data.juchuHeadid) : getValues('juchuHeadId');

    const checkJuchuHeadId = await getJuchuHead(newJuchuHeadId);
    if (!checkJuchuHeadId) {
      setSnackBarMessage('受注番号がありません');
      setSnackBarOpen(true);
      return false;
    }

    // 出庫日
    const shukoDate = getShukoDate(
      data.kicsShukoDat && new Date(data.kicsShukoDat),
      data.yardShukoDat && new Date(data.yardShukoDat)
    );
    // 入庫日
    const nyukoDate = getNyukoDate(
      data.kicsNyukoDat && new Date(data.kicsNyukoDat),
      data.yardNyukoDat && new Date(data.yardNyukoDat)
    );
    // 出庫日から入庫日
    const dateRange = getRange(shukoDate, nyukoDate);

    if (!shukoDate || !nyukoDate) {
      return;
    }

    const copyResult = await copyJuchuKizaiHeadMeisai(
      selectEqHeader,
      newJuchuHeadId,
      data,
      shukoDate,
      nyukoDate,
      dateRange,
      userNam
    );

    if (copyResult) {
      setCopyOpen(false);
      setSnackBarMessage('コピーしました');
      setSnackBarOpen(true);
      if (!data.juchuHeadid || Number(data.juchuHeadid) === getValues('juchuHeadId')) {
        setIsJuchuKizaiLoading(true);
        const juchuKizaiHeadDatas = await getJuchuKizaiHeadList(getValues('juchuHeadId'));
        setEqHeaderList(juchuKizaiHeadDatas);
        setIsJuchuKizaiLoading(false);
      }
    } else {
      setSnackBarMessage('コピーに失敗しました');
      setSnackBarOpen(true);
    }

    return true;
  };

  // 受注明細削除ボタン押下
  const handleKizaiHeadDeleteCheck = async () => {
    if (!selectEqHeader || !eqHeaderList) {
      setAlertTitle('選択項目を確認してください');
      setAlertMessage('受注明細を1つ選択してください');
      setAlertOpen(true);
      return;
    }

    // 選択されたデータの子データ
    const childData = eqHeaderList.find((d) => d.oyaJuchuKizaiHeadId === selectEqHeader.juchuKizaiHeadId);

    if (childData) {
      setAlertTitle('選択項目を確認してください');
      setAlertMessage('返却、キープが紐づいている場合は削除できません');
      setAlertOpen(true);
      return;
    }

    setKizaiHeadDeleteOpen(true);
  };

  /**
   * 受注明細削除ダイアログボタン押下
   * @param result ボタン押下結果
   */
  const handleKizaiHeadDelete = async (result: boolean) => {
    setKizaiHeadDeleteOpen(false);
    if (result && selectEqHeader) {
      setIsJuchuKizaiLoading(true);

      const deleteResult = await delJuchuMeisai(selectEqHeader.juchuHeadId, selectEqHeader.juchuKizaiHeadId);

      if (deleteResult) {
        setEqHeaderList((prev) => prev?.filter((data) => data.juchuKizaiHeadId !== selectEqHeader.juchuKizaiHeadId));
        setSelectEq(null);
        setSelectEqHeader(null);
        setSnackBarMessage('削除しました');
        setSnackBarOpen(true);
      } else {
        setSnackBarMessage('削除に失敗しました');
        setSnackBarOpen(true);
      }
      setIsJuchuKizaiLoading(false);
    }
  };

  /**
   * 受注機材明細画面へ遷移
   * @param row クリックされた受注明細情報
   */
  const handleClickEqOrderName = async (row: EqTableValues) => {
    const mode = edit ? 'edit' : 'view';
    const path =
      row.juchuKizaiHeadKbn === 1
        ? `/eq-main-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${mode}`
        : row.juchuKizaiHeadKbn === 2
          ? `/eq-return-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${row.oyaJuchuKizaiHeadId}/${mode}`
          : row.juchuKizaiHeadKbn === 3
            ? `/eq-keep-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${row.oyaJuchuKizaiHeadId}/${mode}`
            : `/eq-main-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${mode}`;
    if (!isDirty) {
      await deleteLock(1, props.juchuHeadData.juchuHeadId);
      router.push(path);
    } else {
      setPath(path);
      setDirtyOpen(true);
    }
  };

  // 車両入力ボタン押下
  const handleAddVehicle = async () => {
    if (!isDirty) {
      await deleteLock(1, props.juchuHeadData.juchuHeadId);
      router.push(`/vehicle-order-detail/${props.juchuHeadData.juchuHeadId}/0/edit`);
    } else {
      setPath(`/vehicle-order-detail/${props.juchuHeadData.juchuHeadId}/0/edit`);
      setDirtyOpen(true);
    }
  };

  /**
   * 破棄ダイアログボタン押下
   * @param result ボタン押下結果
   */
  const handleResultDialog = async (result: boolean) => {
    if (result && path) {
      await deleteLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setIsDirty(false);
      router.push(path);
      setPath(null);
    } else if (result && !path) {
      await deleteLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      reset();
      setDirtyOpen(false);
    } else {
      setDirtyOpen(false);
      setPath(null);
    }
  };

  const handleEqSelectionChange = (selectedId: number) => {
    const selectData = eqHeaderList?.find((d) => d.juchuKizaiHeadId === selectedId);
    setSelectEq(selectedId);
    setSelectEqHeader(selectData!);
  };

  // 公演場所選択ダイアログ
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const handleOpenLocationDialog = () => {
    setLocationDialogOpen(true);
  };
  const handleCloseLocationDailog = () => {
    setLocationDialogOpen(false);
  };

  // 公演場所選択ダイアログで公演場所選択
  const handleLocSelect = (loc: string) => {
    setValue('koenbashoNam', loc, { shouldDirty: true });
    handleCloseLocationDailog();
  };

  // 相手選択ダイアログ
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const handleOpenCustomerDialog = () => {
    setCustomerDialogOpen(true);
  };
  const handleCloseCustomerDialog = () => {
    setCustomerDialogOpen(false);
  };

  // 相手選択ダイアログで相手選択
  const handleCustSelect = (customer: KokyakuValues) => {
    setValue('kokyaku.kokyakuId', customer.kokyakuId, { shouldDirty: true });
    setValue('kokyaku.kokyakuNam', customer.kokyakuNam, { shouldDirty: true });
    clearErrors('kokyaku.kokyakuNam');
    handleCloseCustomerDialog();
  };

  // 車両明細削除処理
  const handleDeleteVehs = async () => {
    await delJuchuSharyoMeisais(
      selectedVehs.map((d) => ({
        juchuHeadId: props.juchuHeadData.juchuHeadId,
        sharyoHeadId: d,
      }))
    );
    const newVehHeads = await getJuchuSharyoHeadList(props.juchuHeadData.juchuHeadId);
    setVehicleHeaderList(newVehHeads);
    setSelectedVehs([]);
    setSharyoHeadDeleteOpen(false);
  };

  if (user === null || isLoading)
    return (
      <Box height={'90vh'}>
        <Loading />
      </Box>
    );

  return (
    <Container disableGutters sx={{ minWidth: '100%', pb: 10 }} maxWidth={'xl'}>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        {lockData !== null && lockData.addUser !== user?.name && (
          <Grid2 container alignItems={'center'} spacing={2} px={4}>
            <Typography>{lockData.addDat && toJapanTimeString(new Date(lockData.addDat))}</Typography>
            <Typography>{lockData.addUser}</Typography>
            <Typography>編集中</Typography>
          </Grid2>
        )}
        <Grid2 container alignItems={'center'} spacing={2}>
          {!edit || (lockData !== null && lockData?.addUser !== user?.name) ? (
            <Typography>閲覧モード</Typography>
          ) : (
            <Typography>編集モード</Typography>
          )}
          <Button disabled={lockData && lockData?.addUser !== user?.name ? true : false} onClick={handleEdit}>
            変更
          </Button>
          <BackButton label={'戻る'} sx={{ display: save ? 'inline-flex' : 'none' }} />
        </Grid2>
      </Box>
      {/* --------------------------------受注ヘッダー------------------------------------- */}
      <Paper variant="outlined">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={2}>
            <Grid2>
              <Typography>受注ヘッダー</Typography>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button
                onClick={() => router.push(`/quotation-list/create?juchuId=${getValues('juchuHeadId')}`)}
                disabled={isDirty}
                sx={{ display: save ? 'inline-flex' : 'none' }}
              >
                <CreateIcon fontSize="small" />
                見積作成
              </Button>
              <Button
                color="error"
                onClick={() => setHeadDeleteOpen(true)}
                disabled={!edit}
                sx={{ display: save ? 'inline-flex' : 'none' }}
              >
                <Delete fontSize="small" />
                伝票削除
              </Button>
              {/* <Button disabled={!edit} onClick={handleCopy}>
                <ContentCopyIcon fontSize="small" />
                コピー
              </Button> */}
            </Grid2>
          </Grid2>
          <Divider />
          <Grid2 container spacing={{ xs: 0, sm: 0, md: 2 }}>
            <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
              <Box sx={styles.container}>
                <Typography marginRight={7} whiteSpace="nowrap">
                  受注番号
                </Typography>
                {getValues('juchuHeadId') === 0 ? (
                  <TextField slotProps={{ input: { readOnly: true } }} sx={{ width: 120 }} />
                ) : (
                  <TextFieldElement
                    name="juchuHeadId"
                    control={control}
                    type="number"
                    sx={{
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                      width: 120,
                    }}
                    slotProps={{ input: { readOnly: true } }}
                  />
                )}
              </Box>
              <Box sx={styles.container}>
                <Typography mr={1}>受注ステータス</Typography>
                <FormControl size="small" sx={{ width: 160 }}>
                  <Controller
                    name="juchuSts"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} disabled={!edit}>
                        <MenuItem value={0}>入力中</MenuItem>
                        <MenuItem value={1}>仮受注</MenuItem>
                        <MenuItem value={2}>処理中</MenuItem>
                        <MenuItem value={3}>確定</MenuItem>
                        <MenuItem value={4}>貸出済み</MenuItem>
                        <MenuItem value={5}>返却済み</MenuItem>
                        <MenuItem value={9}>受注キャンセル</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>受注日</Typography>
                <Controller
                  name="juchuDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TestDate
                      onBlur={field.onBlur}
                      date={field.value}
                      onChange={(newDate) => field.onChange(newDate?.toDate())}
                      fieldstate={fieldState}
                      disabled={!edit}
                      onClear={() => field.onChange(null)}
                    />
                  )}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>入力者</Typography>
                <FormControl size="small" sx={{ width: 160, minWidth: '80px' }}>
                  <Controller
                    name="nyuryokuUser"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} defaultValue={props.juchuHeadData.nyuryokuUser} disabled={!edit}>
                        {userList.map((u) => (
                          <MenuItem key={u.id} value={u.name}>
                            {u.name}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>
                {/*<TextFieldElement name="nyuryokuUser" control={control} disabled={!edit}></TextFieldElement>*/}
              </Box>
              <Box sx={styles.container}>
                <Typography mr={2}>出庫日/入庫日</Typography>
                <Controller
                  name="juchuRange"
                  control={control}
                  render={({ field }) => (
                    <Box>
                      <RSuiteDateRangePicker value={field.value} onChange={field.onChange} disabled={!edit} />
                      {errors.juchuRange && (
                        <Typography color="error" fontSize={'small'} sx={{ ml: 2 }}>
                          {errors.juchuRange.message}
                        </Typography>
                      )}
                    </Box>
                  )}
                />
              </Box>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
              <Box sx={styles.container}>
                <Typography marginRight={7}>公演名</Typography>
                <TextFieldElement name="koenNam" control={control} disabled={!edit}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={5}>公演場所</Typography>
                <TextFieldElement name="koenbashoNam" control={control} disabled={!edit}></TextFieldElement>
                <Button style={{ marginLeft: 5 }} onClick={() => handleOpenLocationDialog()} disabled={!edit}>
                  検索
                </Button>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>顧客</Typography>
                <Controller
                  name="kokyaku.kokyakuNam"
                  control={control}
                  render={({ field, fieldState }) => (
                    <>
                      <TextField
                        value={field.value}
                        slotProps={{ input: { readOnly: true } }}
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                      <Button style={{ marginLeft: 5 }} onClick={() => handleOpenCustomerDialog()} disabled={!edit}>
                        検索
                      </Button>
                    </>
                  )}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>顧客担当者</Typography>
                <TextFieldElement name="kokyakuTantoNam" control={control} disabled={!edit}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography mr={7}>税区分</Typography>
                <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                  <Controller
                    name="zeiKbn"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} disabled={!edit}>
                        <MenuItem value={0}>無し</MenuItem>
                        <MenuItem value={1}>内税</MenuItem>
                        <MenuItem value={2}>外税</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Box>
            </Grid2>
          </Grid2>
          <Box display={'flex'} alignItems={'center'} px={2} pb={2}>
            <Typography marginRight={3}>メモ</Typography>
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
          {/** 固定ボタン 保存＆ページトップ */}
          <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
            <Fab variant="extended" color="primary" type="submit" sx={{ mr: 2 }}>
              <SaveAsIcon sx={{ mr: 1 }} />
              保存
            </Fab>
            <Fab color="primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <ArrowUpwardIcon />
            </Fab>
          </Box>
        </form>
        {/* 公演場所検索ダイアログ */}
        <Dialog open={locationDialogOpen} fullScreen>
          <LocationSelectDialog
            handleLocSelect={handleLocSelect}
            handleCloseLocationDialog={handleCloseLocationDailog}
          />
        </Dialog>
        {/* 相手検索ダイアログ */}
        <Dialog open={customerDialogOpen} fullScreen>
          <CustomerSelectionDialog
            handleCustSelect={handleCustSelect}
            handleCloseCustDialog={handleCloseCustomerDialog}
          />
        </Dialog>
      </Paper>
      {/* --------------------------------受注明細（機材）------------------------------------- */}
      {save && (
        <Accordion sx={{ marginTop: 2, borderRadius: 1, overflow: 'hidden' }} defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
            <Grid2 container alignItems="center" justifyContent="space-between" sx={{ width: '100%' }} spacing={1}>
              <Grid2>
                <Typography>受注機材ヘッダー一覧</Typography>
              </Grid2>
              <Grid2 container display="flex" alignItems="center" spacing={1}>
                <Typography>合計金額</Typography>
                <TextField
                  sx={{
                    width: '40%',
                    minWidth: '90px',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 1,
                    },
                  }}
                  value={`¥${priceTotal.toLocaleString()}`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
              </Grid2>
              <Grid2 container spacing={1}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddEq();
                  }}
                  disabled={!edit}
                >
                  <AddIcon fontSize="small" />
                  機材入力
                </Button>
                <Button
                  //href="/order/equipment-return-order-detail"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddReturn();
                  }}
                  disabled={!edit}
                >
                  <AddIcon fontSize="small" />
                  返却入力
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddKeep();
                  }}
                  disabled={!edit}
                  sx={{ bgcolor: 'green' }}
                >
                  <AddIcon fontSize="small" />
                  キープ入力
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCopyDialog();
                  }}
                  disabled={!edit}
                >
                  <ContentCopyIcon fontSize="small" />
                  コピー
                </Button>
                <Button
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleKizaiHeadDeleteCheck();
                  }}
                  disabled={!edit}
                >
                  <Delete fontSize="small" />
                  受注明細削除
                </Button>
              </Grid2>
            </Grid2>
          </AccordionSummary>
          <Dialog open={copyOpen} sx={{ zIndex: 1201 }}>
            <CopyDialog
              selectEqHeader={selectEqHeader}
              handleCopyConfirmed={handleCopyConfirmed}
              handleCloseCopyDialog={handleCloseCopyDialog}
            />
          </Dialog>
          <AccordionDetails sx={{ padding: 0 }}>
            {isJuchuKizaiLoading ? (
              <Loading />
            ) : (
              eqHeaderList &&
              eqHeaderList?.length > 0 && (
                <OrderEqTable
                  orderEqRows={eqHeaderList}
                  edit={edit}
                  selectEq={selectEq}
                  onEqSelectionChange={handleEqSelectionChange}
                  handleClickEqOrderName={handleClickEqOrderName}
                />
              )
            )}
          </AccordionDetails>
        </Accordion>
      )}
      {/* -------------------------車両----------------------------------- */}
      {save && (
        <Accordion sx={{ marginTop: 2, borderRadius: 1, overflow: 'hidden' }} defaultExpanded variant="outlined">
          <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
            <Grid2 container alignItems="center" justifyContent="space-between" sx={{ width: '100%' }} spacing={1}>
              <Grid2>
                <Typography>受注車両ヘッダー一覧</Typography>
              </Grid2>
              <Grid2 container spacing={1}>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddVehicle();
                  }}
                  disabled={!edit}
                >
                  <AddIcon fontSize="small" />
                  車両入力
                </Button>

                <Button
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(selectedVehs);
                    setSharyoHeadDeleteOpen(true);
                  }}
                  disabled={!edit}
                >
                  <Delete fontSize="small" />
                  受注明細削除
                </Button>
              </Grid2>
            </Grid2>
          </AccordionSummary>
          <AccordionDetails sx={{ padding: 0 }}>
            {vehicleHeaderList && vehicleHeaderList?.length > 0 && (
              <OrderVehicleTable
                selected={selectedVehs}
                orderVehicleRows={vehicleHeaderList}
                setSelected={setSelectedVehs}
              />
            )}
          </AccordionDetails>
        </Accordion>
      )}
      <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
      <AlertDialog open={alertOpen} title={alertTitle} message={alertMessage} onClick={() => setAlertOpen(false)} />
      <HeadDeleteConfirmDialog open={headDeleteOpen} onClick={handleHeadDelete} />
      <KizaiHeadDeleteConfirmDialog open={kizaiHeadDeleteOpen} onClick={handleKizaiHeadDelete} />
      <WillDeleteAlertDialog
        open={sharyoHeadDeleteOpen}
        data={`${selectedVehs.length}件の車両明細`}
        title="削除"
        handleCloseDelete={() => setSharyoHeadDeleteOpen(false)}
        handleConfirmDelete={() => handleDeleteVehs()}
      />
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </Container>
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
    margin: 1,
    marginLeft: 2,
  },
};
