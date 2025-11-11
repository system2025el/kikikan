'use client';

import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  Fab,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { useUnsavedChangesWarning } from '@/app/(main)/_lib/hook';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { TestDate } from '@/app/(main)/_ui/date';
import { useDirty } from '@/app/(main)/_ui/dirty-context';

import { addIdoFix, delIdoFix, getIdoDenMaxId, saveIdoDen } from '../_lib/funcs';
import { IdoDetailTableValues, IdoDetailValues, SelectedIdoEqptsValues } from '../_lib/types';
import { NyukoIdoDenTable, ShukoIdoDenTable } from './ido-detail-table';
import { IdoEqptSelectionDialog } from './ido-equipment-selection-dialog';

export const IdoDetail = (props: {
  idoDetailData: IdoDetailValues;
  idoDetailTableData: IdoDetailTableValues[];
  fixFlag: boolean;
}) => {
  const { idoDetailData } = props;

  // user情報
  const user = useUserStore((state) => state.user);

  // 出発、到着フラグ
  const [fixFlag, setFixFlag] = useState(props.fixFlag);
  // 編集中フラグ
  const [editFlag, setEditFlag] = useState(false);
  // 保存フラグ
  const [saveFlag, setSaveFlag] = useState(true);

  // 移動明細リスト
  const [originIdoDetailList, setOriginIdoDetailList] = useState<IdoDetailTableValues[]>(props.idoDetailTableData);
  // 移動明細リスト
  const [idoDetailList, setIdoDetailList] = useState<IdoDetailTableValues[]>(props.idoDetailTableData);
  // 削除対象ID
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // 機材追加ダイアログ制御
  const [idoEqSelectionDialogOpen, setIdoEqSelectionDialogOpen] = useState(false);
  // 削除ダイアログ制御
  const [deleteOpen, setDeleteOpen] = useState(false);
  // 保存ダイアログ制御
  const [saveOpen, setSaveOpen] = useState(false);
  // 出発ダイアログ制御
  const [departureOpen, setDepartureOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  // context
  const { setIsDirty, setIsSave } = useDirty();
  // ブラウザバック、F5、×ボタンでページを離れた際のhook
  useUnsavedChangesWarning(editFlag, saveFlag);

  useEffect(() => {
    const unsavedData = originIdoDetailList.filter((d) => !d.saveFlag);
    if (unsavedData.length > 0) {
      setSaveFlag(false);
      setIsSave(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filterIdoDetailList = idoDetailList.filter((d) => !d.delFlag);
    if (JSON.stringify(originIdoDetailList) !== JSON.stringify(filterIdoDetailList)) {
      setEditFlag(true);
      setIsDirty(true);
    } else {
      setEditFlag(false);
      setIsDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idoDetailList]);

  /**
   * 出発、到着ボタン押下
   * @returns
   */
  const handleFix = async () => {
    if (!user || idoDetailList.length === 0) return;

    if (editFlag || !saveFlag) {
      setSaveOpen(true);
      return;
    }

    const message = idoDetailData.sagyoKbnId === 40 ? '出発' : '到着';
    let result = false;
    if (idoDetailData.sagyoKbnId === 40) {
      const diffCheck = idoDetailList.find((data) => data.diffQty !== 0);

      if (diffCheck) {
        setDepartureOpen(true);
        return;
      }

      result = await addIdoFix(
        60,
        idoDetailData.sagyoSijiId,
        idoDetailData.nyushukoDat,
        idoDetailData.nyushukoBashoId,
        user.name
      );
    } else {
      result = await addIdoFix(
        70,
        idoDetailData.sagyoSijiId,
        idoDetailData.nyushukoDat,
        idoDetailData.nyushukoBashoId,
        user.name
      );
    }

    if (result) {
      setFixFlag(true);
      setSnackBarMessage(`${message}しました`);
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage(`${message}に失敗しました`);
      setSnackBarOpen(true);
    }
  };

  /**
   * 出発解除ボタン押下時
   */
  const handleRelease = async () => {
    const result = await delIdoFix(
      60,
      idoDetailData.sagyoSijiId,
      idoDetailData.nyushukoDat,
      idoDetailData.nyushukoBashoId
    );

    if (result) {
      setFixFlag(false);
      setSnackBarMessage('出発解除しました');
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage('出発解除に失敗しました');
      setSnackBarOpen(true);
    }
  };

  /**
   * 保存ボタン押下時
   * @returns
   */
  const handleSave = async () => {
    if (!user || idoDetailList.length === 0) return;

    const updateData = await saveIdoDen(idoDetailList, user.name);

    if (updateData) {
      setOriginIdoDetailList(updateData);
      setIdoDetailList(updateData);
      setEditFlag(false);
      setIsDirty(false);
      setSaveFlag(true);
      setIsSave(true);
      setSnackBarMessage('保存しました');
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage('保存に失敗しました');
      setSnackBarOpen(true);
    }
  };

  /**
   * 移動数変更時
   * @param kizaiId 機材id
   * @param planQty 移動数
   */
  const handleCellChange = (kizaiId: number, planQty: number) => {
    setIdoDetailList((prev) =>
      prev.map((d) =>
        d.kizaiId === kizaiId ? { ...d, planQty: planQty, diffQty: d.resultQty + d.resultAdjQty - planQty } : d
      )
    );
  };

  // 移動明細削除ボタン押下時
  const handleIdoDenDelete = (kizaiId: number) => {
    setDeleteOpen(true);
    setDeleteId(kizaiId);
  };

  // 移動明細削除ダイアログの押下ボタンによる処理
  const handleDeleteResult = (result: boolean) => {
    if (!deleteId) return;

    if (result) {
      setIdoDetailList((prev) =>
        prev.map((data) => (data.kizaiId === deleteId && !data.delFlag ? { ...data, delFlag: true } : data))
      );
      setDeleteOpen(false);
      setDeleteId(null);
    } else {
      setDeleteOpen(false);
      setDeleteId(null);
    }
  };

  /**
   * 機材追加時
   * @param data 選択された機材データ
   */
  const setEqpts = async (data: SelectedIdoEqptsValues[]) => {
    const kizaiIds = new Set(idoDetailList.filter((data) => !data.delFlag).map((data) => data.kizaiId));
    const filterKizaiData = data.filter((d) => !kizaiIds.has(d.kizaiId));
    const selectIdoEqpt: IdoDetailTableValues[] = filterKizaiData.map((d) => ({
      idoDenId: 0,
      sagyoKbnId: idoDetailData.sagyoKbnId,
      nyushukoDat: idoDetailData.nyushukoDat,
      sagyosijiId: idoDetailData.sagyoSijiId,
      nyushukoBashoId: idoDetailData.nyushukoBashoId,
      juchuFlg: 0,
      kizaiId: d.kizaiId,
      kizaiNam: d.kizaiNam,
      shozokuId: d.shozokuId,
      rfidYardQty: d.rfidYardQty,
      rfidKicsQty: d.rfidKicsQty,
      planJuchuQty: 0,
      planLowQty: 0,
      planQty: 0,
      resultAdjQty: 0,
      resultQty: 0,
      diffQty: 0,
      ctnFlg: d.ctnFlg,
      delFlag: false,
      saveFlag: false,
    }));

    setIdoDetailList((prev) => [...prev, ...selectIdoEqpt]);
  };

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
          <Grid2 container alignItems={'center'} spacing={2}>
            {fixFlag && <Typography>{idoDetailData.sagyoKbnId === 40 ? '出発済' : '到着済'}</Typography>}
            <Button onClick={handleFix} disabled={fixFlag}>
              {idoDetailData.sagyoKbnId === 40 ? '出発' : '到着'}
            </Button>
            <Button
              color="error"
              onClick={handleRelease}
              disabled={!fixFlag}
              sx={{ display: idoDetailData.sagyoKbnId === 40 ? 'inline-flex' : 'none' }}
            >
              出発解除
            </Button>
          </Grid2>
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
                  <Button onClick={() => setIdoEqSelectionDialogOpen(true)} disabled={fixFlag}>
                    <AddIcon fontSize="small" />
                    機材追加
                  </Button>
                </Box>
              </Box>
              <Grid2 container alignItems={'center'} spacing={2}>
                <Typography sx={{ backgroundColor: 'rgba(158, 158, 158, 1)' }}>済</Typography>
                <Typography sx={{ backgroundColor: 'rgba(255, 171, 64, 1)' }}>不足</Typography>
                <Typography sx={{ backgroundColor: 'rgba(68, 138, 255, 1)' }}>コンテナ</Typography>
              </Grid2>
            </Box>
            {idoDetailList.filter((d) => !d.delFlag).length > 0 && (
              <ShukoIdoDenTable
                datas={idoDetailList}
                handleCellChange={handleCellChange}
                handleIdoDenDelete={handleIdoDenDelete}
                fixFlag={fixFlag}
              />
            )}
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
            {idoDetailList.filter((d) => !d.delFlag).length > 0 && <NyukoIdoDenTable datas={idoDetailList} />}
          </Box>
        )}
      </Paper>
      {/** 固定ボタン 保存＆ページトップ */}
      <Box position={'fixed'} zIndex={1050} bottom={25} right={25} alignItems={'center'}>
        <Fab variant="extended" color="primary" type="submit" sx={{ mr: 2 }}>
          <SaveAsIcon sx={{ mr: 1 }} />
          保存
        </Fab>
        <Fab
          color="primary"
          onClick={handleSave}
          disabled={fixFlag}
          sx={{ display: idoDetailData.sagyoKbnId === 40 ? 'inline-flex' : 'none' }}
        >
          <ArrowUpwardIcon />
        </Fab>
      </Box>
      <Dialog open={idoEqSelectionDialogOpen} fullScreen>
        <IdoEqptSelectionDialog setEqpts={setEqpts} handleCloseDialog={() => setIdoEqSelectionDialogOpen(false)} />
      </Dialog>
      <Dialog open={deleteOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>削除</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          削除してもよろしいでしょうか？
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => handleDeleteResult(true)}>削除</Button>
          <Button onClick={() => handleDeleteResult(false)}>戻る</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={departureOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>不足があります</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          不足があるため、出発できません
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setDepartureOpen(false)}>確認</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={saveOpen}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>出発できません</Box>
        </DialogTitle>
        <DialogContentText m={2} p={2}>
          未保存のデータがあるため、出発できません
        </DialogContentText>
        <DialogActions>
          <Button onClick={() => setSaveOpen(false)}>確認</Button>
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
