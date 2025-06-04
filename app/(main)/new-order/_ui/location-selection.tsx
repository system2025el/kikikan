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
import { useState } from 'react';

import { locationList } from '@/app/_lib/mock-data';

import { MuiTablePagination } from '../../_ui/table-pagination';

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
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - locationList.length) : 0;

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
              <Typography>キーワード</Typography>
              <TextField />
              <Typography paddingLeft={'8%'}>場所、住所、TEL、Faxから検索</Typography>
            </Stack>
            <Stack sx={{ pt: 1 }}>
              <Typography>地域</Typography>
              <Box display={'flex'} alignItems={'center'}>
                <TextField />
                <Button onClick={handleOpenDialog}>選択</Button>
              </Box>
            </Stack>
          </Box>
        </Paper>
        {/*  ---------- ↑検索 ↓場所テーブル-------------- */}
        <Stack mt={1} mx={0.5} justifyContent={'space-between'}>
          <MuiTablePagination arrayList={locationList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Stack>
        <TableContainer component={Paper} square sx={{ maxHeight: 800, mt: 1 }}>
          <Table stickyHeader padding="none">
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: 'primary.light' }}>場所</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>住所</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>TEL</TableCell>
                <TableCell sx={{ bgcolor: 'primary.light' }}>FAX</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? locationList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : locationList
              ).map((location) => (
                <TableRow key={location.name}>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{location.address}</TableCell>
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
