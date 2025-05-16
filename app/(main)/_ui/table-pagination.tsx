'use client';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import { Box, IconButton, LabelDisplayedRowsArgs, TablePagination, Typography, useTheme } from '@mui/material';

/** テーブルページネイションコンポーネント */
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

type MuiTablePaginationProps = {
  arrayList: object[];
  colSpan: number;
  rowsPerPage: number;
  sx: object;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export const MuiTablePagination = (props: MuiTablePaginationProps) => {
  const handleChangePage = (event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    props.setPage(newPage);
  };
  return (
    <TablePagination
      count={props.arrayList.length}
      rowsPerPage={props.rowsPerPage}
      page={props.page}
      onPageChange={handleChangePage}
      ActionsComponent={TablePaginationActions}
      rowsPerPageOptions={[props.rowsPerPage]}
      labelDisplayedRows={({ count, from, page, to }) => `${page + 1}ページ目 ${from}-${to}件 全${count}件`}
      sx={props.sx}
      colSpan={props.colSpan}
    />
  );
};
