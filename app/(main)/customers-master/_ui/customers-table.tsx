'use client';

import { CheckBox } from '@mui/icons-material';
import {
  Button,
  Dialog,
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
import { useState } from 'react';

import { customers } from '../../../_lib/mock-data';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { CustomerDialogContents } from './customers-dialog-contents';

/** 顧客マスタのテーブルコンポーネント */
export const CustomersMasterTable = () => {
  const [openId, setOpenID] = useState(-100);
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

  const [dialogOpen, setDialogOpen] = useState(false);

  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - customers.length) : 0;
  return (
    <TableContainer component={Paper} square sx={{ p: 2, maxHeight: 800, bgcolor: grey[200] }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <MuiTablePagination
              arrayList={customers}
              colSpan={2}
              rowsPerPage={rowsPerPage}
              sx={{ bgcolor: grey[200], justifyContent: 'start' }}
              page={page}
              setPage={setPage}
            />
            <TableCell colSpan={2} sx={{ bgcolor: grey[200] }}>
              <Button sx={{ ml: '40%' }} size="medium" onClick={() => handleOpen(-100)}>
                +新規
              </Button>
              {/* <Dialog open={dialogOpen} fullScreen>
                <CustomerDialogContents handleClose={handleCloseNewCustomer}></CustomerDialogContents>
              </Dialog> */}
            </TableCell>
            <TableCell colSpan={2} sx={{ bgcolor: grey[200] }}>
              <Button color="error">-削除</Button>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell sx={{ bgcolor: grey[300] }}></TableCell>
            <TableCell sx={{ bgcolor: grey[300] }}>顧客名</TableCell>
            <TableCell sx={{ bgcolor: grey[300] }}>住所</TableCell>
            <TableCell sx={{ bgcolor: grey[300] }}>TEL</TableCell>
            <TableCell sx={{ bgcolor: grey[300] }}>FAX</TableCell>
            <TableCell sx={{ bgcolor: grey[300] }}>メモ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(rowsPerPage > 0 ? customers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : customers).map(
            (customer) => (
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
            )
          )}
          <Dialog open={dialogOpen} fullScreen>
            <CustomerDialogContents customerId={openId} handleClose={handleClose} />
          </Dialog>
          {emptyRows > 0 && (
            <TableRow style={{ height: 53 * emptyRows }}>
              <TableCell colSpan={6} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
