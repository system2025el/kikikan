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

import { toJapanMDString, toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { MemoTooltip } from '@/app/(main)/(eq-order-detail)/_ui/memo-tooltip';
import { getStockRowBackgroundColor } from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/colorselect';
import {
  JuchuKizaiHonbanbiValues,
  StockTableValues,
} from '@/app/(main)/(eq-order-detail)/eq-main-order-detail/[juchuHeadId]/[juchuKizaiHeadId]/[mode]/_lib/types';

import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { ReturnJuchuContainerMeisaiValues, ReturnJuchuKizaiMeisaiValues } from '../_lib/types';

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
    <TableContainer ref={ref} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
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
                      getDateHeaderBackgroundColor(toJapanYMDString(data.calDat), stockTableHeaderDateRange) === 'black'
                        ? '1px solid grey'
                        : '1px solid black',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: getDateHeaderBackgroundColor(toJapanYMDString(data.calDat), stockTableHeaderDateRange),
                    padding: 0,
                    height: '26px',
                    position: 'sticky',
                    top: 24,
                    zIndex: 2,
                  }}
                >
                  {toJapanMDString(data.calDat)}
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
  handleCellChange: (rowIndex: number, kizaiId: number, planQty: number) => void;
  handleMeisaiDelete: (rowIndex: number, row: ReturnJuchuKizaiMeisaiValues) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
};

export const ReturnEqTable: React.FC<ReturnEqTableProps> = ({
  rows,
  edit,
  handleCellChange,
  handleMeisaiDelete,
  handleMemoChange,
  ref,
}) => {
  const inputOrderRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputYobiRefs = useRef<(HTMLInputElement | null)[]>([]);

  const visibleRows = rows.filter((row) => !row.delFlag);

  const handleOrderKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    console.log(e.key);
    if (e.key === 'Enter') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex]?.focus();
    }
  };

  const handleOrderRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputOrderRefs.current[rowIndex] = el;
  };

  const handleYobiKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputYobiRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      inputOrderRefs.current[rowIndex]?.focus();
    }
  };

  const handleYobiRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputYobiRefs.current[rowIndex] = el;
  };

  return (
    <TableContainer ref={ref} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
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
              rowSpan={2}
            >
              返却
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              YK
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              受注
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              予備
            </TableCell>
            {/* <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              受注
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              予備
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              合計
            </TableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <ReturnEqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              handleOrderRef={handleOrderRef(rowIndex)}
              handleYobiRef={handleYobiRef(rowIndex)}
              handleMeisaiDelete={handleMeisaiDelete}
              handleMemoChange={handleMemoChange}
              handleOrderKeyDown={handleOrderKeyDown}
              handleYobiKeyDown={handleYobiKeyDown}
              handleCellChange={handleCellChange}
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
  handleYobiRef: (el: HTMLInputElement | null) => void;
  handleMeisaiDelete: (rowIndex: number, row: ReturnJuchuKizaiMeisaiValues) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleCellChange: (rowIndex: number, kizaiId: number, planQty: number) => void;
  handleOrderKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
  handleYobiKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const ReturnEqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    handleOrderRef,
    handleYobiRef,
    handleMeisaiDelete,
    handleMemoChange,
    handleCellChange,
    handleOrderKeyDown,
    handleYobiKeyDown,
  }: ReturnEqTableRowProps) => {
    console.log('描画', rowIndex);

    return (
      <TableRow>
        <TableCell sx={{ padding: 0, border: '1px solid black' }}>
          <IconButton
            onClick={() => handleMeisaiDelete(rowIndex, row)}
            sx={{ padding: 0, color: 'red' }}
            disabled={!edit}
          >
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
            rowIndex={rowIndex}
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
            value={row.planQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= row.oyaPlanKizaiQty + row.oyaPlanYobiQty) {
                handleCellChange(rowIndex, row.kizaiId, Number(e.target.value));
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
              handleOrderKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit}
          />
        </TableCell>
        {/* <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planYobiQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= (row.oyaPlanYobiQty ?? 0)) {
                handleCellChange(rowIndex, row.kizaiId, row.planKizaiQty, Number(e.target.value), row.planQty);
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
            inputRef={handleYobiRef}
            onKeyDown={(e) => {
              handleYobiKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200], color: 'red' }}>
          {row.planQty}
        </TableCell> */}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row && prevProps.edit === nextProps.edit;
  }
);

