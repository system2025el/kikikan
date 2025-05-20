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
  const handleChangePage = useCallback(
    (event: unknown, newPage: number) => {
      props.setPage(newPage - 1);
    },
    [props]
  );

  const handleChangeTablePage = useCallback(
    (event: unknown, newPage: number) => {
      props.setPage(newPage);
    },
    [props]
  );

  return (
    <TablePagination
      count={props.arrayList.length}
      rowsPerPage={props.rowsPerPage}
      page={props.page}
      onPageChange={handleChangeTablePage}
      ActionsComponent={() => (
        <Pagination
          count={Math.ceil(props.arrayList.length / props.rowsPerPage)}
          page={props.page + 1}
          onChange={handleChangePage}
          color="primary"
          size="small"
          variant="outlined"
          shape="rounded"
        />
      )}
      rowsPerPageOptions={[props.rowsPerPage]}
      labelDisplayedRows={({ count, from, to }) => {
        return `${from}-${to}件 全${count}件`;
      }}
      sx={{
        ...props.sx,
        '& .MuiTablePagination-spacer': {
          display: 'none',
        },
      }}
      colSpan={props.colSpan}
      size="small"
    />
  );
};
