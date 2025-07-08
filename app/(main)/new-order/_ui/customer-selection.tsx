'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  Grid2,
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
import { useMemo, useState } from 'react';

import { MuiTablePagination } from '../../_ui/table-pagination';
import { customers } from '../../(masters)/customers-master/_lib/datas';

/** 新規受注の相手選択ダイアログ（全画面） */
export const CustomerSelectionDialog = (props: { handleCloseCustDialog: () => void }) => {
  const { handleCloseCustDialog } = props;
  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? customers.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : customers),
    [page, rowsPerPage]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - customers.length) : 0;

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>相手選択</Typography>
            <Button onClick={() => handleCloseCustDialog()}>戻る</Button>
          </Box>
          <Divider />
          <Box width={'100%'} p={2}>
            <Stack>
              <Typography variant="body2">検索</Typography>
            </Stack>
            <form>
              <Grid2 container direction={'row'} spacing={3}>
                <Grid2>
                  <Button>あ</Button>
                </Grid2>
                <Grid2>
                  <Button>か</Button>
                </Grid2>
                <Grid2>
                  <Button>さ</Button>
                </Grid2>
                <Grid2>
                  <Button>た</Button>
                </Grid2>
                <Grid2>
                  <Button>な</Button>
                </Grid2>
                <Grid2>
                  <Button>は</Button>
                </Grid2>
                <Grid2>
                  <Button>ま</Button>
                </Grid2>
                <Grid2>
                  <Button>や</Button>
                </Grid2>
                <Grid2>
                  <Button>ら</Button>
                </Grid2>
                <Grid2>
                  <Button>わ</Button>
                </Grid2>
                <Grid2>
                  <Button>英数</Button>
                </Grid2>
                <Grid2>
                  <Button>全て</Button>
                </Grid2>
              </Grid2>

              <Divider sx={{ mt: 1 }} />
              <Stack justifyContent={'space-between'} mt={1}>
                <Stack display={'flex'}>
                  <Typography>キーワード</Typography>
                  <Box>
                    <TextField />
                  </Box>
                </Stack>
                <Box>
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Box>
              </Stack>
            </form>
            <Typography></Typography>
          </Box>
        </Paper>
        {/* ↑検索 ↓テーブル */}
        <Stack mt={1} mx={0.5} justifyContent={'space-between'}>
          <MuiTablePagination arrayList={customers} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Stack>
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
          <Table stickyHeader padding="none">
            <TableHead>
              <TableRow>
                <TableCell>場所</TableCell>
                <TableCell>住所</TableCell>
                <TableCell>TEL</TableCell>
                <TableCell>FAX</TableCell>
                <TableCell>メモ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((customer) => (
                <TableRow key={customer.kokyakuId}>
                  <TableCell>{customer.kokyakuNam}</TableCell>
                  <TableCell>
                    {customer.adrShozai} {customer.adrTatemono}
                  </TableCell>
                  <TableCell>{customer.tel}</TableCell>
                  <TableCell>{customer.fax}</TableCell>
                  <TableCell sx={{ maxWidth: 20 }}>
                    <Typography noWrap>{customer.mem}</Typography>
                  </TableCell>
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
