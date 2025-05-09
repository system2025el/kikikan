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
  TablePagination,
  TableRow,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import TablePaginationActions from '@mui/material/TablePagination/TablePaginationActions';
import { useState } from 'react';

import { vehicles } from '@/app/_lib/mock-data';

import { CustomerDialogContents } from '../../customers-master/_ui/customers-dialog-contents';
import { AddVehicleDialog } from './add-vehicle-dialog';

export const VehiclesMasterTable = () => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - vehicles.length) : 0;

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const [dialogOpen, setDialogOpen] = useState(false);
  const handleOpenNewVehicle = () => {
    setDialogOpen(true);
  };
  const handleCloseNewVehicle = () => {
    setDialogOpen(false);
  };
  return (
    <>
      <TableContainer component={Paper} square sx={{ p: 2, maxHeight: 800, bgcolor: grey[200] }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TablePagination
                count={vehicles.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                ActionsComponent={TablePaginationActions}
                rowsPerPageOptions={[20]}
                sx={{ bgcolor: grey[200], justifyContent: 'start' }}
                colSpan={2}
              />
              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button sx={{ ml: '40%' }} size="medium" onClick={() => handleOpenNewVehicle()}>
                  +新規
                </Button>
                <Dialog open={dialogOpen} fullScreen>
                  <AddVehicleDialog handleClose={handleCloseNewVehicle}></AddVehicleDialog>
                </Dialog>
                <Button color="error" sx={{ ml: '20%' }}>
                  -削除
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ bgcolor: grey[300] }}></TableCell>
              <TableCell sx={{ bgcolor: grey[300] }}>車種</TableCell>
              <TableCell sx={{ bgcolor: grey[300] }}>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0 ? vehicles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) : vehicles).map(
              (vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell>
                    <CheckBox color="primary" />
                  </TableCell>
                  <TableCell>{vehicle.vehicleType}</TableCell>
                  <TableCell>{vehicle.memo}</TableCell>
                </TableRow>
              )
            )}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={3} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
