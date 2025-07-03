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
import { useMemo, useState } from 'react';

import { MuiTablePagination } from '../../_ui/table-pagination';
import { Loan } from './loan-list';

export const LoanListTable = (props: { datas: Loan[]; moveRow: (index: number, direction: number) => void }) => {
  const { datas, moveRow } = props;

  const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(
    () => (rowsPerPage > 0 ? datas.slice((page - 1) * rowsPerPage, page * rowsPerPage) : datas),
    [page, datas]
  );

  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - datas.length) : 0;

  return (
    <Paper variant="outlined" sx={{ pt: 2, mt: 2 }}>
      <Box pl={2}>
        <MuiTablePagination arrayList={datas} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: '80vh', mt: 1 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell align="left">機材名</TableCell>
              <TableCell align="left">所属</TableCell>
              <TableCell align="right">保有数</TableCell>
              <TableCell align="left">部門</TableCell>
              <TableCell align="left">大部門</TableCell>
              <TableCell align="left">集計部門</TableCell>
              <TableCell align="right">定価</TableCell>
              <TableCell align="right">価格1</TableCell>
              <TableCell align="right">価格2</TableCell>
              <TableCell align="right">価格3</TableCell>
              <TableCell align="right">価格4</TableCell>
              <TableCell align="right">価格5</TableCell>
              <TableCell align="left">メモ</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((loan, index) => (
              <TableRow key={loan.kizaiId}>
                <TableCell align="center" padding="none">
                  {index + 1}
                </TableCell>
                <TableCell align="left">
                  <Button
                    variant="text"
                    href={`/loan-situation/'${loan.kizaiId}`}
                    sx={{ justifyContent: 'start', p: 0 }}
                  >
                    {loan.kizaiNam}
                  </Button>
                </TableCell>
                <TableCell align="left">{loan.shozokuId === 1 ? 'K' : loan.shozokuId === 2 ? 'Y' : 'その他'}</TableCell>
                <TableCell align="right">{loan.stock}</TableCell>
                <TableCell align="left">{loan.bumonId === 1 ? 'XXX' : 'XXXXX'}</TableCell>
                <TableCell align="left">{loan.daibumonId === 1 ? 'XXX' : 'XXXXX'}</TableCell>
                <TableCell align="left">{loan.shukeiBumonId === 1 ? 'XXX' : 'XXXXX'}</TableCell>
                <TableCell align="right">{loan.regAmt}</TableCell>
                <TableCell align="right">{loan.rankAmt1}</TableCell>
                <TableCell align="right">{loan.rankAmt2}</TableCell>
                <TableCell align="right">{loan.rankAmt3}</TableCell>
                <TableCell align="right">{loan.rankAmt4}</TableCell>
                <TableCell align="right">{loan.rankAmt5}</TableCell>
                <TableCell align="left">{loan.mem}</TableCell>
                <TableCell>
                  <Box display={'flex'}>
                    <IconButton onClick={() => moveRow(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => moveRow(index, 1)} disabled={index === datas.length - 1}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
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
    </Paper>
  );
};
