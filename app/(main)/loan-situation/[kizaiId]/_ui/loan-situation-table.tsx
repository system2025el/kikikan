'use client';

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
} from '@mui/material';

import { toJapanMDString } from '@/app/(main)/_lib/date-conversion';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { LoanJuchu, LoanStockTableValues, LoanUseTableValues } from '../_lib/types';

type LoanSituationTableProps = {
  rows: LoanJuchu[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const LoanSituationTable = (props: LoanSituationTableProps) => {
  const { rows, ref } = props;

  return (
    <TableContainer
      ref={ref}
      component={Paper}
      style={{ overflowX: 'scroll' }}
      square
      variant="outlined"
      sx={{ maxHeight: '80vh' }}
    >
      <Table stickyHeader padding="none">
        <TableHead>
          <TableRow>
            <TableCell
              align="right"
              sx={{
                height: 15,
                lineHeight: '1rem',
                py: 0,
                px: 1,
                border: '1px solid black',
                color: 'black',
                bgcolor: 'white',
                fontWeight: 400,
                minWidth: 0,
              }}
              colSpan={4}
            >
              在庫数
            </TableCell>
          </TableRow>
          <TableRow sx={{ position: 'sticky', top: 15, zIndex: 2 }}>
            <TableCell align="center" style={styles.header}>
              受注番号
            </TableCell>
            <TableCell align="left" style={styles.header}>
              公演名
            </TableCell>
            <TableCell align="left" style={styles.header}>
              出庫日
            </TableCell>
            <TableCell align="left" style={styles.header}>
              入庫日
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.juchuHeadId}>
              <TableCell style={styles.row}>
                <Button
                  variant="text"
                  href={`/order/${row.juchuHeadId}/${'view'}`}
                  sx={{ p: 0, height: '15px', m: 0, minWidth: 0, width: 1 }}
                >
                  {row.juchuHeadId}
                </Button>
              </TableCell>
              <TableCell
                style={{
                  border: '1px solid black',
                  whiteSpace: 'nowrap',
                  width: 1,
                  height: 25,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 0.1,
                  paddingRight: 0.1,
                  minWidth: 0,
                }}
                sx={{ minWidth: 0 }}
              >
                <LightTooltipWithText variant="body2" maxWidth={150}>
                  {row.koenNam}
                </LightTooltipWithText>
              </TableCell>
              <TableCell style={styles.row}>{row.shukoDat ? toJapanMDString(row.shukoDat) : ''}</TableCell>
              <TableCell style={styles.row}>{row.nyukoDat ? toJapanMDString(row.nyukoDat) : ''}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ position: 'sticky', bottom: 0 }}>
            <TableCell
              align="right"
              size="small"
              sx={{
                border: '1px solid black',
                whiteSpace: 'nowrap',
                color: 'black',
                bgcolor: 'white',
                padding: 0,
                px: 1,
                height: 15,
                lineHeight: '1rem',
                minWidth: 0,
                fontSize: '0.875rem',
              }}
              colSpan={4}
            >
              在庫数
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
};

type UseTableProps = {
  eqUseList: LoanUseTableValues[][];
  eqStockList: LoanStockTableValues[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const UseTable = (props: UseTableProps) => {
  const { eqUseList, eqStockList, ref } = props;

  return (
    <TableContainer
      ref={ref}
      component={Paper}
      style={{ overflowX: 'scroll' }}
      square
      variant="outlined"
      sx={{ maxHeight: '80vh' }}
    >
      <Table stickyHeader padding="none">
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, colIndex) => (
                <TableCell
                  key={colIndex}
                  align="right"
                  sx={{
                    border: '1px solid black',
                    height: 15,
                    lineHeight: '1rem',
                    py: 0,
                    px: 0.5,
                    color: cell.zaikoQty < 0 ? 'red' : 'black',
                    bgcolor: 'white',
                    fontWeight: 400,
                    minWidth: 0,
                  }}
                >
                  {cell.zaikoQty}
                </TableCell>
              ))}
          </TableRow>
          <TableRow sx={{ position: 'sticky', top: 15, zIndex: 2 }}>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    border: '1px solid grey',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: 'black',
                    paddingY: 0,
                    paddingX: 0.1,
                    height: 15,
                    lineHeight: '1rem',
                    minWidth: 0,
                  }}
                >
                  {toJapanMDString(cell.calDat)}
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
                    sx={{
                      bgcolor: cell.juchuHonbanbiColor,
                      border: '1px solid black',
                      height: 25,
                      py: 0,
                      px: 0.5,
                      minWidth: 0,
                    }}
                  >
                    {cell.planQty}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ position: 'sticky', bottom: 0 }}>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, colIndex) => (
                <TableCell
                  key={colIndex}
                  align="right"
                  sx={{
                    border: '1px solid black',
                    height: 15,
                    lineHeight: '1rem',
                    fontSize: '0.875rem',
                    py: 0,
                    px: 0.5,
                    color: cell.zaikoQty < 0 ? 'red' : 'black',
                    bgcolor: 'white',
                    minWidth: 0,
                  }}
                >
                  {cell.zaikoQty}
                </TableCell>
              ))}
          </TableRow>
        </TableFooter>
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
    border: '1px solid black',
    height: 15,
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0.1,
    paddingRight: 0.1,
    width: 1,
    minWidth: 0,
  },
  // 行
  row: {
    border: '1px solid black',
    whiteSpace: 'nowrap',
    width: 1,
    height: 15,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 0.1,
    paddingRight: 0.1,
    minWidth: 0,
  },
};
