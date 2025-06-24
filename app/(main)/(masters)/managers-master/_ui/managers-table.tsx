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

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { managers } from '../_lib/data';
import { ManagerMasterTableValues, mMHeader } from '../_lib/types';
import { ManagerDialogContents } from './managers-dialog-contents';

/** 担当者マスタのテーブルコンポーネント */
export const ManagerssMasterTable = () => {
  /* useState
   * -------------------------------------------------------- */
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState(-100);
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* ソート方法 */
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  /* ソート対象 */
  const [orderBy, setOrderBy] = useState<string>('');
  /* 表示する列 今のところソート、フィルターなし */
  const [managersList, setManagersList] = useState<ManagerMasterTableValues[]>(managers);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);

  const [selected, setSelected] = useState<number[]>([]);

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
  /** */
  const deleteInfo = (id: number) => {
    setOpenID(-100);
    setDialogOpen(false);
  };

  const handleSelect = (id: number) => {
    const newSelected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];

    setSelected(newSelected);
  };

  const handleDelete = () => {
    const newManagersList = managersList.filter((manager) => !selected.includes(manager.Id));
    setManagersList(newManagersList);
  };

  /**
   *
   */
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
  /**
   * テーブル最後のページ用の空データの長さ
   */
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - managersList.length) : 0;

  return (
    <Box>
      {/* {loading ? (
        <p>読み込み中...</p>
      ) : ( */}
      {/* <> */}
      <Typography pt={2} pl={2}>
        担当者一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={managersList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button onClick={() => handleOpen(-100)}>
                <AddIcon fontSize="small" />
                追加
              </Button>
            </Grid2>
            <Grid2>
              <Button color="error" onClick={handleDelete}>
                <DeleteIcon fontSize="small" />
                削除
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
        <Table stickyHeader padding="none">
          <TableHead>
            <TableRow>
              {mMHeader.map((column) => (
                <TableCell key={column.id} /*sortDirection={orderBy === column.id ? order : 'desc'}*/>
                  {column.label}
                  {/* <TableSortLabel
            active={orderBy === column.id}
            direction={orderBy === column.id ? order : 'asc'}
            onClick={createSortHandler(column.id)}
          ></TableSortLabel> */}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((manager) => (
              <TableRow key={manager.Id} onClick={() => handleOpen(manager.Id)}>
                <TableCell>
                  <Checkbox
                    checked={selected.includes(manager.Id)}
                    onChange={() => handleSelect(manager.Id)}
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Button variant="text">{manager.Nam}</Button>
                </TableCell>
              </TableRow>
            ))}
            <Dialog open={dialogOpen} fullScreen>
              <ManagerDialogContents
                managerId={openId}
                handleClose={handleClose}
                editable={editable}
                setEditable={setEditable}
              />
            </Dialog>
            {emptyRows > 0 && (
              <TableRow style={{ height: 30 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* </>
      )} */}
    </Box>
  );
};
