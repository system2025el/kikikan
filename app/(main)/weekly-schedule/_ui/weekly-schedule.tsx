'use client';

import {
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

import {
  toJapanHHmmString,
  toJapanTimeString,
  toJapanYMDAndDayString,
  toJapanYMDString,
} from '../../_lib/date-conversion';
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
                    minWidth: 250,
                    height: 20.1,
                    bgcolor: 'white',
                    color: 'black',
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
                <TableCell key={date.calDat} sx={{ border: '1px solid black', px: 0 }}>
                  {date.timeDatas &&
                    date.timeDatas.length > 0 &&
                    date.timeDatas.map((time, index) => (
                      <Grid2
                        container
                        key={time.juchuSharyoId}
                        direction={'column'}
                        width={1}
                        sx={{ borderBottom: index + 1 !== date.timeDatas.length ? 1 : undefined }}
                      >
                        <Grid2 height={20.1} px={0.5} display={'flex'}>
                          <Grid2 display={'flex'} width={40} whiteSpace={'nowrap'}>
                            {time.nyushukoDat ? toJapanHHmmString(time.nyushukoDat) : ''}
                          </Grid2>
                          <Divider orientation="vertical" />
                          <Grid2 display={'flex'} width={60} whiteSpace={'nowrap'}>
                            {time.nyushukoShubetuId === 1 ? '積み' : '降ろし'}
                          </Grid2>
                          <Divider orientation="vertical" />
                          <Grid2 display={'flex'} width={120} whiteSpace={'nowrap'}>
                            {time.kokyakuNam}
                          </Grid2>
                        </Grid2>
                        <Divider variant="fullWidth" />
                        <Grid2 height={20.1} px={0.5} display={'flex'}>
                          <Grid2 display={'flex'} width={40} whiteSpace={'nowrap'} />
                          <Divider orientation="vertical" />
                          <Grid2 display={'flex'} width={60} whiteSpace={'nowrap'}>
                            {time.sharyos[0] ?? ''}
                          </Grid2>
                          <Divider orientation="vertical" />
                          <Grid2 display={'flex'} width={120} whiteSpace={'nowrap'}>
                            {time.koenNam}
                          </Grid2>
                        </Grid2>
                        <Divider />
                        <Grid2 height={20.1} px={0.5} display={'flex'}>
                          <Grid2 display={'flex'} width={40} whiteSpace={'nowrap'} />
                          <Divider orientation="vertical" />
                          <Grid2 display={'flex'} width={60} whiteSpace={'nowrap'}>
                            {time.sharyos[1] ?? ''}
                          </Grid2>
                          <Divider orientation="vertical" />
                          <Grid2 display={'flex'} width={120} whiteSpace={'nowrap'}>
                            {time.sharyoHeadNam}
                          </Grid2>
                        </Grid2>
                      </Grid2>
                    ))}
                </TableCell>
              ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};
