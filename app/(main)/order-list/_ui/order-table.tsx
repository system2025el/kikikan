import {
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useState } from 'react';

import { orderList } from '../../../_lib/mock-data';
import { MuiTablePagination } from '../../_ui/table-pagination';

/** 受注一覧テーブルのコンポーネント */
export const OrderTable = () => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - orderList.length) : 0;

  return (
    <>
      <TableContainer component={Paper} variant="outlined" square sx={{ maxHeight: 600, bgcolor: grey[200], mt: 3 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <MuiTablePagination
                arrayList={orderList}
                colSpan={3}
                rowsPerPage={rowsPerPage}
                sx={{ bgcolor: grey[200] }}
                page={page}
                setPage={setPage}
              />
              <TableCell colSpan={3} sx={{ bgcolor: grey[200] }}>
                <Button sx={{ ml: '40%', px: 1.5, py: 1.5 }} href="/new-order">
                  +新規受注
                </Button>
              </TableCell>
              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button color="error">-受注削除</Button>
              </TableCell>
              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button>受注マージ</Button>
              </TableCell>
              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button>受注コピー</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ bgcolor: grey[300], width: 50, maxWidth: 50, top: 65 }}></TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>受注番号</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>受注ステータス</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>公演名</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>公演場所</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>顧客名</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>受注日</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>出庫日</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>返却日</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0 ? orderList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : orderList).map(
              (order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox color="primary" />
                  </TableCell>
                  <TableCell>
                    <Button variant="text">{order.orderNumber}</Button>
                  </TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.location}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.orderedDate}</TableCell>
                  <TableCell>{order.issueDate}</TableCell>
                  <TableCell>{order.returnDate}</TableCell>
                </TableRow>
              )
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={8} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
