'use client';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {} from '@mui/material/colors';
import { useMemo, useState } from 'react';

import { MasterTable } from '@/app/(main)/_ui/table';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { managers } from '../_lib/data';
import { ManagerMasterTableValues, mMHeader } from '../_lib/types';
import { ManagerDialogContents } from './managers-master-dialog';

/**
 * 担当者マスタのテーブル
 * @returns {JSX.Element} 担当者マスタのテーブルコンポーネント
 */
export const ManagerssMasterTable = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState
   * -------------------------------------------------------- */
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState(-100);
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ソート方法 */
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  /* ソート対象 */
  const [orderBy, setOrderBy] = useState<string>('');
  /* 表示する列 今のところソート、フィルターなし */
  const [managersList, setManagersList] = useState<ManagerMasterTableValues[]>(managers);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);
  /* DBのローディング状態 */
  const [loading, setLoading] = useState(true);

  /* Methods
  ------------------------------------------------------------ */
  /**
   * 担当者詳細ダイアログを開く関数
   * @param id 担当者ID
   */
  const handleOpen = (id: number) => {
    if (id === -100) {
      setEditable(true);
    }
    setOpenID(id);
    setDialogOpen(true);
    console.log(managers[id - 1]);
  };
  /**
   * 担当者詳細ダイアログを閉じる関数
   */
  const handleClose = () => {
    setOpenID(-100);
    setDialogOpen(false);
  };

  /* ソート対象、方法の変更 */
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const createSortHandler = (property: string) => {
    handleRequestSort(property);
  };
  /**
   *  表示する担当者リスト
   */
  const list = useMemo(
    () =>
      rowsPerPage > 0 ? managersList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : managersList,
    [page, rowsPerPage, managersList]
  );
  console.log('list is here : ', list);

  return (
    <Box>
      {/* {loading ? (
        <p>読み込み中...</p>
      ) : ( */}
      {/* <> */}
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={managersList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={3}>
          <Grid2>
            <Typography color="error" variant="body2">
              ※マスタは削除できません。登録画面で削除フラグを付けてください
              <br />
              ※表示順を変更する場合は、検索条件無しで全件表示してください
            </Typography>
          </Grid2>
          <Grid2>
            <Button onClick={() => handleOpen(-100)}>
              <AddIcon fontSize="small" />
              新規
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
        <MasterTable
          headers={mMHeader}
          datas={managers.map((l) => ({ ...l, id: l.tantouId }))}
          page={page}
          rowsPerPage={rowsPerPage}
          handleOpenDialog={handleOpen}
        />
        <Dialog open={dialogOpen} fullScreen>
          <ManagerDialogContents
            managerId={openId}
            handleClose={handleClose}
            editable={editable}
            setEditable={setEditable}
          />
        </Dialog>
      </TableContainer>
      {/* </>
      )} */}
    </Box>
  );
};
