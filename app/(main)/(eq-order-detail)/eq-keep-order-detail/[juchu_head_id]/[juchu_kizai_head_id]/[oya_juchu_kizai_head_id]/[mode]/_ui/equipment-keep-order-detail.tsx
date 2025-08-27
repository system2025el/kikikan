'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import AddIcon from '@mui/icons-material/Add';
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
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toISOString, toISOStringMonthDay } from '@/app/(main)/_lib/date-conversion';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { Calendar, TestDate } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';
import { Loading } from '@/app/(main)/_ui/loading';
import Time, { TestTime } from '@/app/(main)/_ui/time';
import { OyaJuchuKizaiHeadValues } from '@/app/(main)/(eq-order-detail)/_lib/types';
import { OyaEqSelectionDialog } from '@/app/(main)/(eq-order-detail)/_ui/equipment-selection-dialog';
import {
  JuchuKizaiHeadValues,
  JuchuKizaiMeisaiValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';
import { AddLock, DeleteLock, GetLock } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/funcs';
import { LockValues, OrderValues } from '@/app/(main)/order/[juchu_head_id]/[mode]/_lib/types';

import { data, stock } from '../_lib/data';
import { KeepJuchuKizaiHeadSchema, KeepJuchuKizaiHeadValues, KeepJuchuKizaiMeisaiValues } from '../_lib/types';
import { KeepEqTable } from './equipment-keep-order-detail-table';

export const EquipmentKeepOrderDetail = (props: {
  juchuHeadData: OrderValues;
  oyaJuchuKizaiHeadData: OyaJuchuKizaiHeadValues;
  keepJuchuKizaiHeadData: KeepJuchuKizaiHeadValues;
  keepJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] | undefined;
  oyaShukoDate: Date;
  oyaNyukoDate: Date;
  keepShukoDate: Date | null;
  keepNyukoDate: Date | null;
  edit: boolean;
}) => {
  // user情報
  const user = useUserStore((state) => state.user);
  // ロックデータ
  const [lockData, setLockData] = useState<LockValues | null>(null);
  // 受注機材ヘッダー保存フラグ
  const saveKizaiHead = props.keepJuchuKizaiHeadData.juchuKizaiHeadId !== 0 ? true : false;
  // 全体の保存フラグ
  const [save, setSave] = useState(false);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 編集モード(true:編集、false:閲覧)
  const [edit, setEdit] = useState(props.edit);

  // 受注機材明細キープ元リスト
  const [originKeepJuchuKizaiMeisaiList, setOriginKeepJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>(
    props.keepJuchuKizaiMeisaiData ? props.keepJuchuKizaiMeisaiData : []
  );
  // 受注機材明細キープリスト
  const [keepJuchuKizaiMeisaiList, setKeepJuchuKizaiMeisaiList] = useState<KeepJuchuKizaiMeisaiValues[]>(
    props.keepJuchuKizaiMeisaiData ? props.keepJuchuKizaiMeisaiData : []
  );

  // 親出庫日
  const [oyaShukoDate, setShukoDate] = useState<Date | null>(props.oyaShukoDate);
  // 親入庫日
  const [oyaNyukoDate, setNyukoDate] = useState<Date | null>(props.oyaNyukoDate);
  // キープ出庫日
  const [keepShukoDate, setKeepShukoDate] = useState<Date | null>(props.keepShukoDate);
  // キープ入庫日
  const [keepNyukoDate, setKeepNyukoDate] = useState<Date | null>(props.keepNyukoDate);

  // 未保存ダイアログを出すかどうか
  const [saveOpen, setSaveOpen] = useState(false);
  // 編集内容が未保存ダイアログを出すかどうか
  const [dirtyOpen, setDirtyOpen] = useState(false);
  // 機材追加ダイアログ制御
  const [EqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);

  // アコーディオン制御
  const [expanded, setExpanded] = useState(false);
  // ポッパー制御
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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
    clearErrors,
    formState: { isDirty, errors, defaultValues },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onBlur',
    defaultValues: {
      juchuHeadId: props.keepJuchuKizaiHeadData.juchuHeadId,
      juchuKizaiHeadId: props.keepJuchuKizaiHeadData.juchuKizaiHeadId,
      juchuKizaiHeadKbn: props.keepJuchuKizaiHeadData.juchuKizaiHeadKbn,
      mem: props.keepJuchuKizaiHeadData.mem,
      headNam: props.keepJuchuKizaiHeadData.headNam,
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
      const lockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (props.edit && lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
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
    if (
      saveKizaiHead &&
      JSON.stringify(originKeepJuchuKizaiMeisaiList) === JSON.stringify(filterJuchuKizaiMeisaiList)
    ) {
      setSave(true);
      setIsSave(true);
    } else {
      setSave(false);
      setIsSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepJuchuKizaiMeisaiList]);

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
      if (isDirty || JSON.stringify(originKeepJuchuKizaiMeisaiList) !== JSON.stringify(filterJuchuKizaiMeisaiList)) {
        setDirtyOpen(true);
        return;
      }

      await DeleteLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(null);
      setEdit(false);
      // 閲覧→編集
    } else {
      if (!user) return;
      const lockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
      setLockData(lockData);
      if (lockData === null) {
        await AddLock(1, props.juchuHeadData.juchuHeadId, user.name);
        const newLockData = await GetLock(1, props.juchuHeadData.juchuHeadId);
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
    console.log('保存開始');
    if (!user) return;
    setIsLoading(true);
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
   * KICS出庫日時変更時
   * @param newDate KICS出庫日
   */
  const handleKicsShukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsShukoDat', newDate.toDate(), { shouldDirty: true });

    const yardShukoDat = getValues('yardShukoDat');

    if (yardShukoDat === null) {
      clearErrors('yardShukoDat');
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

    if (kicsShukoDat === null) {
      clearErrors('kicsShukoDat');
    }
  };

  /**
   * KICS入庫日時変更時
   * @param newDate KICS入庫日
   */
  const handleKicsNyukoChange = async (newDate: Dayjs | null) => {
    if (newDate === null) return;
    setValue('kicsNyukoDat', newDate.toDate(), { shouldDirty: true });

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

    const kicsNyukoDat = getValues('kicsNyukoDat');

    if (kicsNyukoDat === null) {
      clearErrors('kicsNyukoDat');
    }
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

  // アコーディオン開閉
  const handleExpansion = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };
  // 機材入力ダイアログ開閉
  const handleOpenEqDialog = () => {
    setEqSelectionDialogOpen(true);
  };

  /**
   * 機材テーブルのキープ数入力時
   * @param kizaiId 機材id
   * @param keepValue キープ数
   */
  const handleCellChange = (kizaiId: number, keepValue: number) => {
    setKeepJuchuKizaiMeisaiList((prev) =>
      prev.map((data) => (data.kizaiId === kizaiId && !data.delFlag ? { ...data, plankeepQty: keepValue } : data))
    );
  };

  const setEqpts = async (data: JuchuKizaiMeisaiValues[]) => {
    const ids = new Set(keepJuchuKizaiMeisaiList.filter((d) => !d.delFlag).map((d) => d.kizaiId));
    const filterData = data.filter((d) => !ids.has(d.kizaiId));
    const newOyaJuchuKizaiMeisaiData: KeepJuchuKizaiMeisaiValues[] = filterData.map((d) => ({
      juchuHeadId: d.juchuHeadId,
      juchuKizaiHeadId: 0,
      juchuKizaiMeisaiId: 0,
      shozokuId: d.shozokuId,
      shozokuNam: d.shozokuNam,
      mem: '',
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      oyaPlanKizaiQty: d.planKizaiQty,
      oyaPlanYobiQty: d.planYobiQty ?? 0,
      plankeepQty: 0,
      delFlag: false,
      saveFlag: false,
    }));
    setKeepJuchuKizaiMeisaiList((prev) => [...prev, ...newOyaJuchuKizaiMeisaiData]);
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
        <Accordion sx={{ mt: 2 }} defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div" sx={{ bgcolor: 'green', color: 'white' }}>
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
              <Button>
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
              <Grid2 order={{ xl: 1 }} width={380}>
                <Typography>親伝票出庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={new Date(props.oyaJuchuKizaiHeadData.kicsShukoDat)} onChange={() => {}} disabled />
                  <TestTime time={new Date(props.oyaJuchuKizaiHeadData.kicsShukoDat)} onChange={() => {}} disabled />
                </Grid2>
                <Grid2>
                  <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={new Date(props.oyaJuchuKizaiHeadData.yardShukoDat)} onChange={() => {}} disabled />
                  <TestTime time={new Date(props.oyaJuchuKizaiHeadData.yardShukoDat)} onChange={() => {}} disabled />
                </Grid2>
              </Grid2>
              <Grid2 width={380} order={{ xl: 4 }}>
                <Typography>親伝票入庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={new Date(props.oyaJuchuKizaiHeadData.kicsNyukoDat)} onChange={() => {}} disabled />
                  <TestTime time={new Date(props.oyaJuchuKizaiHeadData.kicsNyukoDat)} onChange={() => {}} disabled />
                </Grid2>
                <Grid2>
                  <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <TestDate date={new Date(props.oyaJuchuKizaiHeadData.yardNyukoDat)} onChange={() => {}} disabled />
                  <TestTime time={new Date(props.oyaJuchuKizaiHeadData.yardNyukoDat)} onChange={() => {}} disabled />
                </Grid2>
              </Grid2>
              <Grid2 width={380} order={{ xl: 2 }}>
                <Typography>キープ入庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="kicsNyukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        // maxDate={keepShukoDate ? keepShukoDate : (oyaShukoDate ?? undefined)}
                        // minDate={oyaShukoDate ?? undefined}
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
                        onChange={(newTime) => {
                          field.onChange(newTime?.toDate());
                          const yardShukoDat = getValues('yardShukoDat');
                          if (yardShukoDat === null) {
                            clearErrors('yardShukoDat');
                          }
                        }}
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
                        // maxDate={keepShukoDate ? keepShukoDate : (oyaShukoDate ?? undefined)}
                        // minDate={oyaNyukoDate ?? undefined}
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
                        onChange={(newTime) => {
                          field.onChange(newTime?.toDate());
                          const yardShukoDat = getValues('yardShukoDat');
                          if (yardShukoDat === null) {
                            clearErrors('yardShukoDat');
                          }
                        }}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>
              <Grid2 width={380} order={{ xl: 3 }}>
                <Typography>キープ出庫日時</Typography>
                <Grid2>
                  <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                  <Controller
                    name="kicsShukoDat"
                    control={control}
                    render={({ field, fieldState }) => (
                      <TestDate
                        onBlur={field.onBlur}
                        date={field.value}
                        // maxDate={oyaShukoDate ?? undefined}
                        // minDate={keepNyukoDate ? keepNyukoDate : (oyaNyukoDate ?? undefined)}
                        onChange={handleKicsShukoChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={() => field.onChange(null)}
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
                        onChange={(newTime) => {
                          field.onChange(newTime?.toDate());
                          const yardShukoDat = getValues('yardShukoDat');
                          if (yardShukoDat === null) {
                            clearErrors('yardShukoDat');
                          }
                        }}
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
                        // maxDate={oyaShukoDate ?? undefined}
                        // minDate={keepNyukoDate ? keepNyukoDate : (oyaNyukoDate ?? undefined)}
                        onChange={handleYardShukoChange}
                        fieldstate={fieldState}
                        disabled={!edit}
                        onClear={() => field.onChange(null)}
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
                        onChange={(newTime) => {
                          field.onChange(newTime?.toDate());
                          const yardShukoDat = getValues('yardShukoDat');
                          if (yardShukoDat === null) {
                            clearErrors('yardShukoDat');
                          }
                        }}
                        fieldstate={fieldState}
                        disabled={!edit}
                      />
                    )}
                  />
                </Grid2>
              </Grid2>
            </Grid2>
            <Grid2 container alignItems="center" p={2} spacing={2}>
              <Grid2 container alignItems="center">
                <Typography>メモ</Typography>
                <TextFieldElement name="mem" control={control} multiline rows={3} disabled={!edit}></TextFieldElement>
              </Grid2>
              <Grid2 container alignItems="center">
                <Typography>入出庫ステータス</Typography>
                <TextField disabled defaultValue={'準備中'}></TextField>
              </Grid2>
            </Grid2>
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
          <Box width={'min-content'} display={Object.keys(keepJuchuKizaiMeisaiList).length > 0 ? 'block' : 'none'}>
            <KeepEqTable
              rows={keepJuchuKizaiMeisaiList}
              edit={edit}
              handleMemoChange={handleMemoChange}
              onChange={handleCellChange}
            />
          </Box>
        </Box>
      </Paper>
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
    margin: 2,
    marginLeft: 2,
  },
  // ボタン
  button: {},
};
