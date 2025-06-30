import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useMemo, useState } from 'react';

import { MasterTable } from '@/app/(main)/_ui/table';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { shukeibumonMHeader, ShukeibumonsMasterDialogValues } from '../_lib/type';
import { ShukeibumonsMasterDialog } from './shukeibumons-master-dialog';

export const ShukeibumonsMasterTable = ({ shukeibumons }: { shukeibumons: ShukeibumonsMasterDialogValues[] }) => {
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;
  /* ダイアログ開く集計部門のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* ダイアログでの編集モード管理 */
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
      rowsPerPage > 0 ? shukeibumons!.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : shukeibumons,
    [page, rowsPerPage, shukeibumons]
  );
  // テーブル最後のページ用の空データの長さ

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={shukeibumons!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
            headers={shukeibumonMHeader}
            datas={list!.map((l) => ({ id: l.shukeibumonId!, shukeibumonNam: l.shukeibumonNam, mem: l.mem! }))}
            handleOpenDialog={handleOpenDialog}
            page={page}
            rowsPerPage={rowsPerPage}
          />
          <Dialog open={dialogOpen} fullScreen>
            <ShukeibumonsMasterDialog
              handleClose={handleCloseDialog}
              shukeibumonId={openId}
              editable={editable}
              setEditable={setEditable}
            />
          </Dialog>
        </TableContainer>
      </Box>
    </>
  );
};
