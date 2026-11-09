import {
  Button,
  lighten,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
} from '@mui/material';
import { red } from '@mui/material/colors';

import { toJapanMDString } from '../../_lib/date-conversion';
import { openOrFocusTab } from '../../_lib/tab-focus';
import { EqTableValues, StockTableValues } from '../_lib/types';

type EqTableProps = {
  eqList: EqTableValues[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const EqTable = (props: EqTableProps) => {
  const { eqList, ref } = props;

  const theme = useTheme();
  const borderColor = lighten(theme.palette.primary.light, 0.8);

  return (
    <TableContainer ref={ref} component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }} square>
      <Table stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
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
            <TableRow key={row.kizaiId} hover>
              <TableCell
                align="right"
                sx={{
                  borderBottom: '1px solid lightGray',
                  borderRight: '1px solid lightGray',
                  whiteSpace: 'nowrap',
                  height: 25,
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: '4px',
                  paddingRight: '4px',
                  bgcolor: index % 2 === 1 ? borderColor : undefined,
                }}
              >
                {index + 1}
              </TableCell>
              <TableCell align="left" style={styles.row} sx={{ bgcolor: index % 2 === 1 ? borderColor : undefined }}>
                <Button
                  variant="text"
                  onClick={() => openOrFocusTab(`/loan-situation/${row.kizaiId}`)}
                  sx={{ p: 0, m: 0, justifyContent: 'start', height: 20, textTransform: 'none' }}
                >
                  {row.kizaiNam}
                </Button>
              </TableCell>
              <TableCell align="right" style={styles.row} sx={{ bgcolor: index % 2 === 1 ? borderColor : undefined }}>
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
  const theme = useTheme();
  const borderColor = lighten(theme.palette.primary.light, 0.8);

  return (
    <TableContainer ref={ref} component={Paper} style={{ overflowX: 'auto', maxHeight: '80vh' }} square>
      <Table
        stickyHeader
        sx={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          // 本体のセルは 機材数×91日 あるので MUI の TableCell・TableRow を使わず素の tr・td にし、
          // 共通のスタイルはここで1回だけ当てる（元の TableCell の指定に合わせてある。受注機材明細の在庫テーブルと同じ）
          '& tbody td': {
            ...theme.typography.body2,
            color: theme.palette.text.primary,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            height: '25px',
            padding: '0 4px',
            textAlign: 'right',
          },
          '& tbody td:first-of-type': {
            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
          },
          // TableRow の hover と同じ
          '& tbody tr:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          // 1行おきの背景色（2行目・4行目…。左の機材の表と合わせる）
          '& tbody tr:nth-of-type(even) td': {
            backgroundColor: borderColor,
          },
        }}
      >
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList[0].map((cell, index) => (
                <TableCell
                  key={index}
                  align="right"
                  size="small"
                  sx={{
                    borderBottom: '1px solid lightGray',
                    borderRight: '1px solid lightGray',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: 'black',
                    padding: 0.5,
                    height: 25,
                    lineHeight: '1rem',
                  }}
                >
                  {toJapanMDString(cell.calDat)}
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {eqStockList.length > 0 &&
            eqStockList.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} style={Number(cell.zaikoQty) < 0 ? { color: red[500] } : undefined}>
                    {cell.zaikoQty}
                  </td>
                ))}
              </tr>
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
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    whiteSpace: 'nowrap',
    padding: 4,
    height: 25,
    lineHeight: '1rem',
  },
  // 行
  row: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    whiteSpace: 'nowrap',
    height: 25,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
};
