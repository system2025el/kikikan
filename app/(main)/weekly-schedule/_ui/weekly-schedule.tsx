'use client';

import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { weeklyColors } from '../../_lib/colors';
import { toJapanDayString, toJapanHHmmString, toJapanYMDAndDayString } from '../../_lib/date-conversion';
import { FormDateX } from '../../_ui/date';
import { LoadingOverlay } from '../../_ui/loading';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { getWeeklyScheduleList } from '../_lib/funcs';
import { WeeklyScheduleValues } from '../_lib/types';

export const WeeklySchedule = () => {
  /* useState ------------------------------------------------------------ */
  /** 表示するスケジュールのリスト */
  const [scheList, setScheList] = useState<WeeklyScheduleValues[]>([]);
  /** ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* useForm ------------------------------------------------------------- */
  const { handleSubmit, control } = useForm<{ dat: Date }>({
    mode: 'onSubmit',
    defaultValues: { dat: new Date() },
  });

  /* methods ------------------------------------------------------------- */
  /** 再描画押下時処理 */
  const onSubmit = async (data: { dat: Date }) => {
    setIsLoading(true);
    const list = await getWeeklyScheduleList(data.dat);
    setScheList(list);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------------------------------- */
  /** 初期描画 */
  useEffect(() => {
    const getSchedule = async () => {
      const list = await getWeeklyScheduleList(new Date());
      setScheList(list);
      setIsLoading(false);
    };
    getSchedule();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }}>
      <Paper
        component={'form'}
        onSubmit={handleSubmit(onSubmit)}
        variant="outlined"
        sx={{ mb: 1, px: 2, display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}
      >
        Weekly スケジュール
        <Box sx={styles.boxStyle}>
          表示開始日
          <Controller
            name="dat"
            control={control}
            render={({ field, fieldState: { error } }) => (
              <FormDateX
                value={field.value}
                onChange={field.onChange}
                sx={{ width: 160 }}
                error={!!error}
                helperText={error?.message}
                notClearable
              />
            )}
          />
          <Button type="submit" sx={{ ml: 2 }}>
            再取得
          </Button>
        </Box>
      </Paper>
      <TableContainer>
        {isLoading && <LoadingOverlay />}
        <Table padding="none" sx={{ border: '2px solid black' }}>
          <TableHead>
            <TableRow sx={{}}>
              {scheList &&
                scheList.length > 0 &&
                scheList.map((date, index) => (
                  <TableCell
                    key={date.calDat}
                    sx={{
                      border: '1px solid black',
                      px: 0,
                      whiteSpace: 'nowrap',
                      minWidth: 300,
                      maxWidth: 300,
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
                    sx={{ border: '1px solid black', px: 0, height: 20.1, bgcolor: 'white', color: 'black' }}
                  >
                    {date.mem ?? ''}
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
                      px: 0,
                      height: 20.1,
                      bgcolor: 'white',
                      color: 'black',
                    }}
                  >
                    {date.tantoNam ?? ''}
                  </TableCell>
                ))}
            </TableRow>
          </TableHead>
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
                            <Box justifyContent={'end'} width={50} sx={styles.boxStyle}>
                              {time.nyushukoDat ? toJapanHHmmString(time.nyushukoDat) : ''}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={100}
                              sx={styles.boxStyle}
                              bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                            >
                              {time.nyushukoShubetuId === 1 ? '積み' : '降ろし'}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={150}
                              sx={styles.boxStyle}
                              bgcolor={
                                time.nyushukoBashoId === 1
                                  ? weeklyColors.kics
                                  : time.nyushukoBashoId === 3
                                    ? weeklyColors.atsugi
                                    : weeklyColors.yard
                              }
                            >
                              <LightTooltipWithText variant={'body2'} maxWidth={150}>
                                {time.kokyakuNam}
                              </LightTooltipWithText>
                            </Box>
                          </Box>
                          <Divider variant="fullWidth" />
                          <Box height={20.1} display={'flex'}>
                            <Box justifyContent={'end'} width={50} sx={styles.boxStyle} />
                            <Divider orientation="vertical" />
                            <Box
                              width={100}
                              sx={styles.boxStyle}
                              bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                            >
                              {time.sharyos[0]?.nam ?? ''}
                              {time.sharyos[0]?.daisu > 1 ? ` ×${time.sharyos[0]?.daisu}` : ''}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={150}
                              sx={styles.boxStyle}
                              bgcolor={
                                time.nyushukoBashoId === 1
                                  ? weeklyColors.kics
                                  : time.nyushukoBashoId === 3
                                    ? weeklyColors.atsugi
                                    : weeklyColors.yard
                              }
                            >
                              <LightTooltipWithText variant={'body2'} maxWidth={150}>
                                {time.koenNam}
                              </LightTooltipWithText>
                            </Box>
                          </Box>
                          <Divider />
                          <Box height={20.1} display={'flex'}>
                            <Box justifyContent={'end'} width={50} sx={styles.boxStyle} />
                            <Divider orientation="vertical" />
                            <Box
                              width={100}
                              sx={styles.boxStyle}
                              bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                            >
                              {time.sharyos[1]?.nam ?? ''}
                              {time.sharyos[1]?.daisu > 1 ? ` ×${time.sharyos[1]?.daisu}` : ''}
                            </Box>
                            <Divider orientation="vertical" />
                            <Box
                              width={150}
                              sx={styles.boxStyle}
                              bgcolor={
                                time.nyushukoBashoId === 1
                                  ? weeklyColors.kics
                                  : time.nyushukoBashoId === 3
                                    ? weeklyColors.atsugi
                                    : weeklyColors.yard
                              }
                            >
                              <LightTooltipWithText variant={'body2'} maxWidth={150}>
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
