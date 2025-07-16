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
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { use, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import DateX, { RSuiteDateRangePicker, TestDate, toISOString, toISOStringWithTimezone } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import { SelectTable } from '@/app/(main)/_ui/table';
import { equipmentRows, vehicleHeaders, vehicleRows } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/data';

import { AddLock, DeleteLock, GetLock, Update } from '../_lib/funcs';
import { JuchuHeadSchema, KokyakuValues, LockValues, NewOrderSchema, NewOrderValues } from '../_lib/types';
import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';
import { OrderEqTable } from './order-table';

export const Order = (props: { order: NewOrderValues; edit: boolean; lockData: LockValues | null }) => {
  // user情報
  const user = useUserStore((state) => state.user);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(props.lockData);
  // 合計金額
  const priceTotal = equipmentRows.reduce((sum, row) => sum + (row.price ?? 0), 0);

  /* useForm ------------------------- */
  const {
    watch,
    control,
    handleSubmit,
    reset,
    setValue,
    clearErrors,
    formState: { isDirty, dirtyFields, errors },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      juchuHeadId: props.order.juchuHeadId,
      delFlg: props.order.delFlg,
      juchuSts: props.order.juchuSts,
      juchuDat: new Date(props.order.juchuDat),
      juchuRange:
        props.order.juchuRange !== null
          ? ([
              props.order.juchuRange[0] ? new Date(props.order.juchuRange[0]) : new Date(''),
              props.order.juchuRange[1] ? new Date(props.order.juchuRange[1]) : new Date(''),
            ] as [Date, Date])
          : null,
      nyuryokuUser: props.order.nyuryokuUser,
      koenNam: props.order.koenNam,
      koenbashoNam: props.order.koenbashoNam,
      kokyaku: props.order.kokyaku,
      kokyakuTantoNam: props.order.kokyakuTantoNam,
      mem: props.order.mem,
      nebikiAmt: props.order.nebikiAmt,
      zeiKbn: props.order.zeiKbn,
    },
    resolver: zodResolver(NewOrderSchema),
  });

  useEffect(() => {
    if (!user) return;
    setEdit(!props.edit || (props.lockData !== null && props.lockData.addUser !== user.name) ? false : true);

    const asyncProcess = async () => {
      if (props.edit && props.lockData === null) {
        await AddLock(1, props.order.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.order.juchuHeadId);
        setLockData(newLockData);
      }
    };
    asyncProcess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSubmit = async (data: NewOrderValues) => {
    console.log('update : 開始');
    const update = await Update(data);
    console.log('update : ', update);
  };

  // 編集モード変更
  const handleEdit = async () => {
    if (edit) {
      await DeleteLock(1, props.order.juchuHeadId);
      const newLockData = await GetLock(1, props.order.juchuHeadId);
      setLockData(newLockData);
      setEdit(!edit);
    } else {
      if (!user) return;
      await AddLock(1, props.order.juchuHeadId, user.name);
      const newLockData = await GetLock(1, props.order.juchuHeadId);
      setLockData(newLockData);
      setEdit(!edit);
    }
  };

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };

  // 公演場所選択ダイアログ
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const handleOpenLocationDialog = () => {
    setLocationDialogOpen(true);
  };
  const handleCloseLocationDailog = () => {
    setLocationDialogOpen(false);
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
  const handleCustomerSelect = (customer: KokyakuValues) => {
    setValue('kokyaku.kokyakuId', customer.kokyakuId);
    setValue('kokyaku.kokyakuNam', customer.kokyakuNam);
    clearErrors('kokyaku.kokyakuNam');
    handleCloseCustomerDialog();
  };

  if (user === null)
    return (
      <Box height={'90vh'}>
        <Loading />
      </Box>
    );

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'}>
        {lockData !== null && lockData.addUser !== user?.name && (
          <Grid2 container alignItems={'center'} spacing={2} px={4}>
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
      </Box>
      {/* --------------------------------受注ヘッダー------------------------------------- */}
      <Paper>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container display="flex" alignItems="center" justifyContent="space-between" p={2}>
            <Grid2>
              <Typography>受注ヘッダー</Typography>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button type="submit" disabled={!edit}>
                <CheckIcon fontSize="small" />
                保存
              </Button>
              <Button color="error" disabled={!edit}>
                <Delete fontSize="small" />
                伝票削除
              </Button>
              <Button disabled={!edit}>
                <ContentCopyIcon fontSize="small" />
                コピー
              </Button>
            </Grid2>
          </Grid2>
          <Divider />
          <Grid2 container spacing={{ xs: 0, sm: 0, md: 2 }}>
            <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
              <Grid2 container margin={2} spacing={2}>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography marginRight={5} whiteSpace="nowrap">
                    受注番号
                  </Typography>
                  <TextFieldElement
                    name="juchuHeadId"
                    control={control}
                    type="number"
                    sx={{
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                    slotProps={{ input: { readOnly: true } }}
                  ></TextFieldElement>
                </Grid2>
                <Grid2 display="flex" direction="row" alignItems="center">
                  <Typography mr={2}>受注ステータス</Typography>
                  <FormControl size="small" sx={{ width: 120 }}>
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
                </Grid2>
              </Grid2>
              <Box sx={styles.container}>
                <Typography marginRight={7}>受注日</Typography>
                <Controller
                  name="juchuDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Box>
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        onChange={(newDate) => field.onChange(newDate?.toDate())}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    </Box>
                  )}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>入力者</Typography>
                <TextFieldElement name="nyuryokuUser" control={control} disabled={!edit}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography mr={2}>
                  受注開始日/
                  <br />
                  受注終了日
                </Typography>
                <Controller
                  name="juchuRange"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Box>
                      <RSuiteDateRangePicker value={field.value} onChange={field.onChange} disabled={!edit} />
                      {/* {fieldState.error && (
                        <Typography color="error" fontSize={'small'} sx={{ ml: 2 }}>
                          {fieldState.error.message}
                        </Typography>
                      )} */}
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
                <Button onClick={() => handleOpenLocationDialog()} disabled={!edit}>
                  検索
                </Button>
                <Dialog open={locationDialogOpen} fullScreen>
                  <LocationSelectDialog handleCloseLocationDialog={handleCloseLocationDailog} />
                </Dialog>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>相手</Typography>
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
                      <Button onClick={() => handleOpenCustomerDialog()} disabled={!edit}>
                        検索
                      </Button>
                      <Dialog open={customerDialogOpen} fullScreen>
                        <CustomerSelectionDialog
                          handleCustomerSelect={handleCustomerSelect}
                          handleCloseCustDialog={handleCloseCustomerDialog}
                        />
                      </Dialog>
                    </>
                  )}
                />
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={3}>相手担当者</Typography>
                <TextFieldElement name="kokyakuTantoNam" control={control} disabled={!edit}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={9}>メモ</Typography>
                <TextFieldElement name="mem" control={control} disabled={!edit}></TextFieldElement>
              </Box>
              <Box sx={styles.container}>
                <Typography marginRight={7}>値引き</Typography>
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
                <Typography ml={4} mr={2}>
                  税区分
                </Typography>
                <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                  <Controller
                    name="zeiKbn"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} disabled={!edit}>
                        <MenuItem value={1}>内税</MenuItem>
                        <MenuItem value={2}>外税</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Box>
            </Grid2>
          </Grid2>
        </form>
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
                value={'¥' + priceTotal}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled
              ></TextField>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button
                href="/order/equipment-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={!edit}
              >
                <AddIcon fontSize="small" />
                機材入力
              </Button>
              <Button
                href="/order/equipment-return-order-detail"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled={!edit}
              >
                <AddIcon fontSize="small" />
                返却入力
              </Button>
              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
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
          <OrderEqTable orderRows={equipmentRows} edit={edit} onSelectionChange={handleSelectionChange} />
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
                href="/order/vehicle-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
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
          <SelectTable headers={vehicleHeaders} datas={vehicleRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
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
