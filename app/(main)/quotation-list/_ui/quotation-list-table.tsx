'use client';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
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
} from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useMemo, useState } from 'react';

import { orderList, quotaionList } from '@/app/_lib/mock-data';

import { MuiTablePagination } from '../../_ui/table-pagination';

/** 見積一覧テーブルのコンポーネント */
export const QuotaionListTable = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () =>
      rowsPerPage > 0 ? quotaionList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : quotaionList,
    [page, rowsPerPage]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - list.length) : 0;

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          見積一覧
        </Typography>
        <Divider />
        <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={quotaionList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button href="/new-order">
                  <AddIcon fontSize="small" />
                  新規見積
                </Button>
              </Grid2>
              <Grid2>
                <Button color="error">
                  <DeleteIcon fontSize="small" />
                  見積削除
                </Button>
              </Grid2>
            </Grid2>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button>
                  <ContentCopyIcon fontSize="small" />
                  見積コピー
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
          <Table stickyHeader padding="none">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'primary.light', width: 50, maxWidth: 50 }}></TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>見積番号</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>見積ステータス</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light', minWidth: '20%' }}>見積件名</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light', minWidth: '20%' }}>見積相手</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light', minWidth: 100 }}>見積日</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light', minWidth: 100 }}>請求番号</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light', minWidth: 100 }}>見積メモ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((quotation) => (
                <TableRow key={quotation.id}>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" />
                  </TableCell>
                  <TableCell>
                    <Button variant="text">{quotation.quoteNumber}</Button>
                  </TableCell>
                  <TableCell>{quotation.status}</TableCell>
                  <TableCell>{quotation.name}</TableCell>
                  <TableCell>{quotation.customerName}</TableCell>
                  <TableCell>{quotation.quotationDate}</TableCell>
                  <TableCell>{quotation.invoiceNumber}</TableCell>
                  <TableCell>{quotation.quotationmemo}</TableCell>
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
