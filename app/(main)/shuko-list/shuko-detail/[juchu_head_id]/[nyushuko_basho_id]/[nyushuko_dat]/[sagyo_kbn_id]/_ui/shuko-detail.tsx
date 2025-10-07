'use client';

import { Box, Button, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';

import { ShukoMeisaiTableValues } from '../_lib/types';
import { ShukoDetailTable } from './shuko-detail-table';

export const ShukoDetail = (props: { shukoMeisaiData: ShukoMeisaiTableValues[] }) => {
  const { shukoMeisaiData } = props;
  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
          <Typography fontSize={'large'}>
            出庫明細({shukoMeisaiData[0].sagyoKbnId === 20 ? '出庫' : 'スタンバイ'})
          </Typography>
          <Button sx={{ display: shukoMeisaiData[0].sagyoKbnId === 20 ? 'block' : 'none' }}>出発</Button>
        </Box>
        <Divider />
        <Grid2 container spacing={1} p={1}>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>受注番号</Typography>
              <TextField value={shukoMeisaiData[0].juchuHeadId} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫日時</Typography>
              <DateTime
                date={shukoMeisaiData[0].nyushukoDat ? new Date(shukoMeisaiData[0].nyushukoDat) : null}
                onChange={() => {}}
                onAccept={() => {}}
                disabled
              />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫場所</Typography>
              <TextField value={shukoMeisaiData[0].nyushukoBashoId === 1 ? 'KICS' : 'YARD'} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材明細名</Typography>
              <TextField value={shukoMeisaiData[0].headNamv} sx={{ width: '50%' }} disabled />
            </Box>
          </Grid2>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>公演名</Typography>
              <TextField value={shukoMeisaiData[0].koenNam} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>公演場所</Typography>
              <TextField value={shukoMeisaiData[0].koenbashoNam} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>顧客名</Typography>
              <TextField value={shukoMeisaiData[0].kokyakuNam} fullWidth disabled />
            </Box>
          </Grid2>
        </Grid2>
        <Divider />
        <Box width={'100%'}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'100%'} p={1}>
            <Typography>全{shukoMeisaiData ? shukoMeisaiData.length : 0}件</Typography>
          </Box>
          {shukoMeisaiData.length > 0 && <ShukoDetailTable datas={shukoMeisaiData} />}
        </Box>
      </Paper>
    </Box>
  );
};
