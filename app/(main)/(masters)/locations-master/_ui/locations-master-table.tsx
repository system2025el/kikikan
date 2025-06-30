'use client';
import { CheckBox, SellTwoTone } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  alpha,
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
  useTheme,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { SetStateAction, useMemo, useState } from 'react';

import { MasterTable } from '../../../_ui/table';
import { MuiTablePagination } from '../../../_ui/table-pagination';
import { lMHeader, locationList } from '../_lib/types';
import { LocationsMasterDialog } from './locations-master-dialog';

/** 車両マスタのテーブルコンポーネント */
export const LocationsMasterTable = () => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;
  /* ダイアログ開く公演場所のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<string | number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);
  const handleOpenDialog = (id: number) => {
    if (id === -100) {
      setEditable(true);
    }
    setOpenID(id);
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // 表示するデータ
  const list = useMemo(
    () =>
      rowsPerPage > 0 ? locationList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : locationList,
    [page, rowsPerPage]
  );

  return (
    <Box>
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={locationList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button onClick={() => handleOpenDialog(-100)}>
                <AddIcon fontSize="small" />
                新規
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>

      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
        <MasterTable
          headers={lMHeader}
          datas={list.map((l) => ({
            ...l,
            id: l.locId,
            address: `${l.adrShozai}${l.adrTatemono}${l.adrSonota}`,
          }))}
          handleOpenDialog={handleOpenDialog}
          page={page}
          rowsPerPage={rowsPerPage}
        />
        {/* <Table stickyHeader padding="none">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>車種</TableCell>
              <TableCell>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell padding="checkbox">
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
        </Table> */}
        <Dialog open={dialogOpen} fullScreen>
          <LocationsMasterDialog
            handleClose={handleCloseDialog}
            locationId={openId}
            editable={editable}
            setEditable={setEditable}
          />
        </Dialog>
      </TableContainer>
    </Box>
  );
};
