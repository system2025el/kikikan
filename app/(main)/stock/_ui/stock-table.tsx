import { Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { toISOStringMonthDay } from '../../_lib/date-conversion';
import { EqTableValues, StockTableValues } from '../_lib/types';

type EqTableProps = {
  eqList: EqTableValues[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const EqTable = (props: EqTableProps) => {
  const { eqList, ref } = props;

  return (
    <TableContainer ref={ref} component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              有効数
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {eqList.map((row, index) => (
            <TableRow key={row.kizaiId}>
              <TableCell
                align="right"
                sx={{
                  border: '1px solid black',
                  whiteSpace: 'nowrap',
                  height: 25,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 1,
                  paddingRight: 1,
                }}
              >
                {index + 1}
              </TableCell>
              <TableCell align="left" style={styles.row}>
                <Button
                  variant="text"
                  onClick={() => window.open(`/loan-situation/${row.kizaiId}`)}
                  sx={{ p: 0, justifyContent: 'start' }}
                >
                  {row.kizaiNam}
                </Button>
              </TableCell>
              <TableCell align="right" style={styles.row}>
                {row.kizaiQty}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type EqStockTableProps = {
  eqStockList: StockTableValues[][];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const EqStockTable = (props: EqStockTableProps) => {
  const { eqStockList, ref } = props;

  return (
    <TableContainer ref={ref} component={Paper} style={{ overflowX: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList[0].map((cell, index) => (
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
          {eqStockList.length > 0 &&
            eqStockList.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <TableCell
                    key={colIndex}
                    align="right"
                    sx={{ border: '1px solid black', height: '25px', py: 0, px: 1 }}
                  >
                    {cell.zaikoQty}
                  </TableCell>
                ))}
              </TableRow>
            ))}
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
