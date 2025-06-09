'use client';
import { CheckBox } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
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

import { customers } from '../../../_lib/mock-data';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { CustomerDialogContents } from './customers-dialog-contents';

/** 顧客マスタのテーブルコンポーネント */
export const CustomersMasterTable = () => {
  const [openId, setOpenID] = useState(-100);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [page, setPage] = useState(1);
  const rowsPerPage = 50;
  // dialog
  const handleOpen = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  const handleClose = () => {
    setOpenID(-100);
    setDialogOpen(false);
  };
  const deleteInfo = (id: number) => {
    setOpenID(-100);
    setDialogOpen(false);
  };
  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? customers.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : customers),
    [page, rowsPerPage]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - customers.length) : 0;

  return (
    <Box>
      <Typography pt={2} pl={2}>
        顧客一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={customers} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button href="/new-order">
                <AddIcon fontSize="small" />
                追加
              </Button>
            </Grid2>
            <Grid2>
              <Button color="error">
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
              <TableCell></TableCell>
              <TableCell>顧客名</TableCell>
              <TableCell>住所</TableCell>
              <TableCell>TEL</TableCell>
              <TableCell>FAX</TableCell>
              <TableCell>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((customer) => (
              <TableRow key={customer.id} onClick={() => handleOpen(customer.id)}>
                <TableCell>
                  <CheckBox color="primary" />
                </TableCell>
                <TableCell>
                  <Button variant="text">{customer.name}</Button>
                </TableCell>

                <TableCell>
                  {customer.addressA} {customer.addressB}
                </TableCell>
                <TableCell>{customer.tel}</TableCell>
                <TableCell>{customer.fax}</TableCell>
                <TableCell sx={{ maxWidth: 30 }}>
                  <Typography noWrap>{customer.memo}</Typography>
                </TableCell>
              </TableRow>
            ))}
            <Dialog open={dialogOpen} fullScreen>
              <CustomerDialogContents customerId={openId} handleClose={handleClose} />
            </Dialog>
            {emptyRows > 0 && (
              <TableRow style={{ height: 30 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
