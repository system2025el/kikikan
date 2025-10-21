'use client';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { TestDate } from '@/app/(main)/_ui/date';

import { IdoDetailValues } from '../_lib/types';
import { NyukoIdoDenTable, ShukoIdoDenTable } from './ido-detail-table';
import { IdoEqptSelectionDialog } from './ido-equipment-selection-dialog';

export const IdoDetail = (props: { idoDetailData: IdoDetailValues }) => {
  const { idoDetailData } = props;

  // 機材追加ダイアログ制御
  const [idoEqSelectionDialogOpen, setIdoEqSelectionDialogOpen] = useState(false);
  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
          <Typography fontSize={'large'}>
            移動明細({idoDetailData.sagyoKbnId === 40 ? '移動出庫' : '移動入庫'})
          </Typography>
          <Button /*onClick={handleDeparture}*/>{idoDetailData.sagyoKbnId === 40 ? '出発' : '到着'}</Button>
        </Box>
        <Divider />
        <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 2 }} spacing={1}>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={3}>移動予定日</Typography>
            <TestDate date={new Date(idoDetailData.nyushukoDat)} onChange={() => {}} disabled />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={5}>移動指示</Typography>
            <TextField value={idoDetailData.sagyoSijiId === 1 ? 'KICS→YARD' : 'YARD→KICS'} disabled />
          </Box>
          <Box display={'flex'} alignItems={'center'}>
            <Typography mr={5}>作業場所</Typography>
            <TextField value={idoDetailData.nyushukoBashoId === 1 ? 'KICS' : 'YARD'} disabled />
          </Box>
        </Grid2>
        <Divider />
        {idoDetailData.sagyoKbnId === 40 ? (
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} p={2}>
              <Box alignItems={'center'}>
                <Typography>手動指示</Typography>
                <Box py={1}>
                  <Button onClick={() => setIdoEqSelectionDialogOpen(true)}>
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
      <Dialog open={idoEqSelectionDialogOpen} fullScreen>
        <IdoEqptSelectionDialog setEqpts={() => {}} handleCloseDialog={() => setIdoEqSelectionDialogOpen(false)} />
      </Dialog>
    </Box>
  );
};
