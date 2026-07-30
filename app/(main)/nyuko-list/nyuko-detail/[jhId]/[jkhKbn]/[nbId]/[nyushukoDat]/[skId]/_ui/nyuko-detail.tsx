'use client';

import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { BASHO_ID, JUCHU_KIZAI_HEAD_KBN } from '@/app/_lib/constants';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { dispColors, statusColors } from '@/app/(main)/_lib/colors';
import { permission } from '@/app/(main)/_lib/permission';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';

import { delNyukoFix, updNyukoDetail } from '../_lib/funcs';
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

  const router = useRouter();

  const [fixFlag, setFixFlag] = useState(props.fixFlag);
  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  // 到着確認ダイアログ制御
  const [arrivalOpen, setArrivalOpen] = useState(false);
  // 到着解除確認ダイアログ制御
  const [releaseOpen, setReleaseOpen] = useState(false);
  // 到着メッセージ
  const [arrivalMessage, setArrivalMessage] = useState('');
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /**
   * 到着処理
   * @returns
   */
  const executeArrival = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (nyukoDetailTableData.length === 0) {
      setIsProcessing(false);
      return;
    }

    const updateResult = await updNyukoDetail(nyukoDetailData, nyukoDetailTableData, user.name);

    if (updateResult) {
      setArrivalOpen(false);
      setFixFlag(true);
      setSnackBarMessage('到着しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      window.close();
    } else {
      setArrivalOpen(false);
      setSnackBarMessage('到着に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 到着解除処理
   * @returns
   */
  const executeRelease = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (nyukoDetailTableData.length === 0) {
      setIsProcessing(false);
      return;
    }

    try {
      await delNyukoFix(nyukoDetailData, nyukoDetailTableData, user.name);

      setFixFlag(false);
      setReleaseOpen(false);
      setSnackBarMessage('到着解除しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      window.close();
    } catch (e) {
      setReleaseOpen(false);
      setSnackBarMessage('到着解除に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  const handleArrivalOpen = () => {
    if (
      nyukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.normal &&
      nyukoDetailTableData.filter((d) => d.resultQty === 0 && d.resultAdjQty === 0).length > 0
    ) {
      setArrivalMessage(`読み取りも補正もない状態で到着すると\n入庫予定から削除されますがよろしいですか？`);
      setArrivalOpen(true);
    } else {
      setArrivalMessage('到着済みにしてよろしいですか？');
      setArrivalOpen(true);
    }
  };

  return (
    <PermissionGuard category={'nyushuko'} required={permission.nyushuko_ref}>
      <Box>
        <Box display={'flex'} justifyContent={'end'} mb={1}>
          <Button onClick={() => window.close()}>閉じる</Button>
        </Box>
        <Paper variant="outlined">
          <Box display={'flex'} justifyContent={'space-between'} alignItems="center" px={2}>
            <Typography fontSize={'large'}>入庫明細(カウント)</Typography>
            <Grid2 container alignItems={'center'} spacing={2}>
              {nyukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return && (
                <Typography color="red">※返却時は到着ボタンで親の入庫明細の数量に反映されます。</Typography>
              )}
              {fixFlag && <Typography>到着済</Typography>}
              <Button
                onClick={handleArrivalOpen}
                disabled={
                  fixFlag || user?.permission.nyushuko === permission.nyushuko_ref || nyukoDetailTableData.length === 0
                }
                sx={{ backgroundColor: 'yellow', color: 'black' }}
              >
                到着
              </Button>
              <Button
                color="error"
                onClick={() => setReleaseOpen(true)}
                disabled={!fixFlag || user?.permission.nyushuko === permission.nyushuko_ref}
              >
                到着解除
              </Button>
            </Grid2>
          </Box>
          <Divider />
          <Grid2 container spacing={1} p={1}>
            <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={4}>受注番号</Typography>
                <TextField value={nyukoDetailData.juchuHeadId} sx={{ width: 100 }} disabled />
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
                <TextField
                  value={nyukoDetailData.nyushukoBashoId === BASHO_ID.kics ? 'KICS' : 'YARD'}
                  disabled
                  sx={{ width: 100 }}
                />
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
          <Box display={'flex'} alignItems={'center'} px={2} pb={2}>
            <Typography mr={2}>受注明細名</Typography>
            <TextField
              value={nyukoDetailData.headNamv ?? ''}
              fullWidth
              disabled
              sx={{
                '.MuiOutlinedInput-input.Mui-disabled': {
                  WebkitTextFillColor:
                    nyukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.return
                      ? dispColors.return
                      : nyukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep
                        ? dispColors.keep
                        : 'inherit',
                },
              }}
            />
          </Box>
          <Box display={'flex'} alignItems="center" px={2} pb={1}>
            <Typography mr={4}>明細メモ</Typography>
            <TextField multiline rows={3} fullWidth disabled value={nyukoDetailData.memv ?? ''} />
          </Box>
          <Divider />
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'65vw'} p={1}>
              <Typography>全{nyukoDetailTableData ? nyukoDetailTableData.length : 0}件</Typography>
              <Box display={'flex'} alignItems={'center'}>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.completed }}>
                  済
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.lack }}>
                  不足
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.excess }}>
                  過剰
                </Typography>
                <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.ctn }}>
                  コンテナ
                </Typography>
              </Box>
            </Box>
          </Box>
          {nyukoDetailTableData.length > 0 && <NyukoDetailTable datas={nyukoDetailTableData} />}
        </Paper>
        <Dialog open={arrivalOpen}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="warning" />
            <Box>到着確認</Box>
          </DialogTitle>
          <DialogContentText m={2} p={2} sx={{ whiteSpace: 'pre-line' }}>
            {arrivalMessage}
          </DialogContentText>
          <DialogActions>
            <Button
              onClick={executeArrival}
              loading={isProcessing}
              sx={{
                backgroundColor:
                  nyukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.normal &&
                  nyukoDetailTableData.filter((d) => d.resultQty === 0 && d.resultAdjQty === 0).length > 0
                    ? 'red'
                    : 'yellow',
                color:
                  nyukoDetailData.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.normal &&
                  nyukoDetailTableData.filter((d) => d.resultQty === 0 && d.resultAdjQty === 0).length > 0
                    ? 'white'
                    : 'black',
              }}
            >
              到着
            </Button>
            <Button onClick={() => setArrivalOpen(false)} loading={isProcessing}>
              戻る
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={releaseOpen}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="warning" />
            <Box>到着解除確認</Box>
          </DialogTitle>
          <DialogContentText m={2} p={2}>
            到着解除してよろしいですか？
          </DialogContentText>
          <DialogActions>
            <Button onClick={executeRelease} loading={isProcessing} color="error">
              到着解除
            </Button>
            <Button onClick={() => setReleaseOpen(false)} loading={isProcessing}>
              戻る
            </Button>
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
    </PermissionGuard>
  );
};
