'use client';

import {
  Box,
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

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanMDString } from '@/app/(main)/_lib/date-conversion';
import { permission } from '@/app/(main)/_lib/permission';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { LoanJuchu, LoanStockTableValues, LoanUseTableValues } from '../_lib/types';

type LoanSituationTableProps = {
  rows: LoanJuchu[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const LoanSituationTable = (props: LoanSituationTableProps) => {
  const { rows, ref } = props;

  // user情報
  const user = useUserStore((state) => state.user);

  return (
    <TableContainer
      ref={ref}
      component={Paper}
      style={{ overflowX: 'scroll' }}
      square
      variant="outlined"
      sx={{ maxHeight: '80vh' }}
    >
      <Table stickyHeader padding="none" sx={{ borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow>
            <TableCell
              align="right"
              sx={{
                height: 25,
                lineHeight: '1rem',
                padding: '4px',
                color: 'black',
                bgcolor: 'white',
                fontWeight: 400,
                minWidth: 0,
              }}
              colSpan={5}
            >
              在庫数
            </TableCell>
          </TableRow>
          <TableRow sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
            <TableCell align="center" style={styles.header}>
              受注番号
            </TableCell>
            <TableCell align="left" style={styles.header}>
              公演名
            </TableCell>
            <TableCell align="left" style={styles.header}>
              受注明細名
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
          {rows.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell style={styles.row}>
                <Button
                  variant="text"
                  sx={{ p: 0, height: '15px', m: 0, minWidth: 0, width: 1 }}
                  onClick={() => window.open(`/order/${row.juchuHeadId}/view`)}
                  disabled={user?.permission.juchu === permission.none}
                >
                  {row.juchuHeadId}
                </Button>
              </TableCell>
              <TableCell
                style={{
                  whiteSpace: 'nowrap',
                  width: 1,
                  height: 25,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: 4,
                  paddingRight: 4,
                  minWidth: 0,
                }}
                sx={{ minWidth: 0 }}
              >
                <LightTooltipWithText variant="body2" maxWidth={130}>
                  {row.koenNam}
                </LightTooltipWithText>
              </TableCell>
              <TableCell style={styles.row}>
                <Button
                  variant="text"
                  sx={{
                    px: 0.1,
                    height: '15px',
                    m: 0,
                    minWidth: 0,
                    width: 1,
                    color: row.juchuKizaiHeadKbn === 2 ? 'red' : 'primary',
                    justifyContent: 'start',
                  }}
                  onClick={() => {
                    const path =
                      row.juchuKizaiHeadKbn === 1
                        ? `/eq-main-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/view`
                        : `/eq-return-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${row.oyaJuchuKizaiHeadId}/view`;
                    window.open(path);
                  }}
                  disabled={user?.permission.juchu === permission.none}
                >
                  <LightTooltipWithText variant="body2" maxWidth={130}>
                    {row.juchuKizaiHeadKbn !== 1 && <Box component="span" sx={{ ml: 1.5 }} />}
                    {row.headNam}
                  </LightTooltipWithText>
                </Button>
              </TableCell>
              <TableCell style={styles.row} sx={{ textAlign: 'center' }}>
                {row.shukoDat ? toJapanMDString(row.shukoDat) : ''}
              </TableCell>
              <TableCell style={styles.row} sx={{ textAlign: 'center' }}>
                {row.nyukoDat ? toJapanMDString(row.nyukoDat) : ''}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow sx={{ position: 'sticky', bottom: -1 }}>
            <TableCell
              align="right"
              size="small"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                whiteSpace: 'nowrap',
                color: 'black',
                bgcolor: 'white',
                padding: '4px',
                height: 25,
                lineHeight: '1rem',
                minWidth: 0,
                fontSize: '0.875rem',
              }}
              colSpan={5}
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
      <Table stickyHeader padding="none" sx={{ borderCollapse: 'collapse' }}>
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, colIndex) => (
                <TableCell
                  key={colIndex}
                  align="right"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    height: 25,
                    lineHeight: '1rem',
                    padding: '4px',
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
          <TableRow sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, index) => (
                <TableCell
                  key={index}
                  align="center"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: 'black',
                    padding: '4px',
                    height: 25,
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
                      border: '1px solid',
                      borderColor: 'divider',
                      color:
                        cell.planQty <= 0 ||
                        (row[colIndex - 1]?.planQty && row[colIndex].planQty !== row[colIndex - 1].planQty)
                          ? 'red'
                          : 'black',
                      height: 25,
                      py: 0,
                      px: '4px',
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
          <TableRow sx={{ position: 'sticky', bottom: -1 }}>
            {eqStockList.length > 0 &&
              eqStockList.map((cell, colIndex) => (
                <TableCell
                  key={colIndex}
                  align="right"
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    height: 25,
                    lineHeight: '1rem',
                    fontSize: '0.875rem',
                    padding: '4px',
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
    border: '1px solid lightGray',
    height: 25,
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
    padding: 4,
    width: 1,
    minWidth: 0,
  },
  // 行
  row: {
    border: '1px solid lightGray',
    whiteSpace: 'nowrap',
    width: 1,
    height: 25,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
    minWidth: 0,
  },
};