ReturnEqTableRow.displayName = 'ReturnEqTableRow';

export const ReturnContainerTable = (props: {
  rows: ReturnJuchuContainerMeisaiValues[];
  edit: boolean;
  handleContainerMemoChange: (rowIndex: number, memo: string) => void;
  handleContainerCellChange: (rowIndex: number, kicsValue: number, yardValue: number) => void;
  handleMeisaiDelete: (row: ReturnJuchuContainerMeisaiValues) => void;
}) => {
  const { rows, edit, handleContainerMemoChange, handleContainerCellChange, handleMeisaiDelete } = props;

  const inputKicsRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inputYardRefs = useRef<(HTMLInputElement | null)[]>([]);

  const visibleRows = rows.filter((row) => !row.delFlag);

  const handleKicsKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputKicsRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputKicsRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputKicsRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      inputYardRefs.current[rowIndex]?.focus();
    }
  };

  const handleContainerKicsRef = (el: HTMLInputElement | null, rowIndex: number) => {
    inputKicsRefs.current[rowIndex] = el;
  };

  const handleYardKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputYardRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputYardRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputYardRefs.current[rowIndex - 1]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      inputKicsRefs.current[rowIndex]?.focus();
    }
  };

  const handleContainerYardRef = (el: HTMLInputElement | null, rowIndex: number) => {
    inputYardRefs.current[rowIndex] = el;
  };

  return (
    <TableContainer style={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
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
              返却
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              K
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              Y
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              K
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              Y
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              合計
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell align="center" width={'min-content'} sx={{ padding: 0, border: '1px solid black' }}>
                <IconButton onClick={() => handleMeisaiDelete(row)} sx={{ padding: 0, color: 'red' }} disabled={!edit}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
              <TableCell
                align="right"
                size="small"
                sx={{ bgcolor: grey[200], py: 0, px: 1, border: '1px solid black' }}
              >
                {rowIndex + 1}
              </TableCell>
              <TableCell style={styles.row} align="center" size="small">
                <MemoTooltip
                  name={row.kizaiNam}
                  memo={row.mem ? row.mem : ''}
                  handleMemoChange={handleContainerMemoChange}
                  rowIndex={rowIndex}
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
                {row.oyaPlanKicsKizaiQty}
              </TableCell>
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
                {row.oyaPlanYardKizaiQty}
              </TableCell>
              <TableCell style={styles.row} align="right" size="small">
                <TextField
                  variant="standard"
                  value={row.planKicsKizaiQty}
                  type="text"
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= (row.oyaPlanKicsKizaiQty ?? 0)) {
                      handleContainerCellChange(rowIndex, Number(e.target.value), row.planYardKizaiQty);
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 0,
                      fontSize: 'small',
                      width: 60,
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
                  inputRef={(el) => handleContainerKicsRef(el, rowIndex)}
                  onKeyDown={(e) => {
                    handleKicsKeyDown(e, rowIndex);
                  }}
                  onFocus={(e) => e.target.select()}
                  disabled={!edit}
                />
              </TableCell>
              <TableCell style={styles.row} align="right" size="small">
                <TextField
                  variant="standard"
                  value={row.planYardKizaiQty}
                  type="text"
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= (row.oyaPlanYardKizaiQty ?? 0)) {
                      handleContainerCellChange(rowIndex, row.planKicsKizaiQty, Number(e.target.value));
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 0,
                      fontSize: 'small',
                      width: 60,
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
                  inputRef={(el) => handleContainerYardRef(el, rowIndex)}
                  onKeyDown={(e) => {
                    handleYardKeyDown(e, rowIndex);
                  }}
                  onFocus={(e) => e.target.select()}
                  disabled={!edit}
                />
              </TableCell>
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200], color: 'red' }}>
                {row.planQty}
              </TableCell>
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
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
