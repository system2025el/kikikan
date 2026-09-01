'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import UpdateIcon from '@mui/icons-material/Update';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { BASHO_ID, NYUSHUKO_SHUBETU_ID } from '@/app/_lib/constants';

import { weeklyColors } from '../../_lib/colors';
import {
  toJapanDayString,
  toJapanHHmmString,
  toJapanYMDAndDayString,
  toJapanYMDString,
} from '../../_lib/date-conversion';
import { permission } from '../../_lib/permission';
import { openOrFocusTab } from '../../_lib/tab-focus';
import { User } from '../../_lib/types';
import { FormDateX } from '../../_ui/date';
import { LoadingOverlay } from '../../_ui/loading';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { getWeeklyScheduleList } from '../_lib/funcs';
import { WeeklyScheduleValues, WeeklySearchSchema, WeeklySearchValues, WeeklyValues } from '../_lib/types';
import { TantoDialog } from './tanto-dialog';

/**
 * Weekly スケジュール画面
 * @returns {JSX.Element} Weekly スケジュール画面
 */
export const Schedule = ({ user }: { user: User }) => {
  /* useState ------------------------------------------------------------ */
  /** 表示するスケジュールのリスト */
  const [scheList, setScheList] = useState<WeeklyScheduleValues[]>([]);
  /** ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /** 日直入力ダイアログ開閉 */
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  /** 選ばれた日にちの情報 */
  const [selectedDatas, setSelectedDatas] = useState<WeeklyValues>({
    dat: '',
    tantoNam: null,
    mem: null,
    holidayFlg: false,
  });
  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useForm ------------------------------------------------------------- */
  const { handleSubmit, control, reset, getValues, setValue } = useForm<WeeklySearchValues>({
    mode: 'onBlur',
    defaultValues: {
      startDate: new Date(new Date().setHours(0, 0, 0, 0)),
      endDate: dayjs(new Date(new Date().setHours(0, 0, 0, 0)))
        .add(30, 'day')
        .toDate(),
      //dateCount: 31,
    },
    resolver: zodResolver(WeeklySearchSchema),
  });

  const startDate = useWatch({ control, name: 'startDate' });
  const endDate = useWatch({ control, name: 'endDate' });

  /* permission ---------------------------------------------------------- */
  /** 入出庫一覧の参照権限 */
  const canRefNyushuko = !!(user?.permission.nyushuko & permission.nyushuko_ref);
  /** 受注(伝票)画面の参照権限 */
  const canRefJuchu = !!(user?.permission.juchu & permission.juchu_ref);

  // useEffect(() => {
  //   if (startDate && endDate) {
  //     // 終了日 - 開始日の計算
  //     const start = dayjs(startDate).tz('Asia/Tokyo').startOf('day');
  //     const end = dayjs(endDate).tz('Asia/Tokyo').startOf('day');
  //     const count = end.diff(start, 'day') + 1;
  //     console.log(count);

  //     if (count > 0) {
  //       setValue('dateCount', count, { shouldValidate: true });
  //     }
  //   }
  // }, [startDate, endDate, setValue]);

  /* methods ------------------------------------------------------------- */
  /** 再描画押下時処理 */
  const onSubmit = async (data: WeeklySearchValues) => {
    setIsLoading(true);
    sessionStorage.setItem('weekly', JSON.stringify(data));
    try {
      const list = await getWeeklyScheduleList(data);
      setScheList(list);
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
      setSnackBarMessage('データ取得エラー');
      setSnackBarOpen(true);
    }
  };

  /** テーブル上部の日直・メモをクリックしたときの処理 */
  const handleClickDateHead = (data: WeeklyValues) => {
    setSelectedDatas(data);
    setDialogOpen(true);
  };

  /**
   * 積み/降ろし・車両の列をクリックしたときの処理。
   * 積み(出庫)なら出庫一覧、降ろし(入庫)なら入庫一覧を、受注番号と入出庫日で絞り込んだ状態で別タブに開く。
   * 一覧側は sessionStorage の検索条件を読んで初期表示するため、遷移前に書き込む。
   */
  const handleClickNyushuko = (juchuHeadId: number, nyushukoShubetuId: number | null, nyushukoDat: string | null) => {
    if (!canRefNyushuko) return;

    const isShuko = nyushukoShubetuId === NYUSHUKO_SHUBETU_ID.shuko;
    // 入出庫日はその明細の1日だけに絞る（指定期間のfrom/toに同じ日を入れる）。
    // 一覧側はDatePickerで手入力されたDateを想定しているため、同じ「ローカル0時のDate」の形にそろえる
    const nyushukoDate = nyushukoDat ? dayjs(toJapanYMDString(nyushukoDat, '-')).toDate() : null;
    sessionStorage.setItem(
      isShuko ? 'shukoListSearchParams' : 'nyukoListSearchParams',
      JSON.stringify({
        selectedDate: { value: '4', range: { from: nyushukoDate, to: nyushukoDate } },
        juchuHeadId: juchuHeadId,
        [isShuko ? 'shukoBasho' : 'nyukoBasho']: 0,
        kokyaku: '',
        koenNam: '',
        section: [],
      })
    );
    openOrFocusTab(isShuko ? '/shuko-list' : '/nyuko-list');
  };

  /** 顧客名・公演名・車両ヘッダー名の列をクリックしたときの処理。受注(伝票)画面を別タブに開く */
  const handleClickJuchu = (juchuHeadId: number) => {
    if (!canRefJuchu) return;
    openOrFocusTab(`/order/${juchuHeadId}/view`);
  };

  /* useEffect ----------------------------------------------------------- */
  /** 初期描画 */
  useEffect(() => {
    // メモリ上に検索条件があるか確認
    const searchPramsString = sessionStorage.getItem('weekly');
    const searchParams = searchPramsString ? JSON.parse(searchPramsString) : null;

    const getSchedule = async (data: WeeklySearchValues) => {
      const list = await getWeeklyScheduleList(data);
      setScheList(list);
      setIsLoading(false);
    };
    try {
      if (searchParams) {
        setIsLoading(true);
        // 検索条件表示と検索
        reset({ startDate: new Date(searchParams.startDate), endDate: new Date(searchParams.endDate) });
        getSchedule(searchParams);
      } else {
        getSchedule({
          startDate: new Date(new Date().setHours(0, 0, 0, 0)),
          endDate: dayjs(new Date(new Date().setHours(0, 0, 0, 0)))
            .add(30, 'day')
            .toDate() /*, dateCount: 31*/,
        });
      }
    } catch (e) {
      setIsLoading(false);
      setSnackBarMessage('データ取得エラー');
      setSnackBarOpen(true);
    }
  }, [reset]);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }}>
      <Paper
        component={'form'}
        onSubmit={handleSubmit(onSubmit)}
        variant="outlined"
        //sx={{ mb: 1, px: 2, display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
      >
        <Grid2>
          <Typography px={2}>スケジュール</Typography>
        </Grid2>
        <Divider />
        <Grid2 container sx={styles.boxStyle} spacing={1} py={0.5} px={2} mt={{ xs: 1, md: 0 }}>
          <Grid2 sx={styles.boxStyle}>
            <Typography>表示開始日</Typography>
            <Controller
              name="startDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormDateX
                  value={field.value}
                  onChange={field.onChange}
                  sx={{ width: 160, mr: 2, ml: 1 }}
                  error={!!error}
                  helperText={error?.message}
                  minDate={endDate ? dayjs(endDate).subtract(89, 'day').toDate() : undefined}
                  maxDate={endDate ? endDate : undefined}
                  notClearable
                />
              )}
            />
          </Grid2>
          <Grid2 sx={styles.boxStyle}>
            <Typography>表示終了日</Typography>
            <Controller
              name="endDate"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <FormDateX
                  value={field.value}
                  onChange={field.onChange}
                  sx={{ width: 160, mr: 2, ml: 1 }}
                  error={!!error}
                  helperText={error?.message}
                  minDate={startDate ? startDate : undefined}
                  maxDate={startDate ? dayjs(startDate).add(89, 'day').toDate() : undefined}
                  notClearable
                />
              )}
            />
          </Grid2>
          {/* <Grid2 sx={styles.boxStyle}>
            <Typography>表示日数</Typography>
            <TextFieldElement
              name="dateCount"
              control={control}
              sx={{
                width: 60,
                mr: 1,
                ml: 1,
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                },
                '& input[type=number]::-webkit-inner-spin-button': {
                  WebkitAppearance: 'none',
                  margin: 0,
                },
              }}
              type="number"
              rules={{
                max: {
                  value: 90,
                  message: '',
                },
              }}
            />
            <Button type="submit" sx={{ ml: 2 }} loading={isLoading}>
              再取得
            </Button>
          </Grid2> */}
          <Button type="submit" startIcon={<UpdateIcon />} loading={isLoading}>
            再表示
          </Button>
        </Grid2>
      </Paper>
      <TableContainer style={{ overflow: 'scroll', maxHeight: '80vh' }}>
        {isLoading && <LoadingOverlay />}
        <Table padding="none" sx={{ border: '2px solid black' }} stickyHeader>
          <TableHead>
            <TableRow>
              {scheList &&
                scheList.length > 0 &&
                scheList.map((date, index) => (
                  <TableCell
                    key={date.calDat}
                    sx={{
                      border: '1px solid black',
                      px: 1,
                      whiteSpace: 'nowrap',
                      minWidth: 230,
                      maxWidth: 230,
                      height: 20.1,
                      bgcolor: 'white',
                      color:
                        toJapanDayString(date.calDat) === '土' ||
                        toJapanDayString(date.calDat) === '日' ||
                        date.holidayFlg
                          ? 'red'
                          : 'black',
                      cursor: 'pointer',
                    }}
                    align="center"
                    onClick={() =>
                      handleClickDateHead({
                        dat: toJapanYMDAndDayString(date.calDat),
                        mem: date.mem,
                        tantoNam: date.tantoNam,
                        holidayFlg: date.holidayFlg,
                      })
                    }
                  >
                    {toJapanYMDAndDayString(date.calDat)}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>

          {/** 日直入力ダイアログ */}
          <TantoDialog
            user={user}
            open={dialogOpen}
            datas={selectedDatas}
            setOpen={setDialogOpen}
            refetch={() => onSubmit(getValues())}
          />

          <TableBody>
            <TableRow>
              {scheList &&
                scheList.length > 0 &&
                scheList.map((date) => (
                  <TableCell
                    key={date.calDat}
                    sx={{
                      border: '1px solid black',
                      px: 1,
                      py: 0.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      bgcolor: 'white',
                      color: 'black',
                      verticalAlign: 'top',
                      cursor: 'pointer',
                      // maxHeight: 40.2,
                      // minHeight: 20.1,
                      // minWidth: 300,
                      // width: 300,
                      // maxWidth: 300,
                    }}
                    onClick={() =>
                      handleClickDateHead({
                        dat: toJapanYMDAndDayString(date.calDat),
                        mem: date.mem,
                        tantoNam: date.tantoNam,
                        holidayFlg: date.holidayFlg,
                      })
                    }
                  >
                    <Box
                      component="div"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        //WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        // lineHeight: '0.825rem',
                        lineHeight: '1.1rem',
                      }}
                      //fontSize={'0.75rem'}
                      fontWeight={'normal'}
                    >
                      {date.mem ?? ''}
                    </Box>
                  </TableCell>
                ))}
            </TableRow>
            <TableRow>
              {scheList &&
                scheList.length > 0 &&
                scheList.map((date) => (
                  <TableCell
                    key={date.calDat}
                    sx={{
                      border: '1px solid black',
                      borderBottom: '2px solid black',
                      px: 1,
                      py: 0.5,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      //height: 20.1,
                      bgcolor: 'white',
                      color: 'black',
                      verticalAlign: 'top',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      handleClickDateHead({
                        dat: toJapanYMDAndDayString(date.calDat),
                        mem: date.mem,
                        tantoNam: date.tantoNam,
                        holidayFlg: date.holidayFlg,
                      })
                    }
                  >
                    <Box
                      component="div"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        //WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        // lineHeight: '0.825rem',
                        lineHeight: '1.1rem',
                      }}
                      //fontSize={'0.75rem'}
                      fontWeight={'normal'}
                    >
                      {date.tantoNam ?? ''}
                    </Box>
                    {/* <LightTooltipWithText maxWidth={295} variant="body2">
                    {date.tantoNam ?? ''}
                    </LightTooltipWithText> */}
                  </TableCell>
                ))}
            </TableRow>
            <TableRow>
              {scheList &&
                scheList.length > 0 &&
                scheList.map((date) => (
                  <TableCell key={date.calDat} sx={{ border: '1px solid black', px: 0, verticalAlign: 'top' }}>
                    {date.timeDatas &&
                      date.timeDatas.length > 0 &&
                      date.timeDatas.map((time, index) => (
                        <Box
                          key={index}
                          width={1}
                          display={'flex'}
                          sx={{
                            borderBottom: 1, // date.timeDatas.length === 1 || index + 1 !== date.timeDatas.length ? 1 : undefined,
                            alignItems: 'stretch',
                          }}
                        >
                          {/* 時刻列（リンクなし） */}
                          <Box width={45} /*fontSize={'0.75rem'}*/>
                            <Box height={20.1} justifyContent={'center'} sx={styles.boxStyle}>
                              {time.nyushukoDat ? toJapanHHmmString(time.nyushukoDat) : ''}
                            </Box>
                            <Divider />
                            <Box height={20.1} />
                            <Divider />
                            <Box height={20.1} />
                          </Box>
                          <Divider orientation="vertical" flexItem />
                          {/* 積み/降ろし・車両列：クリックで入出庫一覧を別タブに開く */}
                          <Box
                            width={55}
                            bgcolor={
                              time.nyushukoShubetuId === NYUSHUKO_SHUBETU_ID.shuko
                                ? weeklyColors.shuko
                                : weeklyColors.nyuko
                            }
                            //fontSize={'0.75rem'}
                            sx={linkColumnSx(canRefNyushuko)}
                            onClick={() =>
                              handleClickNyushuko(time.juchuHeadId, time.nyushukoShubetuId, time.nyushukoDat)
                            }
                          >
                            <Box height={20.1} pl={0.5} sx={styles.boxStyle}>
                              {time.nyushukoShubetuId === NYUSHUKO_SHUBETU_ID.shuko ? '積み' : '降ろし'}
                            </Box>
                            <Divider />
                            <Box height={20.1} pl={0.5} sx={styles.boxStyle}>
                              {time.sharyos[0]?.nam ?? ''}
                              {time.sharyos[0]?.daisu > 1 ? `×${time.sharyos[0]?.daisu}` : ''}
                            </Box>
                            <Divider />
                            <Box height={20.1} pl={0.5} sx={styles.boxStyle}>
                              {time.sharyos[1]?.nam ?? ''}
                              {time.sharyos[1]?.daisu > 1 ? `×${time.sharyos[1]?.daisu}` : ''}
                            </Box>
                          </Box>
                          <Divider orientation="vertical" flexItem />
                          {/* 顧客名・公演名・車両ヘッダー名列：クリックで受注(伝票)画面を別タブに開く */}
                          <Box
                            width={165}
                            bgcolor={
                              time.nyushukoBashoId === BASHO_ID.kics
                                ? weeklyColors.kics
                                : time.nyushukoBashoId === BASHO_ID.others
                                  ? weeklyColors.atsugi
                                  : weeklyColors.yard
                            }
                            sx={linkColumnSx(canRefJuchu)}
                            onClick={() => handleClickJuchu(time.juchuHeadId)}
                          >
                            <Box height={20.1} pl={'5px'} sx={styles.boxStyle}>
                              <LightTooltipWithText variant={'body2'} maxWidth={160}>
                                {time.kokyakuNam}
                              </LightTooltipWithText>
                            </Box>
                            <Divider />
                            <Box height={20.1} pl={'5px'} sx={styles.boxStyle}>
                              <LightTooltipWithText variant={'body2'} maxWidth={160}>
                                {time.koenNam}
                              </LightTooltipWithText>
                            </Box>
                            <Divider />
                            <Box height={20.1} pl={'5px'} sx={styles.boxStyle}>
                              <LightTooltipWithText variant={'body2'} maxWidth={160}>
                                {time.sharyoHeadNam}
                              </LightTooltipWithText>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                  </TableCell>
                ))}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
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
  boxStyle: {
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap',
  },
};

/**
 * 別画面へのリンクとして振る舞う列（3行まとめて1つのクリック領域）のsx。
 * ホバー時は列全体を少し暗くして、押せる範囲が文字ではなく領域全体であることを示す。
 * 参照権限が無い場合はリンクに見せない（クリックしても何も起きない）。
 */
const linkColumnSx = (enabled: boolean) =>
  enabled ? { cursor: 'pointer', '&:hover': { boxShadow: 'inset 0 0 0 9999px rgba(0, 0, 0, 0.08)' } } : undefined;
