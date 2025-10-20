'use client';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { NyukoIdoDenTable, ShukoIdoDenTable } from './ido-detail-table';

export const IdoDetail = (props: { sagyoKbnId: number }) => {
  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
          <Typography fontSize={'large'}>移動明細({props.sagyoKbnId === 40 ? '移動出庫' : '移動入庫'})</Typography>
          <Button /*onClick={handleDeparture}*/>{props.sagyoKbnId === 40 ? '出発' : '到着'}</Button>
        </Box>
        <Divider />
        <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 2 }} spacing={1}>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={3}>移動予定日</Typography>
            <TextField value={'2025/12/01'} disabled />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={5}>移動指示</Typography>
            <TextField value={'YARD→KICS'} disabled />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={5}>作業場所</Typography>
            <TextField value={'YARD'} disabled />
          </Box>
        </Grid2>
        <Divider />
        {props.sagyoKbnId === 40 ? (
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} p={2}>
              <Box alignItems={'center'}>
                <Typography>手動指示</Typography>
                <Box py={1}>
                  <Button /*onClick={() => handleOpenEqDialog()}*/>
                    <AddIcon fontSize="small" />
                    機材追加
                  </Button>
                </Box>
              </Box>
              <Grid2 container alignItems={'center'} spacing={2}>
                <Typography sx={{ backgroundColor: 'rgba(158, 158, 158, 1)' }}>済</Typography>
                <Typography sx={{ backgroundColor: 'rgba(255, 171, 64, 1)' }}>不足</Typography>
                <Typography sx={{ backgroundColor: 'rgba(68, 138, 255, 1)' }}>コンテナ</Typography>
                <Button>保存</Button>
              </Grid2>
            </Box>
            {/*idoDenManualList.length > 0 &&*/ <ShukoIdoDenTable /*datas={idoDenManualList}*/ />}
          </Box>
        ) : (
          <Box width={'100%'} pb={3}>
            <Box display={'flex'} justifyContent={'end'} alignItems={'center'} width={'60vw'} p={2}>
              <Grid2 container spacing={2}>
                <Typography sx={{ backgroundColor: 'rgba(158, 158, 158, 1)' }}>済</Typography>
                <Typography sx={{ backgroundColor: 'rgba(255, 171, 64, 1)' }}>不足</Typography>
                <Typography sx={{ backgroundColor: 'rgba(68, 138, 255, 1)' }}>コンテナ</Typography>
              </Grid2>
            </Box>
            {/*idoDenData.length > 0 &&*/ <NyukoIdoDenTable /*datas={idoDetailData}*/ />}
          </Box>
        )}
      </Paper>
    </Box>
  );
};
