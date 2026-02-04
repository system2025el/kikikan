'use client';

import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { weeklyColors } from '../../_lib/colors';
import { toJapanDayString, toJapanHHmmString, toJapanYMDAndDayString } from '../../_lib/date-conversion';
import { permission } from '../../_lib/permission';
import { FormDateX } from '../../_ui/date';
import { LoadingOverlay } from '../../_ui/loading';
import { PermissionGuard } from '../../_ui/permission-guard';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { getWeeklyScheduleList } from '../_lib/funcs';
import { WeeklyScheduleValues, WeeklySearchValues, WeeklyValues } from '../_lib/types';
import { TantoDialog } from './tanto-dialog';

/**
 * Weekly スケジュール画面
 * @returns {JSX.Element} Weekly スケジュール画面
 */
export const Schedule = () => {
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
  const { handleSubmit, control, reset, getValues } = useForm<WeeklySearchValues>({
    mode: 'onBlur',
    defaultValues: {
      startDate: new Date(),
      endDate: null,
      dateCount: 31,
    },
  });

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
        reset(searchParams);
        getSchedule(searchParams);
      } else {
        getSchedule({ startDate: new Date(), endDate: null, dateCount: 31 });
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
        sx={{ mb: 1, px: 2, display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
      >
        スケジュール
        <Box sx={styles.boxStyle}>
          表示開始日
          <Controller
            name="startDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormDateX
                value={field.value}
                onChange={field.onChange}
                sx={{ width: 200, mr: 2, ml: 1 }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          表示終了日
          <Controller
            name="endDate"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormDateX
                value={field.value}
                onChange={field.onChange}
                sx={{ width: 200, mr: 2, ml: 1 }}
                error={!!error}
                helperText={error?.message}
              />
            )}
          />
          表示日数
          <TextFieldElement
            name="dateCount"
            control={control}
            sx={{
              width: 60,
              mr: 2,
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
                value: 200,
                message: '',
              },
            }}
          />
          <Button type="submit" sx={{ ml: 2 }} loading={isLoading}>
            再取得
          </Button>
        </Box>
      </Paper>
      <TableContainer>
        {isLoading && <LoadingOverlay />}
        <Table padding="none" sx={{ border: '2px solid black' }}>
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
                      minWidth: 160,
                      maxWidth: 160,
                      height: 20.1,
                      bgcolor: 'white',
                      color:
                        toJapanDayString(date.calDat) === '土' ||
                        toJapanDayString(date.calDat) === '日' ||
                        date.holidayFlg
                          ? 'red'
                          : 'black',
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
            <TableRow>
              {scheList &&
                scheList.length > 0 &&
                scheList.map((date) => (
                  <TableCell
                    key={date.calDat}
                    sx={{
                      border: '1px solid black',
                      px: 1,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      bgcolor: 'white',
                      color: 'black',
                      verticalAlign: 'top',
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
                      }}
                      fontSize={'0.5rem'}
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
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                      //height: 20.1,
                      bgcolor: 'white',
                      color: 'black',
                      verticalAlign: 'top',
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
                      }}
                      fontSize={'0.5rem'}
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
          </TableHead>

          {/** 日直入力ダイアログ */}
          <TantoDialog
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
                  <TableCell key={date.calDat} sx={{ border: '1px solid black', px: 0, verticalAlign: 'top' }}>
                    {date.timeDatas &&
                      date.timeDatas.length > 0 &&
                      date.timeDatas.map((time, index) => (
                        <Box
                          key={index}
                          width={1}
                          sx={{
                            borderBottom: 1, // date.timeDatas.length === 1 || index + 1 !== date.timeDatas.length ? 1 : undefined,
                            alignItems: 'start',
                          }}
                        >
                          <Box height={20.1} display={'flex'}>
                            <Box justifyContent={'end'} width={25} sx={styles.boxStyle} fontSize={'0.5rem'}>
                              {time.nyushukoDat ? toJapanHHmmString(time.nyushukoDat) : ''}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={60}
                              sx={styles.boxStyle}
                              bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                              fontSize={'0.5rem'}
                            >
                              {time.nyushukoShubetuId === 1 ? '積み' : '降ろし'}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={75}
                              sx={styles.boxStyle}
                              bgcolor={
                                time.nyushukoBashoId === 1
                                  ? weeklyColors.kics
                                  : time.nyushukoBashoId === 3
                                    ? weeklyColors.atsugi
                                    : weeklyColors.yard
                              }
                            >
                              <LightTooltipWithText variant={'0.50rem'} maxWidth={75}>
                                {time.kokyakuNam}
                              </LightTooltipWithText>
                            </Box>
                          </Box>
                          <Divider variant="fullWidth" />
                          <Box height={20.1} display={'flex'}>
                            <Box justifyContent={'end'} width={25} sx={styles.boxStyle} />
                            <Divider orientation="vertical" />
                            <Box
                              width={60}
                              sx={styles.boxStyle}
                              bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                              fontSize={'0.5rem'}
                            >
                              {time.sharyos[0]?.nam ?? ''}
                              {time.sharyos[0]?.daisu > 1 ? ` ×${time.sharyos[0]?.daisu}` : ''}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={75}
                              sx={styles.boxStyle}
                              bgcolor={
                                time.nyushukoBashoId === 1
                                  ? weeklyColors.kics
                                  : time.nyushukoBashoId === 3
                                    ? weeklyColors.atsugi
                                    : weeklyColors.yard
                              }
                            >
                              <LightTooltipWithText variant={'0.50rem'} maxWidth={75}>
                                {time.koenNam}
                              </LightTooltipWithText>
                            </Box>
                          </Box>
                          <Divider />
                          <Box height={20.1} display={'flex'}>
                            <Box justifyContent={'end'} width={25} sx={styles.boxStyle} />
                            <Divider orientation="vertical" />
                            <Box
                              width={60}
                              sx={styles.boxStyle}
                              bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                              fontSize={'0.5rem'}
                            >
                              {time.sharyos[1]?.nam ?? ''}
                              {time.sharyos[1]?.daisu > 1 ? ` ×${time.sharyos[1]?.daisu}` : ''}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={75}
                              sx={styles.boxStyle}
                              bgcolor={
                                time.nyushukoBashoId === 1
                                  ? weeklyColors.kics
                                  : time.nyushukoBashoId === 3
                                    ? weeklyColors.atsugi
                                    : weeklyColors.yard
                              }
                            >
                              <LightTooltipWithText variant={'0.50rem'} maxWidth={75}>
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
