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

import { BASHO_ID, JUCHU_KIZAI_HEAD_KBN, SAGYO_KBN_ID } from '@/app/_lib/constants';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { dispColors, statusColors } from '@/app/(main)/_lib/colors';
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

  // 警告ダイアログ制御
  const [alertOpen, setAlertOpen] = useState(false);
  // 警告ダイアログタイトル
  const [alertTitle, setAlertTitle] = useState('');
  // 警告ダイアログ用メッセージ
  const [alertMessage, setAlertMessage] = useState('');
  // 出発確認ダイアログ制御
  const [departureOpen, setDepartureOpen] = useState(false);
  // 出発解除確認ダイアログ制御
  const [releaseOpen, setReleaseOpen] = useState(false);
  // 一括補正確認ダイアログ制御
  const [adjustOpen, setAdjustOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /**
   * 出発処理
   * @returns
   */
  const executeDeparture = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (shukoDetailList.length === 0) {
      setIsProcessing(false);
      return;
    }

    const diffCheck = shukoDetailList.find(
      (data) =>
        (data.juchuKizaiHeadKbn !== JUCHU_KIZAI_HEAD_KBN.keep && !data.ctnFlg && data.diff !== 0) ||
        (data.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep && data.diff !== 0)
    );

    if (diffCheck) {
      setAlertTitle('不足・過剰があります');
      setAlertMessage('不足・過剰があるため、出発できません');
      setDepartureOpen(false);
      setAlertOpen(true);
      setIsProcessing(false);
      return;
    }

    const updateResult = await updShukoDetail(shukoDetailData, shukoDetailList, user.name);

    if (updateResult) {
      setFixFlag(true);
      setDepartureOpen(false);
      setSnackBarMessage('出発しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      window.close();
    } else {
      setDepartureOpen(false);
      setSnackBarMessage('出発に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 出発解除処理
   * @returns
   */
  const executeRelease = async () => {
    if (!user || isProcessing) return;

    setIsProcessing(true);

    if (shukoDetailList.length === 0) {
      setIsProcessing(false);
      return;
    }

    const juchuKizaiHeadIds = [...new Set(shukoDetailList.map((d) => d.juchuKizaiHeadId).filter((id) => id !== null))];
    try {
      const childJuchuKizaiHeadCount = await confirmChildJuchuKizaiHead(shukoDetailData.juchuHeadId, juchuKizaiHeadIds);

      if (childJuchuKizaiHeadCount && childJuchuKizaiHeadCount > 0) {
        setAlertTitle('子伝票が存在します');
        setAlertMessage('子伝票があるため、出発解除できません');
        setReleaseOpen(false);
        setAlertOpen(true);
        setIsProcessing(false);
        return;
      }
    } catch (e) {
      setSnackBarMessage('出発解除に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }

    const updateResult = await delShukoFix(shukoDetailData, shukoDetailList);

    if (updateResult) {
      setFixFlag(false);
      setReleaseOpen(false);
      setSnackBarMessage('出発解除しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
      window.close();
    } else {
      setReleaseOpen(false);
      setSnackBarMessage('出発解除に失敗しました');
      setSnackBarOpen(true);
      setIsProcessing(false);
    }
  };

  /**
   * 一括補正処理
   * @returns
   */
  const executeAdjust = async () => {
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
      setAdjustOpen(false);
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
              window.close();
            }}
          >
            閉じる
          </Button>
        </Box>
        <Paper variant="outlined">
          <Box display={'flex'} justifyContent={'space-between'} alignItems="center" px={2}>
            <Typography fontSize={'large'}>
              出庫明細({shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? '最終確認' : 'ピッキング'})
            </Typography>
            <Grid2 container alignItems={'center'} spacing={2}>
              {fixFlag && <Typography>出発済</Typography>}
              <Button
                onClick={() => setDepartureOpen(true)}
                disabled={
                  fixFlag || user?.permission.nyushuko === permission.nyushuko_ref || shukoDetailList.length === 0
                }
                sx={{ display: shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? 'block' : 'none' }}
              >
                出発
              </Button>
              <Button
                color="error"
                onClick={() => setReleaseOpen(true)}
                disabled={!fixFlag || user?.permission.nyushuko === permission.nyushuko_ref}
                sx={{ display: shukoDetailData.sagyoKbnId === SAGYO_KBN_ID.shukoConfirmation ? 'block' : 'none' }}
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
                <TextField value={shukoDetailData.juchuHeadId} sx={{ width: 100 }} disabled />
                <Typography mx={2}>受注日</Typography>
                <TestDate
                  date={shukoDetailData.juchuDat ? new Date(shukoDetailData.juchuDat) : null}
                  onChange={() => {}}
                  disabled
                />
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
                <TextField
                  value={shukoDetailData.nyushukoBashoId === BASHO_ID.kics ? 'KICS' : 'YARD'}
                  disabled
                  sx={{ width: 100 }}
                />
              </Box>
            </Grid2>
            <Grid2 container size={{ xs: 12, sm: 12, md: 6 }} direction={'column'} p={{ sx: 1, sm: 1, md: 1 }}>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={6}>公演名</Typography>
                <TextField value={shukoDetailData.koenNam ?? ''} fullWidth disabled />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={4}>公演場所</Typography>
                <TextField value={shukoDetailData.koenbashoNam ?? ''} fullWidth disabled />
              </Box>
              <Box display={'flex'} alignItems={'center'}>
                <Typography mr={6}>顧客名</Typography>
                <TextField value={shukoDetailData.kokyakuNam ?? ''} fullWidth disabled />
              </Box>
            </Grid2>
          </Grid2>
          <Box display={'flex'} alignItems={'center'} px={2} pb={2}>
            <Typography mr={2}>受注明細名</Typography>
            <TextField
              value={shukoDetailData.headNamv ?? ''}
              fullWidth
              disabled
              sx={{
                '.MuiOutlinedInput-input.Mui-disabled': {
                  WebkitTextFillColor:
                    shukoDetailData.juchuKizaiHeadKbn === JUCHU_KIZAI_HEAD_KBN.keep ? dispColors.keep : 'inherit',
                },
              }}
            />
          </Box>
          <Box display={'flex'} alignItems="center" px={2} pb={1}>
            <Typography mr={4}>明細メモ</Typography>
            <TextField multiline rows={3} fullWidth disabled value={shukoDetailData.memv ?? ''} />
          </Box>
          <Divider />
          <Box width={'100%'}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} width={'70vw'} p={1}>
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
                  onClick={() => setAdjustOpen(true)}
                  disabled={
                    !shukoDetailList.find((data) => data.diff !== 0) ||
                    fixFlag ||
                    user?.permission.nyushuko === permission.nyushuko_ref
                  }
                  sx={{ ml: 2 }}
                >
                  一括補正
                </Button>
              </Box>
            </Box>
          </Box>
          {shukoDetailList.length > 0 && (
            <ShukoDetailTable datas={shukoDetailList} fixFlag={fixFlag} user={user} setAdjustOpen={setAdjustOpen} />
          )}
        </Paper>
        <Dialog open={alertOpen}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="error" />
            <Box>{alertTitle}</Box>
          </DialogTitle>
          <DialogContentText m={2} p={2}>
            {alertMessage}
          </DialogContentText>
          <DialogActions>
            <Button onClick={() => setAlertOpen(false)}>確認</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={departureOpen}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="warning" />
            <Box>出発確認</Box>
          </DialogTitle>
          <DialogContentText m={2} p={2}>
            出発済みにしてよろしいですか？
          </DialogContentText>
          <DialogActions>
            <Button onClick={executeDeparture} loading={isProcessing}>
              出発
            </Button>
            <Button onClick={() => setDepartureOpen(false)} loading={isProcessing}>
              戻る
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={releaseOpen}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="warning" />
            <Box>出発解除確認</Box>
          </DialogTitle>
          <DialogContentText m={2} p={2}>
            出発解除してよろしいですか？
          </DialogContentText>
          <DialogActions>
            <Button onClick={executeRelease} loading={isProcessing} color="error">
              出発解除
            </Button>
            <Button onClick={() => setReleaseOpen(false)} loading={isProcessing}>
              戻る
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={adjustOpen}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="error" />
            <Box>一括補正</Box>
          </DialogTitle>
          <DialogContentText m={2} p={2}>
            一括補正してよろしいでしょうか？
          </DialogContentText>
          <DialogActions>
            <Button onClick={executeAdjust} loading={isProcessing}>
              一括補正
            </Button>
            <Button onClick={() => setAdjustOpen(false)} loading={isProcessing}>
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
