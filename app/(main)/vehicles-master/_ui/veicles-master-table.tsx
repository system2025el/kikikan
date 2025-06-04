'use client';
import { CheckBox } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Dialog,
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
import { useState } from 'react';

import { vehicles } from '@/app/_lib/mock-data';

import { MuiTablePagination } from '../../_ui/table-pagination';
import { AddVehicleDialog } from './add-vehicle-dialog';

/** 車両マスタのテーブルコンポーネント */
export const VehiclesMasterTable = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - vehicles.length) : 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const handleOpenNewVehicle = () => {
    setDialogOpen(true);
  };
  const handleCloseNewVehicle = () => {
    setDialogOpen(false);
  };
  return (
    <Box>
      <Typography pt={2} pl={2}>
        車両一覧
      </Typography>
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={vehicles} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button href="/new-order">
                <AddIcon fontSize="small" />
                車両追加
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
              <TableCell sx={{ bgcolor: 'primary.light' }}></TableCell>
              <TableCell sx={{ bgcolor: 'primary.light' }}>車種</TableCell>
              <TableCell sx={{ bgcolor: 'primary.light' }}>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? vehicles.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : vehicles
            ).map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <CheckBox color="primary" />
                </TableCell>
                <TableCell>{vehicle.vehicleType}</TableCell>
                <TableCell>{vehicle.memo}</TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 30 * emptyRows }}>
                <TableCell colSpan={3} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
