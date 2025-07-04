'use client';

import { CheckBox } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import {
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
} from '@mui/material';
import { SetStateAction, useMemo, useState } from 'react';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/table';
import { EqptMasterData, EqptMasterDialogValues, eqptMasterList, eqptMHeader } from '../_lib/types';
import { EqMasterDialog } from './eqpt-master-dialog';

/** 機材マスタのテーブルコンポーネント */
export const EqptMasterTable = (props: {
  arrayList: EqptMasterDialogValues[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { arrayList, page, setPage } = props;
  /* ダイアログ開く機材のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 機材詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);

  const rowsPerPage = 50;
  // dialog
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
  // 表示するデータ
  //   const list = useMemo(
  //     () => (rowsPerPage > 0 ? arrayList.slice((page - 1) * rowsPerPage, page * rowsPerPage) : arrayList),
  //     [page, rowsPerPage]
  //   );//データ量多い時はこっちがいいけど改造が必要
  const list = rowsPerPage > 0 ? arrayList.slice((page - 1) * rowsPerPage, page * rowsPerPage) : arrayList;

  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - arrayList.length) : 0;

  return (
    <Box>
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={arrayList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
            <Button onClick={() => handleOpen(-100)}>
              <AddIcon fontSize="small" />
              新規
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
        <MasterTable
          headers={eqptMHeader}
          datas={eqptMasterList.map((l) => ({
            id: l.kizaiId,
            name: l.kizaiNam,
            rankAmt1: l.rankAmt1,
            rankAmt2: l.rankAmt2,
            rankAmt3: l.rankAmt3,
            rankAmt4: l.rankAmt4,
            rankAmt5: l.rankAmt5,
            delFlg: l.delFlg,
          }))}
          page={page}
          rowsPerPage={rowsPerPage}
          handleOpenDialog={handleOpen}
        />
        <Dialog open={dialogOpen} fullScreen>
          <EqMasterDialog handleClose={handleClose} eqptId={openId} editable={editable} setEditable={setEditable} />
        </Dialog>
      </TableContainer>
    </Box>
  );
};
