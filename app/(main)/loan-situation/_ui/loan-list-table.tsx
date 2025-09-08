'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Box,
  Button,
  Divider,
  Grid2,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '../../_ui/loading';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { EqptsMasterTableValues } from '../../(masters)/eqpt-master/_lib/types';

export const LoanListTable = (props: {
  datas: EqptsMasterTableValues[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
  //moveRow: (index: number, direction: number) => void;
}) => {
  const { datas, page, isLoading, setPage /*moveRow*/ } = props;

  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? datas.slice((page - 1) * rowsPerPage, page * rowsPerPage) : datas),
    [page, datas]
  );

  return (
    <Paper variant="outlined" sx={{ pt: 2, mt: 2 }}>
      <Box pl={2}>
        <MuiTablePagination arrayList={datas} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
      </Box>
      {isLoading ? (
        <Loading />
      ) : !datas || datas!.length === 0 ? (
        <Typography ml={2}>該当するデータがありません</Typography>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: '80vh', mt: 1 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ whiteSpace: 'nowrap' }}>
                <TableCell padding="checkbox" style={styles.style}></TableCell>
                <TableCell align="left" style={styles.style}>
                  機材名
                </TableCell>
                <TableCell align="left" style={styles.style}>
                  所属
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  保有数
                </TableCell>
                <TableCell align="left" style={styles.style}>
                  部門
                </TableCell>
                <TableCell align="left" style={styles.style}>
                  大部門
                </TableCell>
                <TableCell align="left" style={styles.style}>
                  集計部門
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  定価
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  価格1
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  価格2
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  価格3
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  価格4
                </TableCell>
                <TableCell align="right" style={styles.style}>
                  価格5
                </TableCell>
                <TableCell align="left" style={styles.style}>
                  メモ
                </TableCell>
                {/* <TableCell /> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((loan, index) => (
                <TableRow key={loan.kizaiId} sx={{ whiteSpace: 'nowrap' }}>
                  <TableCell align="center" padding="none">
                    {index + 1}
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    <Button
                      variant="text"
                      onClick={() => window.open(`/loan-situation/${loan.kizaiId}`)}
                      sx={{ justifyContent: 'start', p: 0 }}
                    >
                      {loan.kizaiNam}
                    </Button>
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    {loan.shozokuNam === 'KICS' ? 'K' : loan.shozokuNam === 'YARD' ? 'Y' : 'その他'}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.kizaiQty}
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    {loan.bumonNam}
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    {loan.daibumonNam}
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    {loan.shukeibumonNam}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.regAmt}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.rankAmt1}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.rankAmt2}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.rankAmt3}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.rankAmt4}
                  </TableCell>
                  <TableCell align="right" style={styles.style}>
                    {loan.rankAmt5}
                  </TableCell>
                  <TableCell align="left" style={styles.style}>
                    {loan.mem}
                  </TableCell>
                  {/* <TableCell>
                  <Box display={'flex'}>
                    <IconButton onClick={() => moveRow(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => moveRow(index, 1)} disabled={index === datas.length - 1}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  style: {
    paddingTop: 0,
    paddingBottom: 0,
  },
};
