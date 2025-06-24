'use client';
import { CheckBox, SellTwoTone } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
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
import { SetStateAction, useEffect, useMemo, useState } from 'react';

import { MasterTable } from '@/app/(main)/_ui/table';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { BaseMasterTableValues, BasesMasterValues, bMHeader } from '../_lib/types';
import { BasesMasterDialog } from './bases-master-dailog';

export const BasesMasterTable = ({ bases }: { bases: BaseMasterTableValues[] | undefined }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 車両詳細ダイアログの開閉状態 */
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
    () => (rowsPerPage > 0 ? bases!.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : bases),
    [page, rowsPerPage, bases]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - bases!.length) : 0;

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          拠点一覧
        </Typography>
        <Divider />
        <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={bases!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button onClick={() => handleOpenDialog(-100)}>
                  <AddIcon fontSize="small" />
                  拠点追加
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>

        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
          <MasterTable
            headers={bMHeader}
            datas={list!.map((l) => ({ id: l.kyotenId!, kyotenNam: l.kyotenNam, mem: l.mem! }))}
            handleOpenDialog={handleOpenDialog}
            page={page}
            rowsPerPage={rowsPerPage}
          />
          <Dialog open={dialogOpen} fullScreen>
            <BasesMasterDialog
              handleClose={handleCloseDialog}
              baseId={openId}
              editable={editable}
              setEditable={setEditable}
            />
          </Dialog>
        </TableContainer>
      </Box>
    </>
  );
};
