'use client';

import { Box, Button, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';

export const ShukoDetail = (props: { mode: string }) => {
  const [shukoDetailList, setShukoDetailList] = useState([]);
  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
          <Typography fontSize={'large'}>出庫明細({props.mode})</Typography>
          <Button sx={{ display: props.mode === '出庫' ? 'block' : 'none' }}>出発</Button>
        </Box>
        <Divider />
        <Grid2 container spacing={1} p={1}>
          <Grid2
            container
            size={{ xs: 12, sm: 12, md: 6 }}
            direction={'column'}
            p={{ sx: 1, sm: 1, md: 2 }}
            spacing={2}
          >
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>受注番号</Typography>
              <TextField />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫日時</Typography>
              <TextField />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫場所</Typography>
              <TextField />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材明細名</Typography>
              <TextField />
            </Box>
          </Grid2>
          <Grid2
            container
            size={{ xs: 12, sm: 12, md: 6 }}
            direction={'column'}
            p={{ sx: 1, sm: 1, md: 2 }}
            spacing={2}
          >
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>公演名</Typography>
              <TextField />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>公演場所</Typography>
              <TextField />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>顧客名</Typography>
              <TextField />
            </Box>
          </Grid2>
        </Grid2>
        <Divider />
        <Box width={'100%'} p={2}>
          <Typography>全{shukoDetailList ? shukoDetailList.length : 0}件</Typography>
        </Box>
      </Paper>
    </Box>
  );
};
