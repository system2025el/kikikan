import {
  Box,
  Button,
  Checkbox,
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
        <Typography pt={2} pl={2}>
          受注一覧
        </Typography>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <MuiTablePagination
                arrayList={orderList}
                colSpan={4}
                rowsPerPage={rowsPerPage}
                sx={{
                  bgcolor: grey[200],
                  justifyItems: 'start',
                }}
                page={page}
                setPage={setPage}
              />
              <TableCell colSpan={2} sx={{ bgcolor: grey[200] }}>
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
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}></TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }} align="center">
                受注番号
              </TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65, maxWidth: 100 }}>
                <Box maxWidth={100}>受注ステータス</Box>
              </TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>公演名</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>公演場所</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>顧客名</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>受注日</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>受注開始日</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>終了日</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0 ? orderList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : orderList).map(
              (order) => (
                <TableRow key={order.id}>
                  <TableCell>
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
                  <TableCell>
                    <Box minWidth={60} maxWidth={60}>
                      {order.status}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      {order.name}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      {order.location}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      {order.customerName}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={'5vw'} maxWidth={'5vw'}>
                      {order.orderedDate}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={'5vw'} maxWidth={'5vw'}>
                      {order.issueDate}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={'5vw'} maxWidth={'5vw'}>
                      {order.returnDate}
                    </Box>
                  </TableCell>
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
