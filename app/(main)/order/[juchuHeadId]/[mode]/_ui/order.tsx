'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Delete from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
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
  TextField,
  Typography,
} from '@mui/material';
import { redirect, useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { deleteLock } from '@/app/_lib/db/tables/t-lock';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString } from '@/app/(main)/_lib/date-conversion';
import { addLock, getLock } from '@/app/(main)/_lib/funcs';
import { LockValues } from '@/app/(main)/_lib/types';
import { BackButton } from '@/app/(main)/_ui/buttons';
import DateX, { RSuiteDateRangePicker, TestDate } from '@/app/(main)/_ui/date';
import { IsDirtyAlertDialog, useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import { SelectTable } from '@/app/(main)/_ui/table';
import { equipmentRows, users, vehicleHeaders, vehicleRows } from '@/app/(main)/order/[juchuHeadId]/[mode]/_lib/data';

import { useUnsavedChangesWarning } from '../../../../_lib/hook';
import { addJuchuHead, copyJuchuHead, getJuchuHead, getMaxId, updJuchuHead } from '../_lib/funcs';
import { EqTableValues, KokyakuValues, OrderSchema, OrderValues, VehicleTableValues } from '../_lib/types';
import { CopyConfirmDialog, SaveAlertDialog, SelectAlertDialog } from './caveat-dialog';
import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';
import { OrderEqTable, OrderVehicleTable } from './order-table';

export const Order = (props: {
  juchuHeadData: OrderValues;
  juchuKizaiHeadDatas: EqTableValues[] | undefined;
  edit: boolean;
  //lockData: LockValues | null;
}) => {
  const router = useRouter();
  // user情報
  const user = useUserStore((state) => state.user);
  // userList
  const userList = users;
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // 保存フラグ
  const [save, setSave] = useState(false);
  // 機材ヘッダーデータ
  const [eqHeaderList, setEqHeaderList] = useState<EqTableValues[] | undefined>(props.juchuKizaiHeadDatas);
  // 車両ヘッダーデータ
  const [vehicleHeaderList, setVehicleHeaderList] = useState<VehicleTableValues[] | undefined>(vehicleRows);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 未保存ダイアログを出すかどうか
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログを出すかどうか
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 機材選択ダイアログを出すかどうか
  const [selectOpen, setSelectOpen] = useState(false);
  // コピーダイアログ
  const [copyOpen, setCopyOpen] = useState(false);
  // 機材テーブル選択行
  const [selectEq, setSelectEq] = useState<number[]>([]);
  // 車両テーブル選択行
  const [selectVehicle, setSelectVehicle] = useState<number[]>([]);
  // 遷移先path
  const [path, setPath] = useState<string | null>(null);

  // context
  const { setIsDirty, setIsSave, setLock } = useDirty();
  // 合計金額
  const priceTotal = eqHeaderList!.reduce((sum, row) => sum + (row.shokei ?? 0), 0);
  // 編集中かどうか
  const [isEditing, setIsEditing] = useState(false);

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
      nebikiAmt: props.juchuHeadData.nebikiAmt,
      zeiKbn: props.juchuHeadData.zeiKbn,
    },
    resolver: zodResolver(OrderSchema),
  });

  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(isDirty, save);

  /**
   * useEffect
   */
  useEffect(() => {
    if (!user) return;

    setValue('nyuryokuUser', user.name);
    if (getValues('juchuHeadId') === 0) return;
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
    setIsSave(save);
  }, [isDirty, save, setIsDirty, setIsSave]);

  useEffect(() => {
    setLock(lockData);
  }, [lockData, setLock]);

  useEffect(() => {
    if (props.juchuHeadData.juchuHeadId !== 0) {
      setSave(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 保存ボタン押下
  const onSubmit = async (data: OrderValues) => {
    console.log('update : 開始');
    if (!user) return;
    setIsLoading(true);
    setIsEditing(false);

    // 新規
    if (data.juchuHeadId === 0) {
      const maxId = await getMaxId();
      const newOrderId = maxId ? maxId.juchu_head_id + 1 : 1;
      await addJuchuHead(newOrderId, data, user.name);
      redirect(`/order/${newOrderId}/edit`);
      // 更新
    } else {
      const update = await updJuchuHead(data);
      reset(data);
      setSave(true);
      setIsLoading(false);
      console.log('update : ', update);
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

  // コピーボタン押下
  const handleCopy = async () => {
    if (!save || isDirty) {
      setSaveOpen(true);
      return;
    }

    setCopyOpen(true);
  };

  // 機材入力ボタン押下
  const handleAddEq = async () => {
    if (!save) {
      setSaveOpen(true);
      return;
    }

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
    if (!save) {
      setSaveOpen(true);
      return;
    }

    if (selectEq.length === 1 && eqHeaderList) {
      const selectData = eqHeaderList.find((d) => d.juchuKizaiHeadId === selectEq[0]);
      if (selectData && selectData.juchuKizaiHeadKbn === 1) {
        if (!isDirty) {
          await deleteLock(1, props.juchuHeadData.juchuHeadId);
          router.push(
            `/eq-return-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectData.juchuKizaiHeadId}/edit`
          );
        } else {
          setPath(`/eq-return-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectData.juchuKizaiHeadId}/edit`);
          setDirtyOpen(true);
        }
      } else {
        setSelectOpen(true);
      }
    } else {
      setSelectOpen(true);
    }
  };

  // キープ入力ボタン押下
  const handleAddKeep = async () => {
    if (!save) {
      setSaveOpen(true);
      return;
    }

    if (selectEq.length === 1 && eqHeaderList) {
      const selectData = eqHeaderList.find((d) => d.juchuKizaiHeadId === selectEq[0]);
      if (selectData && selectData.juchuKizaiHeadKbn === 1) {
        if (!isDirty) {
          await deleteLock(1, props.juchuHeadData.juchuHeadId);
          router.push(`/eq-keep-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectData.juchuKizaiHeadId}/edit`);
        } else {
          setPath(`/eq-keep-order-detail/${props.juchuHeadData.juchuHeadId}/0/${selectData.juchuKizaiHeadId}/edit`);
          setDirtyOpen(true);
        }
      } else {
        setSelectOpen(true);
      }
    } else {
      setSelectOpen(true);
    }
  };

  // 車両入力ボタン押下
  const handleAddVehicle = async () => {
    if (!save) {
      setSaveOpen(true);
      return;
    }

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
      setIsSave(true);
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

  /**
   * コピーダイアログボタン押下
   * @param result ボタン押下結果
   */
  const handleCopyResultDialog = async (result: boolean) => {
    if (result) {
      const maxId = await getMaxId();
      if (maxId) {
        const newOrderId = maxId.juchu_head_id + 1;
        const currentData = await getJuchuHead(props.juchuHeadData.juchuHeadId);
        if (user && currentData) {
          await copyJuchuHead(newOrderId, currentData, user.name);
        }
        window.open(`/order/${newOrderId}/${'edit'}`);
        setCopyOpen(false);
      } else {
        console.error('Failed to retrieve max order ID');
      }
    } else {
      setCopyOpen(false);
    }
  };

  const handleEqSelectionChange = (selectedIds: number[]) => {
    setSelectEq(selectedIds);
  };

  const handleVehicleSelectionChange = (selectedIds: number[]) => {
    setSelectVehicle(selectedIds);
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

  if (user === null || isLoading)
    return (
      <Box height={'90vh'}>
        <Loading />
      </Box>
    );

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        {lockData !== null && lockData.addUser !== user?.name && (
          <Grid2 container alignItems={'center'} spacing={2} px={4}>
            <Typography>{lockData.addDat && toISOString(new Date(lockData.addDat))}</Typography>
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
          <BackButton label={'戻る'} />
        </Grid2>
      </Box>
      {/* --------------------------------受注ヘッダー------------------------------------- */}
      <Paper>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={2}>
            <Grid2>
              <Typography>受注ヘッダー</Typography>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button color="error" disabled={!edit}>
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
          <Box position={'fixed'} zIndex={1050} bottom={10} right={10}>
            <Fab variant="extended" color="primary" sx={{ margin: 1 }} type="submit" size="medium">
              <CheckIcon fontSize="small" sx={{ mr: 1 }} />
              保存
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
      <Accordion sx={{ marginTop: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" py={1} sx={{ width: '100%' }} spacing={1}>
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
              <Button disabled={!edit}>
                <ContentCopyIcon fontSize="small" />
                コピー
              </Button>
              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log(selectEq);
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
          {eqHeaderList && eqHeaderList?.length > 0 && (
            <OrderEqTable orderEqRows={eqHeaderList} edit={edit} onEqSelectionChange={handleEqSelectionChange} />
          )}
        </AccordionDetails>
      </Accordion>
      {/* -------------------------車両----------------------------------- */}
      <Accordion sx={{ marginTop: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" py={1} sx={{ width: '100%' }} spacing={1}>
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
                  console.log(selectVehicle);
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
              orderVehicleRows={vehicleHeaderList}
              onVehicleSelectionChange={handleVehicleSelectionChange}
            />
          )}
        </AccordionDetails>
      </Accordion>
      <SaveAlertDialog open={saveOpen} onClick={() => setSaveOpen(false)} />
      <IsDirtyAlertDialog open={dirtyOpen} onClick={handleResultDialog} />
      <SelectAlertDialog open={selectOpen} onClick={() => setSelectOpen(false)} />
      <CopyConfirmDialog open={copyOpen} onClick={handleCopyResultDialog} />
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
    margin: 1,
    marginLeft: 2,
  },
};
