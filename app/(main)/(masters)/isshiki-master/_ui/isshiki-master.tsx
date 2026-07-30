'use client';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  TableContainer,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { permission } from '@/app/(main)/_lib/permission';
import { Loading } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable, MasterTableOfIsshiki } from '../../_ui/tables';
import { isshikiMHeader } from '../_lib/datas';
import { delIsshikiMaster, getFilteredIsshikis } from '../_lib/funcs';
import { IsshikisMasterTableValues } from '../_lib/types';
import { IsshikisMasterDialog } from './isshiki-master-dialog';

/**
 * 一式マスタ画面
 * @param {isshikis} 一式リスト
 * @returns {JSX.Element} 一式マスタコンポーネント
 */
export const IsshikisMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* user情報 */
  const user = useUserStore((state) => state.user);

  /* useState ------------------------------------- */
  /** 表示する一式の配列 */
  const [isshikis, setIsshikis] = useState<IsshikisMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  // エラーハンドリング
  const [error, setError] = useState<Error | null>(null);
  /* ダイアログ開く一式のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /** 選択された一式マスタidの配列 */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  /** 削除ダイアログの開閉 */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* methods ------------------------------------- */

  /* 詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /* ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /* 情報が変わったときに更新される */
  const refetchIsshikis = async () => {
    setIsLoading(true);
    try {
      const updated = await getFilteredIsshikis();
      setIsshikis(updated);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
    setIsLoading(false);
  };

  /** 削除ボタン押下時処理 */
  const handleClickDelete = async (ids: number[]) => {
    setIsLoading(true);
    try {
      await delIsshikiMaster(ids);
      setSelectedIds([]);
      setDeleteDialogOpen(false);
      refetchIsshikis();
      setSnackBarMessage('削除しました');
      setSnackBarOpen(true);
    } catch (e) {
      setSnackBarMessage('削除に失敗しました');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
  };

  /** チェックボックス押下（選択時）の処理 */
  const handleSelect = (id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selectedIds.slice(0, selectedIndex), selectedIds.slice(selectedIndex + 1));
    }
    setSelectedIds(newSelected);
  };

  /** 全選択チャックボックス押下時の処理 */
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && isshikis) {
      const newSelected = isshikis.map((r) => r.isshikiId);
      setSelectedIds(newSelected);
      return;
    }
    setSelectedIds([]);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      try {
        const dataList = await getFilteredIsshikis();
        setIsshikis(dataList);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
      setIsLoading(false);
    };
    getList();
  }, []);

  if (error) throw error;

  return (
    <PermissionGuard category={'masters'} required={permission.mst_ref}>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box
            width={'100%'}
            display={'flex'}
            px={2}
            sx={{ minHeight: '30px', maxHeight: '30px' }}
            alignItems={'center'}
          >
            <Typography>一式マスタ検索</Typography>
          </Box>
        </Paper>
        <Box>
          <Typography pt={1} pl={2}>
            一覧
          </Typography>
          <Divider />
          <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
            <Grid2 spacing={1}>
              <MuiTablePagination arrayList={isshikis ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
            </Grid2>
            <Grid2 container spacing={3}>
              <Grid2 alignContent={'center'}>
                {/* <Typography color="error" variant="body2">
                  ※マスタは削除できません。登録画面で無効化してください
                </Typography> */}
              </Grid2>
              <Grid2 container spacing={1}>
                <Button
                  onClick={() => handleOpenDialog(FAKE_NEW_ID)}
                  disabled={!((user?.permission.masters ?? 0) & permission.mst_upd)}
                >
                  <AddIcon fontSize="small" />
                  新規
                </Button>
                <Button
                  color="error"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={selectedIds.length === 0 || !((user?.permission.masters ?? 0) & permission.mst_upd)}
                >
                  <DeleteIcon fontSize="small" />
                  削除
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
          {isLoading ? (
            <Loading />
          ) : !isshikis || isshikis.length === 0 ? (
            <Typography>該当するデータがありません</Typography>
          ) : (
            <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
              {/* <MasterTable
                headers={isshikiMHeader}
                datas={isshikis.map((l) => ({ ...l, id: l.isshikiId, name: l.isshikiNam }))}
                handleOpenDialog={handleOpenDialog}
                page={page}
                rowsPerPage={rowsPerPage}
              /> */}
              <MasterTableOfIsshiki
                headers={isshikiMHeader}
                datas={isshikis.map((l) => ({ ...l, id: l.isshikiId, name: l.isshikiNam }))}
                selectedIds={selectedIds}
                handleOpenDialog={handleOpenDialog}
                page={page}
                rowsPerPage={rowsPerPage}
                handleSelectAllClick={handleSelectAllClick}
                handleSelect={handleSelect}
              />
            </TableContainer>
          )}
          <Dialog open={dialogOpen} fullScreen>
            <IsshikisMasterDialog
              user={user}
              handleClose={handleCloseDialog}
              isshikiId={openId}
              refetchIsshikis={refetchIsshikis}
              setSnackBarOpen={setSnackBarOpen}
              setSnackBarMessage={setSnackBarMessage}
            />
          </Dialog>
          <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
            <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
              <WarningIcon color="error" />
              <Box>削除</Box>
            </DialogTitle>
            <DialogContentText m={2}>{selectedIds.length}件削除されます。</DialogContentText>
            <DialogActions>
              <Button color="error" onClick={() => handleClickDelete(selectedIds)} loading={isLoading}>
                削除
              </Button>
              <Button onClick={() => setDeleteDialogOpen(false)}>戻る</Button>
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
      </Container>
    </PermissionGuard>
  );
};
