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

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/table';
import { BumonsMHeader } from '../_lib/data';
import { BumonsMasterDialogValues, BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterDialog } from './bumons-master-dialog';

/**
 * 部門マスタテーブル
 * @param
 * @returns {JSX.Element} 部門マスタテーブル
 */

export const BumonsMasterTable = ({ bumons }: { bumons: BumonsMasterDialogValues[] | undefined }) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState --------------------------------------- */
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ダイアログ開く部門のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);
  /* DBのローディング状態 */
  const [loading, setLoading] = useState(true);
  /* methods ---------------------------------------- */
  /* 選んだ部門ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    if (id === -100) {
      setEditable(true);
    }
    setOpenID(id);
    setDialogOpen(true);
  };
  /* ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? bumons!.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : bumons),
    [page, rowsPerPage, bumons]
  );

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={list!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={3}>
            <Grid2>
              <Typography color="error" variant="body2">
                ※マスタは削除できません。登録画面で削除フラグを付けてください
                <br />
                ※表示順を変更する場合は、検索条件無しで全件表示してください
              </Typography>
            </Grid2>
            <Grid2>
              <Button onClick={() => handleOpenDialog(-100)}>
                <AddIcon fontSize="small" />
                新規
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
          <MasterTable
            headers={BumonsMHeader}
            datas={list!.map((l) => ({ id: l.bumonId!, name: l.bumonNam, mem: l.mem!, delFlg: l.delFlg }))}
            handleOpenDialog={handleOpenDialog}
            page={page}
            rowsPerPage={rowsPerPage}
          />
          <Dialog open={dialogOpen} fullScreen>
            <BumonsMasterDialog
              handleClose={handleCloseDialog}
              bumonId={openId}
              editable={editable}
              setEditable={setEditable}
            />
          </Dialog>
        </TableContainer>
      </Box>
    </>
  );
};
