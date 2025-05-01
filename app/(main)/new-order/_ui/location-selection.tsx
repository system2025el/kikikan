'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Dialog,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import TablePaginationActions from '@mui/material/TablePagination/TablePaginationActions';
import { useState } from 'react';

import { locationList } from '@/app/_lib/mock-data';

import { AreaSelectionDialog } from './area-selection-dialog';

export const LocationSelectDialog = (props: { handleCloseLocationDialog: VoidFunction }) => {
  const [DialogOpen, setDialogOpen] = useState(false);
  const handleOpenDialog = () => {
    setDialogOpen(true);
  };
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - locationList.length) : 0;

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
        <Box width={'100%'} bgcolor={grey[300]} py={2} alignItems={'center'} p={2} display={'flex'}>
          <Typography>公演場所選択</Typography>
          <Button sx={{ ml: '40%' }} onClick={() => props.handleCloseLocationDialog()}>
            戻る
          </Button>
        </Box>
        <Box width={'100%'} bgcolor={grey[200]} p={2}>
          <Stack justifyContent={'space-between'}>
            <Typography variant="body1">検索</Typography>
            <Button>
              検索
              <SearchIcon />
            </Button>
          </Stack>
          <Stack>
            <Typography>キーワード</Typography>
            <TextField />
            <Typography paddingLeft={'8%'}>場所、略称、住所、TEL、Faxから検索</Typography>
          </Stack>
          <Stack sx={{ pt: 1 }}>
            <Typography>地域</Typography>
            <Box display={'flex'} alignItems={'center'}>
              <TextField />
              <Button onClick={handleOpenDialog}>選択</Button>
              <Dialog open={DialogOpen} fullScreen>
                <AreaSelectionDialog handleClose={handleCloseDialog} />
              </Dialog>
            </Box>
          </Stack>
        </Box>

        <TableContainer component={Paper} square sx={{ p: 2, maxHeight: 800, bgcolor: grey[200] }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TablePagination
                  colSpan={8}
                  count={locationList.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  ActionsComponent={TablePaginationActions}
                  rowsPerPageOptions={[20]}
                  sx={{ bgcolor: grey[200] }}
                />
              </TableRow>
              <TableRow>
                <TableCell sx={{ bgcolor: grey[300] }}>場所</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>略称</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>住所</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>TEL</TableCell>
                <TableCell sx={{ bgcolor: grey[300] }}>FAX</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? locationList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : locationList
              ).map((location) => (
                <TableRow key={location.name}>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{location.shortName}</TableCell>
                  <TableCell>{location.address}</TableCell>
                  <TableCell>{location.tel}</TableCell>
                  <TableCell>{location.fax}</TableCell>
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
