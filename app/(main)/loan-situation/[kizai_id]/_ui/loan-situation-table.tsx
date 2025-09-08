'use client';

import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { toISOStringMonthDay } from '@/app/(main)/_lib/date-conversion';

import { LoanJuchu, LoanStockTableValues, LoanUseTableValues } from '../_lib/types';

type LoanSituationTableProps = {
  rows: LoanJuchu[];
};

export const LoanSituationTable = (props: LoanSituationTableProps) => {
  const { rows } = props;

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell align="center" size="small" style={styles.header}>
              受注番号
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              公演名
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              出庫日
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              入庫日
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.juchuHeadId}>
              <TableCell style={styles.row}>
                <Button variant="text" href={`/order/${row.juchuHeadId}/${'view'}`} sx={{ p: 0 }}>
                  {row.juchuHeadId}
                </Button>
              </TableCell>
              <TableCell style={styles.row}>{row.koenNam}</TableCell>
              <TableCell style={styles.row}>{row.shukoDat ? toISOStringMonthDay(row.shukoDat) : ''}</TableCell>
              <TableCell style={styles.row}>{row.nyukoDat ? toISOStringMonthDay(row.nyukoDat) : ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type UseTableProps = {
  eqUseList: LoanUseTableValues[][];
  eqStockList: LoanStockTableValues[];
};

export const UseTable = (props: UseTableProps) => {
  const { eqUseList, eqStockList } = props;

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, index) => (
                <TableCell
                  key={index}
                  align="right"
                  size="small"
                  sx={{
                    border: '1px solid grey',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: 'black',
                    padding: 0,
                    height: '25px',
                  }}
                >
                  {toISOStringMonthDay(cell.calDat)}
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {eqUseList.length > 0 &&
            eqUseList.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="right"
                    sx={{ bgcolor: cell.juchuHonbanbiColor, border: '1px solid black', height: '25px', py: 0, px: 1 }}
                  >
                    {cell.planQty}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, colIndex) => (
                <TableCell
                  key={colIndex}
                  align="right"
                  sx={{
                    border: '1px solid black',
                    height: 25,
                    py: 0,
                    px: 1,
                    color: cell.zaikoQty < 0 ? 'red' : 'black',
                  }}
                >
                  {cell.zaikoQty}
                </TableCell>
              ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // ヘッダー
  header: {
    border: '1px solid grey',
    whiteSpace: 'nowrap',
    padding: 0,
  },
  // 行
  row: {
    border: '1px solid black',
    whiteSpace: 'nowrap',
    height: 25,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
