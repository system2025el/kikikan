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
import { set } from 'zod';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { statusColors } from '@/app/(main)/_lib/colors';
import { permission } from '@/app/(main)/_lib/permission';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { DateTime, TestDate } from '@/app/(main)/_ui/date';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';

import {
  confirmChildJuchuKizaiHead,
  delShukoFix,
  getShukoDetail,
  getShukoDetailTable,
  updShukoAdjust,
  updShukoDetail,
} from '../_lib/funcs';
import { ShukoDetailTableValues, ShukoDetailValues } from '../_lib/types';
import { ShukoDetailTable } from './shuko-detail-table';

export const ShukoDetail = (props: {
  shukoDetailData: ShukoDetailValues;
  shukoDetailTableData: ShukoDetailTableValues[];
  fixFlag: boolean;
}) => {
  const { shukoDetailData } = props;

  // user情報
  const user = useUserStore((state) => state.user);

  const router = useRouter();

  // 出発済フラグ
  const [fixFlag, setFixFlag] = useState(props.fixFlag);
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  // 出庫データ
  const [shukoDetailList, setShukoDetailList] = useState<ShukoDetailTableValues[]>(props.shukoDetailTableData);

  // 出発ボタンダイアログ制御
  const [departureOpen, setDepartureOpen] = useState(false);
  // 出発解除ボタンダイアログ制御
  const [releaseOpen, setReleaseOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /**
   * 出発ボタン押下
   * @returns
   */
  const handleDeparture = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    const diffCheck = shukoDetailList.find(
      (data) =>
        (data.juchuKizaiHeadKbn !== 3 && !data.ctnFlg && data.diff !== 0) ||
        (data.juchuKizaiHeadKbn === 3 && data.diff !== 0)
    );

    if (diffCheck) {
      setDepartureOpen(true);
      setIsProcessing(false);
      return;
    }

    const updateResult = await updShukoDetail(shukoDetailData, shukoDetailList, user.name);

    if (updateResult) {
      setFixFlag(true);
      setSnackBarMessage('出発しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      router.push('/shuko-list');
    } else {
      setSnackBarMessage('出発に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 出発解除ボタン押下
   * @returns
   */
  const handleRelease = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    const juchuKizaiHeadIds = [...new Set(shukoDetailList.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null))];
    const childJuchuKizaiHeadCount = await confirmChildJuchuKizaiHead(shukoDetailData.juchuHeadId, juchuKizaiHeadIds);

    if (childJuchuKizaiHeadCount && childJuchuKizaiHeadCount > 0) {
      setReleaseOpen(true);
      setIsProcessing(false);
      return;
    }

    const updateResult = await delShukoFix(shukoDetailData, shukoDetailList);

    if (updateResult) {
      setFixFlag(false);
      setSnackBarMessage('出発解除しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      router.push('/shuko-list');
    } else {
      setSnackBarMessage('出発解除に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 一括補正ボタン押下
   * @returns
   */
  const handleAdjust = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    const adjustData = shukoDetailList.filter((data) => data.diff !== 0 && data.diff < 0);

    if (adjustData.length === 0) {
      setIsProcessing(false);
      return;
    }

    setIsLoading(true);
    try {
      await updShukoAdjust(adjustData, user.name);
      const updatedShukoDetailTableData = await getShukoDetailTable(
        shukoDetailData.juchuHeadId,
        shukoDetailData.juchuKizaiHeadKbn,
        shukoDetailData.nyushukoBashoId,
        shukoDetailData.nyushukoDat,
        shukoDetailData.sagyoKbnId
      );
      setShukoDetailList(updatedShukoDetailTableData);
      setSnackBarMessage('一括補正しました');
      setSnackBarOpen(true);
    } catch (e) {
      setSnackBarMessage('一括補正に失敗しました');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
    setIsProcessing(false);
  };

  return (
    <PermissionGuard category={'nyushuko'} required={permission.nyushuko_ref}>
      <Box>
        {isLoading && <LoadingOverlay />}
        <Box display={'flex'} justifyContent={'end'} mb={1}>
          <Button
            onClick={() => {
              if (isProcessing) return;
              setIsProcessing(true);
              router.push('/shuko-list');
            }}
            disabled={isProcessing}
          >
            <Box display={'flex'} alignItems={'center'}>
              <ArrowLeftIcon fontSize="small" />
              出庫一覧
            </Box>
          </Button>
        </Box>
        <Paper variant="outlined">
          <Box display={'flex'} justifyContent={'space-between'} alignItems="center" px={2}>
            <Typography fontSize={'large'}>
              出庫明細({shukoDetailData.sagyoKbnId === 20 ? 'チェック' : 'スタンバイ'})
            </Typography>
            <Grid2 container alignItems={'center'} spacing={2}>
              {fixFlag && <Typography>出発済</Typography>}
              <Button
                onClick={handleDeparture}
                disabled={fixFlag || user?.permission.nyushuko === permission.nyushuko_ref}
                sx={{ display: shukoDetailData.sagyoKbnId === 20 ? 'block' : 'none' }}
              >
                出発
              </Button>
              <Button
                color="error"
                onClick={handleRelease}
                disabled={!fixFlag || user?.permission.nyushuko === permission.nyushuko_ref}
                sx={{ display: shukoDetailData.sagyoKbnId === 20 ? 'block' : 'none' }}
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
                <TextField value={shukoDetailData.juchuHeadId} disabled />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={4}>出庫日時</Typography>
                <DateTime
                  date={shukoDetailData.nyushukoDat ? new Date(shukoDetailData.nyushukoDat) : null}
                  onChange={() => {}}
                  onAccept={() => {}}
                  disabled
                />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={4}>出庫場所</Typography>
                <TextField value={shukoDetailData.nyushukoBashoId === 1 ? 'KICS' : 'YARD'} disabled />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={2}>受注明細名</Typography>
                <TextField value={shukoDetailData.headNamv ?? ''} disabled />
              </Box>
            </Grid2>
            <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={6}>公演名</Typography>
                <TextField value={shukoDetailData.koenNam} fullWidth disabled />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={4}>公演場所</Typography>
                <TextField value={shukoDetailData.koenbashoNam} fullWidth disabled />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={6}>顧客名</Typography>
                <TextField value={shukoDetailData.kokyakuNam} fullWidth disabled />
              </Box>
            </Grid2>
          </Grid2>
          <Divider />
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'60vw'} pl={1} py={0.5}>
              <Typography>全{shukoDetailList ? shukoDetailList.length : 0}件</Typography>
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
                <Button
                  onClick={handleAdjust}
                  disabled={!shukoDetailList.find((data) => data.diff !== 0) || fixFlag}
                  sx={{ ml: 2 }}
                >
                  一括補正
                </Button>
              </Box>
            </Box>
            {shukoDetailList.length > 0 && <ShukoDetailTable datas={shukoDetailList} />}
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
    </PermissionGuard>
  );
};
