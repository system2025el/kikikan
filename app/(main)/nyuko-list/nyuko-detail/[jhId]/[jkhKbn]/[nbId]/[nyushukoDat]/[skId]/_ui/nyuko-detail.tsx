'use client';

import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';

import { updNyukoDetail } from '../_lib/funcs';
import { NyukoDetailTableValues, NyukoDetailValues } from '../_lib/types';
import { NyukoDetailTable } from './nyuko-detail-table';

export const NyukoDetail = (props: {
  nyukoDetailData: NyukoDetailValues;
  nyukoDetailTableData: NyukoDetailTableValues[];
  fixFlag: boolean;
}) => {
  const { nyukoDetailData, nyukoDetailTableData } = props;

  // user情報
  const user = useUserStore((state) => state.user);

  const [fixFlag, setFixFlag] = useState(props.fixFlag);

  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /**
   * 到着ボタン押下
   * @returns
   */
  const handleDeparture = async () => {
    if (!user) return;

    const updateResult = await updNyukoDetail(nyukoDetailData, nyukoDetailTableData, user.name);

    if (updateResult) {
      setFixFlag(true);
      setSnackBarMessage('到着しました');
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage('到着に失敗しました');
      setSnackBarOpen(true);
    }
  };

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
          <Typography fontSize={'large'}>入庫明細(入庫)</Typography>
          <Grid2 container alignItems={'center'} spacing={2}>
            {fixFlag && <Typography>到着済</Typography>}
            <Button onClick={handleDeparture} disabled={fixFlag}>
              到着
            </Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container spacing={1} p={1}>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>受注番号</Typography>
              <TextField value={nyukoDetailData.juchuHeadId} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>入庫日時</Typography>
              <DateTime
                date={nyukoDetailData.nyushukoDat ? new Date(nyukoDetailData.nyushukoDat) : null}
                onChange={() => {}}
                onAccept={() => {}}
                disabled
              />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>入庫場所</Typography>
              <TextField value={nyukoDetailData.nyushukoBashoId === 1 ? 'KICS' : 'YARD'} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材明細名</Typography>
              <TextField value={nyukoDetailData.headNamv ?? ''} disabled />
            </Box>
          </Grid2>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>公演名</Typography>
              <TextField value={nyukoDetailData.koenNam ?? ''} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>公演場所</Typography>
              <TextField value={nyukoDetailData.koenbashoNam ?? ''} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>顧客名</Typography>
              <TextField value={nyukoDetailData.kokyakuNam ?? ''} fullWidth disabled />
            </Box>
          </Grid2>
        </Grid2>
        <Divider />
        <Box width={'100%'}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'60vw'} p={1}>
            <Typography>全{nyukoDetailTableData ? nyukoDetailTableData.length : 0}件</Typography>
            <Grid2 container spacing={2}>
              <Typography sx={{ backgroundColor: 'rgba(158, 158, 158, 1)' }}>済</Typography>
              <Typography sx={{ backgroundColor: 'rgba(255, 171, 64, 1)' }}>不足</Typography>
              <Typography sx={{ backgroundColor: 'rgba(255, 255, 0, 1)' }}>過剰</Typography>
              <Typography sx={{ backgroundColor: 'rgba(68, 138, 255, 1)' }}>コンテナ</Typography>
            </Grid2>
          </Box>
          {nyukoDetailTableData.length > 0 && <NyukoDetailTable datas={nyukoDetailTableData} />}
        </Box>
      </Paper>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </Box>
  );
};
