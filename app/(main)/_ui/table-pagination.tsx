'use client';
import { Box, Grid2, Pagination as MuiPagination, Stack, styled, Typography } from '@mui/material';
import { JSX, useCallback } from 'react';

/** テーブルページネイション */
type MuiTablePaginationProps = {
  /** 表示したいデータ */
  arrayList: object[];
  /** 1ページごとのデータ数 */
  rowsPerPage: number;
  /** スタイル */
  sx?: object;
  /** 表示するページ */
  page: number;
  /** useState 表示するページ変更*/
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

const Pagination = styled(MuiPagination)({});

/**
 * MuiTablePaginationコンポーネント
 * @param {MuiTablePaginationProps}
 * @returns {JSX.Element}
 */
export const MuiTablePagination = (props: MuiTablePaginationProps) => {
  const { setPage, arrayList, rowsPerPage, page, sx } = props;

  // ページごとのデータ数を取得
  const pageCount = Math.ceil(arrayList.length / rowsPerPage);
  // ページ変更
  const handleChangePage = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      setPage(value);
    },
    [setPage]
  );
  //件数表示
  const from = arrayList.length === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const to = Math.min(page * rowsPerPage, arrayList.length);

  return (
    <Stack spacing={0.5}>
      {/*<Grid2 container display={'flex'} alignItems={'center'} spacing={{ sm: 0, md: 0.5 }}>
        <Grid2 size={{ sm: 12, md: 4 }}> */}
      <Typography variant="body2" noWrap textAlign={'end'}>
        {from}〜{to}件/全{arrayList.length}件
      </Typography>
      {/*</Grid2>
        <Grid2 size={{ sm: 12, md: 8 }}>*/}
      <Pagination
        count={pageCount}
        page={page}
        onChange={handleChangePage}
        color="primary"
        showFirstButton
        showLastButton
        sx={{ ...sx }}
      />
      {/*</Grid2>
      </Grid2>*/}
    </Stack>
  );
};
