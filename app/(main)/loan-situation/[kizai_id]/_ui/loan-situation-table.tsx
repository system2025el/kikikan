'use client';

import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { toISOStringWithTimezoneMonthDay } from '@/app/(main)/_ui/date';

import { getDateRowBackgroundColor } from '../_lib/colorselect';
import { Loan, UseData } from './loan-situation';

type LoanSituationTableProps = {
  rows: Loan[];
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
            <TableCell size="small" style={styles.header} />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.juchuHeadId}>
              <TableCell style={styles.row}>
                <Button variant="text" sx={{ p: 0 }}>
                  {row.juchuHeadId}
                </Button>
              </TableCell>
              <TableCell style={styles.row}>{row.koenNam}</TableCell>
              <TableCell style={styles.row}>{row.date && toISOStringWithTimezoneMonthDay(row.date)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type UseTableProps = {
  header: string[];
  rows: UseData[];
  possessions: number;
};

export const UseTable = (props: UseTableProps) => {
  const { header, rows, possessions } = props;

  const columnCount = rows[0]?.juchuHonbanbiShubetuId.length || 0;
  const columnSums = Array(columnCount).fill(0);

  for (const item of rows) {
    item.juchuHonbanbiShubetuId.forEach((value, index) => {
      columnSums[index] += value !== 0 ? 10 : 0;
    });
  }

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {header?.map((date, index) => (
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
                }}
              >
                {date}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.juchuHonbanbiShubetuId.map((cell, colIndex) => (
                <TableCell
                  key={colIndex}
                  align="right"
                  sx={{ bgcolor: getDateRowBackgroundColor(cell), border: '1px solid black', height: 25, py: 0, px: 1 }}
                >
                  {cell !== 0 ? 10 : ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
          <TableRow>
            {columnSums.map((cell, colIndex) => (
              <TableCell key={colIndex} align="right" sx={{ border: '1px solid black', height: 25, py: 0, px: 1 }}>
                {possessions - cell}
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
