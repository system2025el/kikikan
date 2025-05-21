'use client';
import { Pagination, TablePagination } from '@mui/material';
import { useCallback } from 'react';

/** テーブルページネイションコンポーネント */
type MuiTablePaginationProps = {
  arrayList: object[];
  colSpan: number;
  rowsPerPage: number;
  sx: object;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export const MuiTablePagination = (props: MuiTablePaginationProps) => {
  const { setPage, arrayList, rowsPerPage, sx, page, colSpan } = props;
  const handleChangePage = useCallback(
    (event: unknown, newPage: number) => {
      setPage(newPage - 1);
    },
    [setPage]
  );

  const handleChangeTablePage = useCallback(
    (event: unknown, newPage: number) => {
      setPage(newPage);
    },
    [setPage]
  );

  return (
    <TablePagination
      count={arrayList.length}
      rowsPerPage={rowsPerPage}
      page={page}
      onPageChange={handleChangeTablePage}
      ActionsComponent={() => (
        <Pagination
          count={Math.ceil(arrayList.length / rowsPerPage)}
          page={page + 1}
          onChange={handleChangePage}
          color="primary"
          size="small"
          variant="outlined"
          shape="rounded"
        />
      )}
      rowsPerPageOptions={[rowsPerPage]}
      labelDisplayedRows={({ count, from, to }) => {
        return `${from}-${to}件 全${count}件`;
      }}
      sx={{
        ...sx,
        '& .MuiTablePagination-spacer': {
          display: 'none',
        },
      }}
      colSpan={colSpan}
      size="small"
    />
  );
};
