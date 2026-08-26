import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { grey, red } from '@mui/material/colors';
import { useEffect, useState } from 'react';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { permission } from '@/app/(main)/_lib/permission';
import { User } from '@/app/(main)/_lib/types';
import { Loading } from '@/app/(main)/_ui/loading';

import { LightTooltipWithText } from '../../../_ui/tables';
import { deleteRfidTags, getRfidsOfTheKizai } from '../_lib/funcs';
import { RfidsMasterTableValues } from '../_lib/types';

export const RfidDeleteDialog = ({
  user,
  kizaiId,
  handleClose,
  refetchRfids,
}: {
  user: User;
  kizaiId: number;
  handleClose: () => void;
  refetchRfids: () => Promise<void>;
}) => {
  /** DBから取得した、まだ削除していないRFIDタグ一覧 */
  const [rfids, setRfids] = useState<RfidsMasterTableValues[]>([]);
  /** 削除予定（未確定・DBはまだ変更されていない）のRFIDタグ一覧 */
  const [pendingDelete, setPendingDelete] = useState<RfidsMasterTableValues[]>([]);
  /** 一覧テーブルで選択中のタグID */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  /** DBのローディング状態 */
  const [isLoading, setIsLoading] = useState(true);
  /** 削除確定（保存）処理中かどうか */
  const [isSaving, setIsSaving] = useState(false);
  /** 削除確認（はい・いいえ）ダイアログの開閉状態 */
  const [confirmOpen, setConfirmOpen] = useState(false);
  /** 未確定の削除予定を残したまま閉じようとした時の確認ダイアログ */
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  /** スナックバー */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  const [snackBarMessage, setSnackBarMessage] = useState('');

  const canDelete = Boolean((user?.permission.masters ?? 0) & permission.mst_upd);

  /* methods --------------------------------------------------- */
  /** 一覧を取得し直す */
  const refetch = async () => {
    setIsLoading(true);
    const list = await getRfidsOfTheKizai(kizaiId);
    setRfids(list ?? []);
    setIsLoading(false);
  };

  /** チェックボックス押下（選択時）の処理 */
  const handleSelectRfidTag = (id: string) => {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  };

  /** 全選択チェックボックス押下時の処理 */
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedTags(event.target.checked ? rfids.map((r) => r.rfidTagId) : []);
  };

  /** 「削除」ボタン押下時：はい・いいえの確認ダイアログを開く */
  const handleClickDelete = () => {
    if (selectedTags.length === 0) return;
    setConfirmOpen(true);
  };

  /** 確認ダイアログで「はい」：削除予定リストへ移動する（まだDBは変更しない） */
  const handleConfirmYes = () => {
    setPendingDelete((prev) => [...prev, ...rfids.filter((r) => selectedTags.includes(r.rfidTagId))]);
    setRfids((prev) => prev.filter((r) => !selectedTags.includes(r.rfidTagId)));
    setSelectedTags([]);
    setConfirmOpen(false);
  };

  /** 確認ダイアログで「いいえ」：何もせず閉じる */
  const handleConfirmNo = () => {
    setConfirmOpen(false);
  };

  /** 削除予定リストの「取り消し（アンドゥ）」：一覧に戻す（まだDBは変更しない） */
  const handleUndo = (tagId: string) => {
    const target = pendingDelete.find((r) => r.rfidTagId === tagId);
    if (!target) return;
    setPendingDelete((prev) => prev.filter((r) => r.rfidTagId !== tagId));
    setRfids((prev) => [...prev, target].sort((a, b) => a.tblDspId - b.tblDspId));
  };

  /** 「保存（決定）」：削除予定リストの内容を物理削除として確定する */
  const handleSave = async () => {
    if (pendingDelete.length === 0) return;
    setIsSaving(true);
    try {
      await deleteRfidTags(
        pendingDelete.map((r) => r.rfidTagId),
        kizaiId
      );
      setSnackBarMessage(`${pendingDelete.length}件のRFIDタグを削除しました`);
      setPendingDelete([]);
      await refetch();
      await refetchRfids();
    } catch (e) {
      setSnackBarMessage('削除に失敗しました');
    } finally {
      setSnackBarOpen(true);
      setIsSaving(false);
    }
  };

  /** 閉じるボタン押下時 */
  const handleClickClose = () => {
    if (pendingDelete.length > 0) {
      setCloseConfirmOpen(true);
    } else {
      handleClose();
    }
  };

  /* useEffect ------------------------------------------------- */
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kizaiId]);

  return (
    <Box sx={{ bgcolor: red[50], minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          bgcolor: 'error.dark',
          color: 'error.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1,
        }}
      >
        <Box display={'flex'} alignItems={'center'}>
          <WarningIcon sx={{ mr: 1 }} />
          <Typography variant="h6">RFIDタグ物理削除（この操作は元に戻せません）</Typography>
        </Box>
        <IconButton onClick={handleClickClose} sx={{ color: 'error.contrastText' }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ border: '3px solid', borderColor: 'error.main', m: 2, flexGrow: 1 }}>
        {isLoading ? (
          <Loading />
        ) : (
          <Box p={2}>
            <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} mb={1}>
              <Typography>現在のRFIDタグ一覧</Typography>
              <Button
                color="error"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={handleClickDelete}
                disabled={selectedTags.length === 0 || !canDelete}
              >
                削除
              </Button>
            </Box>
            <TableContainer component={Paper} square variant="outlined" sx={{ maxHeight: '40vh' }}>
              {rfids.length === 0 ? (
                <Typography p={2}>該当するRFIDタグがありません</Typography>
              ) : (
                <Table stickyHeader size="small" padding="none">
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          onChange={handleSelectAllClick}
                          indeterminate={selectedTags.length > 0 && selectedTags.length < rfids.length}
                          checked={rfids.length > 0 && selectedTags.length === rfids.length}
                        />
                      </TableCell>
                      <TableCell padding="checkbox" />
                      <TableCell align="right">EL No.</TableCell>
                      <TableCell>RFIDタグID</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>メモ</TableCell>
                      <TableCell>最終在庫場所</TableCell>
                      <TableCell>更新日時</TableCell>
                      <TableCell>担当者</TableCell>
                      <TableCell>無効</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rfids.map((row) => {
                      const isItemSelected = selectedTags.includes(row.rfidTagId);
                      return (
                        <TableRow key={row.rfidTagId} hover selected={isItemSelected}>
                          <TableCell
                            padding="checkbox"
                            onClick={() => handleSelectRfidTag(row.rfidTagId)}
                            sx={{ cursor: 'pointer', bgcolor: row.delFlg ? grey[300] : undefined }}
                          >
                            <Checkbox color="primary" checked={isItemSelected} />
                          </TableCell>
                          <TableCell align="right" sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            {row.tblDspId}
                          </TableCell>
                          <TableCell align="right" sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            {row.elNum}
                          </TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>{row.rfidTagId}</TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>{row.stsNam}</TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            <LightTooltipWithText variant={'body2'} maxWidth={400}>
                              {row.mem}
                            </LightTooltipWithText>
                          </TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            <LightTooltipWithText variant={'body2'} maxWidth={400}>
                              {row.shozokuNam}
                            </LightTooltipWithText>
                          </TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            <LightTooltipWithText variant={'body2'} maxWidth={400}>
                              {row.updDat
                                ? toJapanTimeString(row.updDat)
                                : row.addDat
                                  ? toJapanTimeString(row.addDat)
                                  : ''}
                            </LightTooltipWithText>
                          </TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            <LightTooltipWithText variant={'body2'} maxWidth={400}>
                              {row.updUser ?? row.addUser}
                            </LightTooltipWithText>
                          </TableCell>
                          <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined }}>
                            {row.delFlg ? '無効' : ''}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TableContainer>

            <Divider sx={{ my: 2 }} />

            <Typography color="error">削除予定リスト（「保存（決定）」を押すまでは削除されません）</Typography>
            <TableContainer component={Paper} square variant="outlined" sx={{ maxHeight: '40vh', mt: 1 }}>
              {pendingDelete.length === 0 ? (
                <Typography p={2}>削除予定のRFIDタグはありません</Typography>
              ) : (
                <Table stickyHeader size="small" padding="none">
                  <TableHead>
                    <TableRow>
                      <TableCell align="right" />
                      <TableCell align="right">EL No.</TableCell>
                      <TableCell>RFIDタグID</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>メモ</TableCell>
                      <TableCell>最終在庫場所</TableCell>
                      <TableCell>更新日時</TableCell>
                      <TableCell>担当者</TableCell>
                      <TableCell>無効</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingDelete.map((row) => (
                      <TableRow key={row.rfidTagId} hover sx={{ bgcolor: red[50] }}>
                        <TableCell align="right">{row.tblDspId}</TableCell>
                        <TableCell align="right">{row.elNum}</TableCell>
                        <TableCell>{row.rfidTagId}</TableCell>
                        <TableCell>{row.stsNam}</TableCell>
                        <TableCell>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.mem}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.shozokuNam}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.updDat
                              ? toJapanTimeString(row.updDat)
                              : row.addDat
                                ? toJapanTimeString(row.addDat)
                                : ''}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.updUser ?? row.addUser}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell>{row.delFlg ? '無効' : ''}</TableCell>
                        <TableCell align="right">
                          <Button size="small" onClick={() => handleUndo(row.rfidTagId)}>
                            取り消し
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TableContainer>

            <Box display={'flex'} justifyContent={'flex-end'} mt={2}>
              <Button
                color="error"
                variant="contained"
                loading={isSaving}
                onClick={handleSave}
                disabled={pendingDelete.length === 0 || !canDelete}
              >
                保存（決定）
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* 削除確認（はい・いいえ） */}
      <Dialog open={confirmOpen} onClose={handleConfirmNo}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          <Box>削除の確認</Box>
        </DialogTitle>
        <DialogContentText m={2}>
          選択した{selectedTags.length}件のRFIDタグを削除予定リストに追加します。よろしいですか？
        </DialogContentText>
        <DialogActions>
          <Button color="error" onClick={handleConfirmYes}>
            はい
          </Button>
          <Button onClick={handleConfirmNo}>いいえ</Button>
        </DialogActions>
      </Dialog>

      {/* 削除予定を残したまま閉じようとした時の確認 */}
      <Dialog open={closeConfirmOpen} onClose={() => setCloseConfirmOpen(false)}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" sx={{ mr: 1 }} />
          <Box>保存されていません</Box>
        </DialogTitle>
        <DialogContentText m={2}>
          削除予定リストに{pendingDelete.length}件残っています。保存せずに閉じますか？
          <br />
          （閉じてもRFIDタグ自体はまだ削除されていません）
        </DialogContentText>
        <DialogActions>
          <Button
            color="error"
            onClick={() => {
              setCloseConfirmOpen(false);
              handleClose();
            }}
          >
            閉じる
          </Button>
          <Button onClick={() => setCloseConfirmOpen(false)}>戻る</Button>
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
