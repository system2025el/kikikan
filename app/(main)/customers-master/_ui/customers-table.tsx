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
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import TablePaginationActions from '@mui/material/TablePagination/TablePaginationActions';
import { useState } from 'react';

import { customers } from '../../../_lib/mock-data';
import { CustomerDialogContents } from './customers-dialog-contents';

export const CustomersMasterTable = () => {
  const [openId, setOpen] = useState(-100);
  const handleOpen = (id: number) => {
    setOpen(id);
  };
  const handleClose = () => {
    setOpen(-100);
  };
  const deleteInfo = (id: number) => {
    setOpen(-100);
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const handleOpenNewCustomer = () => {
    setDialogOpen(true);
  };
  const handleCloseNewCustomer = () => {
    setDialogOpen(false);
  };

  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - customers.length) : 0;

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  return (
    <TableContainer component={Paper} square sx={{ p: 2, maxHeight: 800, bgcolor: grey[200] }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TablePagination
              count={customers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              ActionsComponent={TablePaginationActions}
              rowsPerPageOptions={[20]}
              sx={{ bgcolor: grey[200], justifyContent: 'start' }}
              colSpan={2}
            />
            <TableCell colSpan={2} sx={{ bgcolor: grey[200] }}>
              <Button sx={{ ml: '40%' }} size="medium" onClick={() => handleOpenNewCustomer()}>
                +新規
              </Button>
              <Dialog open={dialogOpen} fullScreen>
                <CustomerDialogContents handleClose={handleCloseNewCustomer}></CustomerDialogContents>
              </Dialog>
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
              <TableRow key={customer.id}>
                <TableCell>
                  <CheckBox color="primary" />
                </TableCell>
                <TableCell>
                  <Button variant="text" onClick={() => handleOpen(customer.id)}>
                    {customer.name}
                  </Button>
                </TableCell>
                <Dialog open={openId === customer.id} fullScreen>
                  <CustomerDialogContents customerId={customer.id} handleClose={handleClose} />
                </Dialog>
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
