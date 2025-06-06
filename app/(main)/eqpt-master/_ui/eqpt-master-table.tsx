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
import { useMemo, useState } from 'react';

import { MuiTablePagination } from '../../_ui/table-pagination';
import { EqptMasterData, eqptMasterList } from '../_lib/types';

/** 機材マスタのテーブルコンポーネント */
export const EqptMasterTable = (props: {
  arrayList: EqptMasterData[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const { arrayList, page, setPage } = props;
  const [openId, setOpenID] = useState(-100);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        顧客一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={arrayList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button>
                <FileDownloadIcon fontSize="small" />
                Excel表インポート
              </Button>
            </Grid2>
            <Grid2>
              <Button>
                <FileUploadIcon fontSize="small" />
                Excel表エクスポート
              </Button>
            </Grid2>
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button href="/new-order">
                <AddIcon fontSize="small" />
                追加
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
              <TableCell></TableCell>
              <TableCell>機材名</TableCell>
              <TableCell>保有数</TableCell>
              <TableCell>部門</TableCell>
              <TableCell>大部門</TableCell>
              <TableCell>集計部門</TableCell>
              <TableCell>一式</TableCell>
              <TableCell>シリアル</TableCell>
              <TableCell>価格1</TableCell>
              <TableCell>価格2</TableCell>
              <TableCell>価格3</TableCell>
              <TableCell>価格4</TableCell>
              <TableCell>価格5</TableCell>
              <TableCell>メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {arrayList.map((eq) => (
              <TableRow key={eq.id} onClick={() => handleOpen(eq.id)}>
                <TableCell>
                  <CheckBox color="primary" />
                </TableCell>
                <TableCell>
                  <Button variant="text">{eq.name}</Button>
                </TableCell>
                <TableCell>{eq.quantity}</TableCell>
                <TableCell>{eq.bumon}</TableCell>
                <TableCell>{eq.daiBumon}</TableCell>
                <TableCell>{eq.shuukeibumon}</TableCell>
                <TableCell>{eq.isshiki}</TableCell>
                <TableCell>{eq.serialnumber}</TableCell>
                <TableCell>{eq.price1}</TableCell>
                <TableCell>{eq.price2}</TableCell>
                <TableCell>{eq.price3}</TableCell>
                <TableCell>{eq.price4}</TableCell>
                <TableCell>{eq.price5}</TableCell>
                <TableCell sx={{ maxWidth: 30 }}>
                  <Typography noWrap>{eq.memo}</Typography>
                </TableCell>
              </TableRow>
            ))}
            {/* <Dialog open={dialogOpen} fullScreen>
              <eqDialogContents eqId={openId} handleClose={handleClose} />
            </Dialog> */}
            {emptyRows > 0 && (
              <TableRow style={{ height: 30 * emptyRows }}>
                <TableCell colSpan={14} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
