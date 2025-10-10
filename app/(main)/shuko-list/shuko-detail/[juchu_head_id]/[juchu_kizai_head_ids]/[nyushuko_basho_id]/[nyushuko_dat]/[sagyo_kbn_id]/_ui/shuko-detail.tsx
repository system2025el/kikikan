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

import { confirmChildJuchuKizaiHead, updShukoDetail } from '../_lib/funcs';
import { ShukoDetailTableValues } from '../_lib/types';
import { ShukoDetailTable } from './shuko-detail-table';

export const ShukoDetail = (props: { shukoDetailData: ShukoDetailTableValues[] }) => {
  const { shukoDetailData } = props;

  // user情報
  const user = useUserStore((state) => state.user);

  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const [departureOpen, setDepartureOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);

  /**
   * 出発ボタン押下
   * @returns
   */
  const handleDeparture = async () => {
    if (!user) return;

    const diffCheck = shukoDetailData.find((data) => data.diff !== 0);

    if (diffCheck) {
      setDepartureOpen(true);
      return;
    }

    const updateResult = await updShukoDetail(shukoDetailData, 1, user.name);

    if (updateResult) {
      setSnackBarMessage('出発しました');
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage('出発に失敗しました');
      setSnackBarOpen(true);
    }
  };

  /**
   * 出発解除ボタン押下
   * @returns
   */
  const handleRelease = async () => {
    if (!user) return;

    const juchuHeadId = shukoDetailData[0].juchuHeadId;
    const childJuchuKizaiHeadCount = await confirmChildJuchuKizaiHead(juchuHeadId);

    if (childJuchuKizaiHeadCount && childJuchuKizaiHeadCount > 0) {
      setReleaseOpen(true);
      return;
    }

    const updateResult = await updShukoDetail(shukoDetailData, 0, user.name);

    if (updateResult) {
      setSnackBarMessage('出発解除しました');
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage('出発解除に失敗しました');
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
          <Typography fontSize={'large'}>
            出庫明細({shukoDetailData[0].sagyoKbnId === 20 ? '出庫' : 'スタンバイ'})
          </Typography>
          <Grid2 container spacing={2}>
            <Button onClick={handleDeparture} sx={{ display: shukoDetailData[0].sagyoKbnId === 20 ? 'block' : 'none' }}>
              出発
            </Button>
            <Button
              color="error"
              onClick={handleRelease}
              sx={{ display: shukoDetailData[0].sagyoKbnId === 20 ? 'block' : 'none' }}
            >
              出発解除
            </Button>
          </Grid2>
        </Box>
        <Divider />
        <Grid2 container spacing={1} p={1}>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>受注番号</Typography>
              <TextField value={shukoDetailData[0].juchuHeadId} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫日時</Typography>
              <DateTime
                date={shukoDetailData[0].nyushukoDat ? new Date(shukoDetailData[0].nyushukoDat) : null}
                onChange={() => {}}
                onAccept={() => {}}
                disabled
              />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>出庫場所</Typography>
              <TextField value={shukoDetailData[0].nyushukoBashoId === 1 ? 'KICS' : 'YARD'} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材明細名</Typography>
              <TextField value={shukoDetailData[0].headNamv} disabled />
            </Box>
          </Grid2>
          <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>公演名</Typography>
              <TextField value={shukoDetailData[0].koenNam} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={4}>公演場所</Typography>
              <TextField value={shukoDetailData[0].koenbashoNam} fullWidth disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={6}>顧客名</Typography>
              <TextField value={shukoDetailData[0].kokyakuNam} fullWidth disabled />
            </Box>
          </Grid2>
        </Grid2>
        <Divider />
        <Box width={'100%'}>
          <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'60vw'} p={1}>
            <Typography>全{shukoDetailData ? shukoDetailData.length : 0}件</Typography>
            <Grid2 container spacing={2}>
              <Typography sx={{ backgroundColor: 'rgba(158, 158, 158, 1)' }}>済</Typography>
              <Typography sx={{ backgroundColor: 'rgba(255, 171, 64, 1)' }}>不足</Typography>
              <Typography sx={{ backgroundColor: 'rgba(255, 255, 0, 1)' }}>過剰</Typography>
              <Typography sx={{ backgroundColor: 'rgba(68, 138, 255, 1)' }}>コンテナ</Typography>
            </Grid2>
          </Box>
          {shukoDetailData.length > 0 && <ShukoDetailTable datas={shukoDetailData} />}
        </Box>
      </Paper>
      <Dialog open={departureOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>不足・過剰があります</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          不足・過剰があるため、出発できません
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDepartureOpen(false)}>確認</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={releaseOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>子伝票が存在します</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          子伝票があるため、出発解除できません
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setReleaseOpen(false)}>確認</Button>
        </DialogActions>
      </Dialog>
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
