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

import { quotaionList } from '@/app/_lib/mock-data';

import { MuiTablePagination } from '../../_ui/table-pagination';

/** 見積一覧テーブルのコンポーネント */
export const QuotaionListTable = () => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - quotaionList.length) : 0;

  return (
    <>
      <TableContainer component={Paper} variant="outlined" square sx={{ maxHeight: 600, bgcolor: grey[200], mt: 3 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <MuiTablePagination
                arrayList={quotaionList}
                colSpan={3}
                rowsPerPage={rowsPerPage}
                sx={{ bgcolor: grey[200], justifyContent: 'start' }}
                page={page}
                setPage={setPage}
              />
              <TableCell colSpan={3} sx={{ bgcolor: grey[200] }}>
                <Button sx={{ ml: '40%' }} size="medium" href="/quotation-list/quotation">
                  +新規見積
                </Button>
              </TableCell>
              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button color="error">-見積削除</Button>
              </TableCell>

              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button>見積コピー</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ bgcolor: grey[300], width: 50, maxWidth: 50, top: 65 }}></TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>見積番号</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>見積ステータス</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>見積件名</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>見積相手</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>見積日</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>請求番号</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>見積メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? quotaionList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : quotaionList
            ).map((quotation) => (
              <TableRow key={quotation.id}>
                <TableCell>
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
