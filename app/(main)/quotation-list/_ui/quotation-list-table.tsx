import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';
import {
  Box,
  Button,
  Checkbox,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useState } from 'react';

import { quotaionList } from '@/app/_lib/mock-data';

type TablePaginationActionsProps = {
  count: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (event: React.MouseEvent<HTMLButtonElement>, newPage: number) => void;
};

export const TablePaginationActions = (props: TablePaginationActionsProps) => {
  const theme = useTheme();
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  return (
    <Box display={'flex'} alignItems={'center'} sx={{ flexShrink: 0 }}>
      <Typography>件</Typography>
      <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0} aria-label="first page">
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
        {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  );
};

/** 見積一覧テーブルのコンポーネント */
export const QuotaionListTable = () => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - quotaionList.length) : 0;

  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };
  // const handleChangePage = (event: unknown, newPage: number) => {
  //   setPage(newPage);
  // };

  return (
    <>
      <TableContainer component={Paper} variant="outlined" square sx={{ maxHeight: 600, bgcolor: grey[200], mt: 3 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TablePagination
                count={quotaionList.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                ActionsComponent={TablePaginationActions}
                rowsPerPageOptions={[20]}
                sx={{ bgcolor: grey[200], justifyContent: 'start' }}
                colSpan={3}
              />
              <TableCell colSpan={3} sx={{ bgcolor: grey[200] }}>
                <Button sx={{ ml: '40%' }} size="medium" href="/quotation-list/quotation">
                  +新規見積
                </Button>
              </TableCell>
              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button color="error">-見積削除</Button>
              </TableCell>

              <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                <Button>見積コピー</Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ bgcolor: grey[300], width: 50, maxWidth: 50, top: 65 }}></TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>見積番号</TableCell>
              <TableCell sx={{ bgcolor: grey[300], top: 65 }}>見積ステータス</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>見積件名</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: '20%', top: 65 }}>見積相手</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>見積日</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>請求番号</TableCell>
              <TableCell sx={{ bgcolor: grey[300], minWidth: 100, top: 65 }}>見積メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? quotaionList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              : quotaionList
            ).map((quotation) => (
              <TableRow key={quotation.id}>
                <TableCell>
                  <Checkbox color="primary" />
                </TableCell>
                <TableCell>
                  <Button variant="text">{quotation.quoteNumber}</Button>
                </TableCell>
                <TableCell>{quotation.status}</TableCell>
                <TableCell>{quotation.name}</TableCell>
                <TableCell>{quotation.customerName}</TableCell>
                <TableCell>{quotation.quotationDate}</TableCell>
                <TableCell>{quotation.invoiceNumber}</TableCell>
                <TableCell>{quotation.quotationmemo}</TableCell>
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
    </>
  );
};
