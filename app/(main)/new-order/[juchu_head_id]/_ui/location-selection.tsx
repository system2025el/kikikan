'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useMemo, useState } from 'react';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { locationList } from '../../../(masters)/locations-master/_lib/datas';

/** 新規受注の場所選択ダイアログ */
export const LocationSelectDialog = (props: { handleCloseLocationDialog: () => void }) => {
  const { handleCloseLocationDialog } = props;
  const [DialogOpen, setDialogOpen] = useState(false);
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () =>
      rowsPerPage > 0 ? locationList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : locationList,
    [page, rowsPerPage]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - locationList.length) : 0;

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>公演場所選択</Typography>
            <Button onClick={() => handleCloseLocationDialog()}>戻る</Button>
          </Box>
          <Divider />
          <Box width={'100%'} p={2}>
            <Stack justifyContent={'space-between'}>
              <Typography variant="body2">検索</Typography>
              <Button>
                <SearchIcon />
                検索
              </Button>
            </Stack>
            <Stack>
              <Typography width={100}>キーワード</Typography>
              <TextField />
              <Typography paddingLeft={'8%'}>場所、住所、TEL、Faxから検索</Typography>
            </Stack>
            <Stack sx={{ pt: 1 }}>
              <Typography width={100}>地域</Typography>
              <Box display={'flex'} alignItems={'center'}>
                <TextField />
                <Button onClick={handleOpenDialog} sx={{ ml: 1 }}>
                  選択
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
        {/*  ---------- ↑検索 ↓場所テーブル-------------- */}
        <Stack mt={1} mx={0.5} justifyContent={'space-between'}>
          <MuiTablePagination arrayList={locationList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Stack>
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
          <Table stickyHeader padding="none">
            <TableHead>
              <TableRow>
                <TableCell>場所</TableCell>
                <TableCell>住所</TableCell>
                <TableCell>TEL</TableCell>
                <TableCell>FAX</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((location) => (
                <TableRow key={location.locId}>
                  <TableCell>{location.locNam}</TableCell>
                  <TableCell>
                    {location.adrShozai} {location.adrTatemono} {location.adrSonota}
                  </TableCell>
                  <TableCell>{location.tel}</TableCell>
                  <TableCell>{location.fax}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 30 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};
