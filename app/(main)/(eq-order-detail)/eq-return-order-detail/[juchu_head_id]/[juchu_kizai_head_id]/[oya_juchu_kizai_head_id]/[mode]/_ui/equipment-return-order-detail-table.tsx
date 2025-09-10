'use client';

import Delete from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { Dayjs } from 'dayjs';
import React, { useRef, useState } from 'react';

import { toISOStringMonthDay, toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { MemoTooltip } from '@/app/(main)/(eq-order-detail)/_ui/memo-tooltip';
import { getStockRowBackgroundColor } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/colorselect';
import {
  JuchuKizaiHonbanbiValues,
  StockTableValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchu_head_id]/[juchu_kizai_head_id]/[mode]/_lib/types';

import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { ReturnJuchuKizaiMeisaiValues } from '../_lib/types';

type ReturnStockTableProps = {
  eqStockList: StockTableValues[][];
  dateRange: string[];
  stockTableHeaderDateRange: string[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const ReturnStockTable: React.FC<ReturnStockTableProps> = ({
  eqStockList,
  dateRange,
  stockTableHeaderDateRange,
  ref,
}) => {
  return (
    <TableContainer ref={ref} component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table>
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList[0].map((data, index) => (
                <TableCell
                  key={index}
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    whiteSpace: 'nowrap',
                    padding: 0,
                    height: '25px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}
                ></TableCell>
              ))}
          </TableRow>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList[0].map((data, index) => (
                <TableCell
                  key={index}
                  align={'right'}
                  size="small"
                  sx={{
                    border:
                      getDateHeaderBackgroundColor(toISOStringYearMonthDay(data.calDat), stockTableHeaderDateRange) ===
                      'black'
                        ? '1px solid grey'
                        : '1px solid black',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: getDateHeaderBackgroundColor(
                      toISOStringYearMonthDay(data.calDat),
                      stockTableHeaderDateRange
                    ),
                    padding: 0,
                    height: '26px',
                    position: 'sticky',
                    top: 24,
                    zIndex: 2,
                  }}
                >
                  {toISOStringMonthDay(data.calDat)}
                </TableCell>
              ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {eqStockList.length > 0 &&
            eqStockList.map((row, rowIndex) => (
              <ReturnStockTableRow key={rowIndex} row={row} index={rowIndex} dateRange={dateRange} />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export type ReturnStockTableRowProps = {
  row: StockTableValues[];
  index: number;
  dateRange: string[];
};

const ReturnStockTableRow = React.memo(
  ({ row, index, dateRange }: ReturnStockTableRowProps) => {
    console.log('stock側描画', index);
    const test: JuchuKizaiHonbanbiValues[] = [];
    return (
      <TableRow>
        {row.map((cell, colIndex) => {
          return (
            <TableCell
              key={colIndex}
              align={typeof cell === 'number' ? 'right' : 'left'}
              style={styles.row}
              sx={{
                //bgcolor: getStockRowBackgroundColor(cell.calDat, dateRange, test),
                color: cell.zaikoQty < 0 ? 'red' : 'black',
              }}
              size="small"
            >
              {cell.zaikoQty}
            </TableCell>
          );
        })}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row;
  }
);

ReturnStockTableRow.displayName = 'ReturnStockTableRow';

type ReturnEqTableProps = {
  rows: ReturnJuchuKizaiMeisaiValues[];
  edit: boolean;
  onChange: (kizaiId: number, returnOrderValue: number, returnSpareValue: number, returnTotalValue: number) => void;
  handleDelete: (kizaiId: number) => void;
  handleMemoChange: (kizaiId: number, memo: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
};

export const ReturnEqTable: React.FC<ReturnEqTableProps> = ({
  rows,
  edit,
  onChange,
  handleDelete,
  handleMemoChange,
  ref,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const visibleRows = rows.filter((row) => !row.delFlag);

  const handlePlanKizaiQtyChange = (kizaiId: number, newValue: number) => {
    const planYobiQty = rows.find((row) => row.kizaiId === kizaiId && !row.delFlag)?.planYobiQty || 0;
    const planQty = planYobiQty + newValue;
    onChange(kizaiId, newValue, planYobiQty, planQty);
  };

  const handlePlanYobiQtyChange = (kizaiId: number, newValue: number) => {
    const planKizaiQty = rows.find((row) => row.kizaiId === kizaiId)?.planKizaiQty || 0;
    const planQty = planKizaiQty + newValue;
    onChange(kizaiId, planKizaiQty, newValue, planQty);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRefs.current[rowIndex + 1]?.focus();
    }
  };

  const handleReturnRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[rowIndex] = el;
  };

  return (
    <TableContainer ref={ref} component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }}></TableCell>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }}></TableCell>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }}></TableCell>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }}></TableCell>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }}></TableCell>
            <TableCell
              align="center"
              size="small"
              style={styles.header}
              sx={{ position: 'sticky', top: 0, zIndex: 2 }}
              colSpan={2}
            >
              親伝票
            </TableCell>
            <TableCell
              align="center"
              size="small"
              style={styles.header}
              sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'red' }}
              colSpan={3}
            >
              返却数(マイナス入力)
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              在庫場所
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              返却メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              受注数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              予備数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              受注数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              予備数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              合計数
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <ReturnEqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              handleOrderRef={handleReturnRef(rowIndex)}
              handleDelete={handleDelete}
              handleMemoChange={handleMemoChange}
              handleKeyDown={handleKeyDown}
              handlePlanKizaiQtyChange={handlePlanKizaiQtyChange}
              handlePlanYobiQtyChange={handlePlanYobiQtyChange}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type ReturnEqTableRowProps = {
  row: ReturnJuchuKizaiMeisaiValues;
  rowIndex: number;
  edit: boolean;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleDelete: (kizaiId: number) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handlePlanKizaiQtyChange: (kizaiId: number, newValue: number) => void;
  handlePlanYobiQtyChange: (kizaiId: number, newValue: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const ReturnEqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    handleOrderRef,
    handleDelete,
    handleMemoChange,
    handlePlanKizaiQtyChange,
    handlePlanYobiQtyChange,
    handleKeyDown,
  }: ReturnEqTableRowProps) => {
    console.log('描画', rowIndex);

    return (
      <TableRow>
        <TableCell sx={{ padding: 0, border: '1px solid black' }}>
          <IconButton onClick={() => handleDelete(row.kizaiId)} sx={{ padding: 0, color: 'red' }} disabled={!edit}>
            <Delete fontSize="small" />
          </IconButton>
        </TableCell>
        <TableCell align="right" size="small" sx={{ bgcolor: grey[200], py: 0, px: 1, border: '1px solid black' }}>
          {rowIndex + 1}
        </TableCell>
        <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: grey[200] }}>
          {row.shozokuId === 1 ? 'K' : 'Y'}
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip
            name={row.kizaiNam}
            memo={row.mem ? row.mem : ''}
            handleMemoChange={handleMemoChange}
            kizaiId={row.kizaiId}
            disabled={!edit}
          />
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button
            variant="text"
            sx={{ p: 0, justifyContent: 'start' }}
            onClick={() => window.open(`/loan-situation/${row.kizaiId}`)}
          >
            {row.kizaiNam}
          </Button>
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.oyaPlanKizaiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.oyaPlanYobiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planKizaiQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= (row.oyaPlanKizaiQty ?? 0)) {
                handlePlanKizaiQtyChange(row.kizaiId, Number(e.target.value));
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
                color: 'red',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '.MuiInput-input.Mui-disabled': {
                WebkitTextFillColor: 'red',
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            inputRef={handleOrderRef}
            onKeyDown={(e) => {
              handleKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planYobiQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= (row.oyaPlanYobiQty ?? 0)) {
                handlePlanYobiQtyChange(row.kizaiId, Number(e.target.value));
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
                color: 'red',
              },
              '& input[type=number]': {
                MozAppearance: 'textfield',
              },
              '& input[type=number]::-webkit-outer-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '.MuiInput-input.Mui-disabled': {
                WebkitTextFillColor: 'red',
              },
            }}
            slotProps={{
              input: {
                style: { textAlign: 'right' },
                disableUnderline: true,
                inputMode: 'numeric',
              },
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200], color: 'red' }}>
          {row.planQty}
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row && prevProps.edit === nextProps.edit;
  }
);

ReturnEqTableRow.displayName = 'ReturnEqTableRow';

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
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
