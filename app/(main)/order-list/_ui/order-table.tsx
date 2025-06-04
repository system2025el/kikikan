'use client';

import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import MergeIcon from '@mui/icons-material/Merge';
import {
  alpha,
  Box,
  Button,
  Checkbox,
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
  useTheme,
} from '@mui/material';
import React, { useMemo, useState } from 'react';

import { orderList } from '../../../_lib/mock-data';
import { MuiTablePagination } from '../../_ui/table-pagination';

/** 受注一覧テーブルのコンポーネント */
export const OrderTable = () => {
  const theme = useTheme();

  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? orderList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : orderList),
    [page, rowsPerPage]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - list.length) : 0;

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          受注一覧
        </Typography>
        <Divider />
        <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={orderList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button href="/new-order">
                  <AddIcon fontSize="small" />
                  新規受注
                </Button>
              </Grid2>
              <Grid2>
                <Button color="error">
                  <DeleteIcon fontSize="small" />
                  受注削除
                </Button>
              </Grid2>
            </Grid2>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button>
                  <MergeIcon fontSize="small" />
                  受注マージ
                </Button>
              </Grid2>
              <Grid2>
                <Button>
                  <ContentCopyIcon fontSize="small" />
                  受注コピー
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
          <Table stickyHeader size="small" padding="none">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'primary.light' }}></TableCell>
                <TableCell align="center" sx={{ bgcolor: 'primary.light' }}>
                  受注番号
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={100} maxWidth={100}>
                    受注ステータス
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={100} maxWidth={100}>
                    公演名
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={100} maxWidth={100}>
                    公演場所
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={200} maxWidth={200}>
                    顧客名
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={100} maxWidth={100}>
                    受注日
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={100} maxWidth={100}>
                    受注開始日
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>
                  <Box minWidth={100} maxWidth={100}>
                    終了日
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((order) => (
                <TableRow key={order.id}>
                  <TableCell padding="checkbox">
                    <Box minWidth={10} maxWidth={10}>
                      <Checkbox color="primary" />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Button variant="text">
                      <Box minWidth={60} maxWidth={60}>
                        {order.orderNumber}
                      </Box>
                    </Button>
                  </TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.location}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.orderedDate}</TableCell>
                  <TableCell>{order.issueDate}</TableCell>
                  <TableCell>{order.returnDate}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 30 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};
