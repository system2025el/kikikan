'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  Container,
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
import Form from 'next/form';
import { useState } from 'react';

import { customers } from '@/app/_lib/mock-data';

import { MuiTablePagination } from '../../_ui/table-pagination';

/** 新規受注の相手選択ダイアログ（全画面） */
export const CustomerSelectionDialog = (props: { handleCloseCustDialog: () => void }) => {
  const { handleCloseCustDialog } = props;
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - customers.length) : 0;

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Box width={'100%'} bgcolor={grey[300]} py={2} alignItems={'center'} p={2} display={'flex'}>
          <Typography>相手選択</Typography>
          <Button sx={{ ml: '40%' }} onClick={() => handleCloseCustDialog()}>
            戻る
          </Button>
        </Box>
        <Box width={'100%'} bgcolor={grey[200]} p={2}>
          <Stack justifyContent={'space-between'}>
            <Typography variant="body1">検索</Typography>
          </Stack>
          <Form action="">
            <Stack direction={'row'} justifyContent={'space-between'} spacing={1}>
              <Button>あ</Button>
              <Button>か</Button>
              <Button>さ</Button>
              <Button>た</Button>
              <Button>な</Button>
              <Button>は</Button>
              <Button>ま</Button>
              <Button>や</Button>
              <Button>ら</Button>
              <Button>わ</Button>
              <Button>英数</Button>
              <Button>全て</Button>
              <TextField fullWidth placeholder="検索"></TextField>
            </Stack>
            <Divider />
            <Stack justifyContent={'space-between'} width={'70%'}>
              <Stack display={'flex'}>
                <Typography>キーワード</Typography>
                <Box>
                  <TextField />
                </Box>
              </Stack>
              <Box>
                <Button type="submit">
                  検索
                  <SearchIcon />
                </Button>
              </Box>
            </Stack>
          </Form>
          <Typography></Typography>
        </Box>

        <TableContainer component={Card} square sx={{ p: 2, maxHeight: 800, bgcolor: grey[200] }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <MuiTablePagination
                  arrayList={customers}
                  colSpan={8}
                  rowsPerPage={rowsPerPage}
                  sx={{ bgcolor: grey[200] }}
                  page={page}
                  setPage={setPage}
                />
              </TableRow>
              <TableRow>
                <TableCell sx={{ bgcolor: grey[300] }}>場所</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>住所</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>TEL</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>FAX</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>メモ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? customers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : customers
              ).map((customer) => (
                <TableRow key={customer.name}>
                  <TableCell>{customer.name}</TableCell>
                  <TableCell>
                    {customer.addressA} {customer.addressB}
                  </TableCell>
                  <TableCell>{customer.tel}</TableCell>
                  <TableCell>{customer.fax}</TableCell>
                  <TableCell sx={{ maxWidth: 20 }}>
                    <Typography noWrap>{customer.memo}</Typography>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
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
