'use client';

import {
  Box,
  Container,
  Divider,
  Grid2,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { weeklyColors } from '../../_lib/colors';
import {
  toJapanDayString,
  toJapanHHmmString,
  toJapanTimeString,
  toJapanYMDAndDayString,
  toJapanYMDString,
} from '../../_lib/date-conversion';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { getWeeklyScheduleList } from '../_lib/funcs';
import { WeeklyScheduleValues } from '../_lib/types';

export const WeeklySchedule = () => {
  const [scheList, setScheList] = useState<WeeklyScheduleValues[]>([]);

  useEffect(() => {
    const getSchedule = async () => {
      const list = await getWeeklyScheduleList(new Date());
      setScheList(list);
    };
    getSchedule();
  }, []);

  useEffect(() => {
    console.log(scheList.map((d) => d.calDat));
  }, [scheList]);
  return (
    <TableContainer>
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
              scheList.map((date, index) => (
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
              scheList.map((date, index) => (
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
                          borderBottom:
                            date.timeDatas.length === 1 || index + 1 !== date.timeDatas.length ? 1 : undefined,
                          alignItems: 'start',
                        }}
                      >
                        <Box height={20.1} display={'flex'}>
                          <Box display={'flex'} justifyContent={'end'} width={50} whiteSpace={'nowrap'}>
                            {time.nyushukoDat ? toJapanHHmmString(time.nyushukoDat) : ''}
                          </Box>
                          <Divider orientation="vertical" />
                          <Box
                            display={'flex'}
                            width={100}
                            whiteSpace={'nowrap'}
                            bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                          >
                            {time.nyushukoShubetuId === 1 ? '積み' : '降ろし'}
                          </Box>
                          <Divider orientation="vertical" />
                          <Box
                            display={'flex'}
                            width={150}
                            whiteSpace={'nowrap'}
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
                          <Box display={'flex'} justifyContent={'end'} width={50} whiteSpace={'nowrap'} />
                          <Divider orientation="vertical" />
                          <Box
                            display={'flex'}
                            width={100}
                            whiteSpace={'nowrap'}
                            bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                          >
                            {time.sharyos[0]?.nam ?? ''}
                            {time.sharyos[0]?.daisu > 1 ? ` ×${time.sharyos[0]?.daisu}` : ''}
                          </Box>
                          <Divider orientation="vertical" />
                          <Box
                            display={'flex'}
                            width={150}
                            whiteSpace={'nowrap'}
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
                          <Box display={'flex'} justifyContent={'end'} width={50} whiteSpace={'nowrap'} />
                          <Divider orientation="vertical" />
                          <Box
                            display={'flex'}
                            width={100}
                            whiteSpace={'nowrap'}
                            bgcolor={time.nyushukoShubetuId === 1 ? weeklyColors.shuko : weeklyColors.nyuko}
                          >
                            {time.sharyos[1]?.nam ?? ''}
                            {time.sharyos[1]?.daisu > 1 ? ` ×${time.sharyos[1]?.daisu}` : ''}
                          </Box>
                          <Divider orientation="vertical" />
                          <Box
                            display={'flex'}
                            width={150}
                            whiteSpace={'nowrap'}
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
  );
};
