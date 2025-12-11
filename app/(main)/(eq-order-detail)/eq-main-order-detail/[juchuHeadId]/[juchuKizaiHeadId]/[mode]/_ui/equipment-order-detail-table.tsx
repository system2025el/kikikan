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
import { TestDate } from '@/app/(main)/_ui/date';
import { MemoTooltip } from '@/app/(main)/(eq-order-detail)/_ui/memo-tooltip';

import { getDateHeaderBackgroundColor, getStockRowBackgroundColor } from '../_lib/colorselect';
import {
  IdoJuchuKizaiMeisaiValues,
  JuchuContainerMeisaiValues,
  JuchuKizaiHonbanbiValues,
  JuchuKizaiMeisaiValues,
  StockTableValues,
} from '../_lib/types';

type StockTableProps = {
  eqStockList: StockTableValues[][];
  dateRange: string[];
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const StockTable: React.FC<StockTableProps> = ({ eqStockList, dateRange, juchuHonbanbiList, ref }) => {
  return (
    <TableContainer ref={ref} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {eqStockList.length > 0 &&
              eqStockList[0].map((data, index) => (
                <TableCell
                  key={index}
                  align={'right'}
                  size="small"
                  sx={{
                    border:
                      getDateHeaderBackgroundColor(toJapanYMDString(data.calDat), dateRange) === 'black'
                        ? '1px solid grey'
                        : '1px solid black',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: getDateHeaderBackgroundColor(toJapanYMDString(data.calDat), dateRange),
                    padding: 0,
                    height: '26px',
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
              <StockTableRow
                key={rowIndex}
                row={row}
                index={rowIndex}
                dateRange={dateRange}
                juchuHonbanbiList={juchuHonbanbiList}
              />
            ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export type StockTableRowProps = {
  row: StockTableValues[];
  index: number;
  dateRange: string[];
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
};

const StockTableRow = React.memo(
  ({ row, index, dateRange, juchuHonbanbiList }: StockTableRowProps) => {
    console.log('date側描画', index);
    return (
      <TableRow>
        {row.map((cell, colIndex) => {
          console.log('stock側描写');
          return (
            <TableCell
              key={colIndex}
              align={typeof cell === 'number' ? 'right' : 'left'}
              style={styles.row}
              sx={{
                bgcolor: getStockRowBackgroundColor(cell.calDat, dateRange, juchuHonbanbiList),
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
    return prevProps.row === nextProps.row && prevProps.juchuHonbanbiList === nextProps.juchuHonbanbiList;
  }
);

StockTableRow.displayName = 'StockTableRow';

type EqTableProps = {
  rows: JuchuKizaiMeisaiValues[];
  edit: boolean;
  handleCellChange: (
    rowIndex: number,
    kizaiId: number,
    orderValue: number,
    spareValue: number,
    totalValue: number
  ) => void;
  handleMeisaiDelete: (rowIndex: number, row: JuchuKizaiMeisaiValues) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleMemo2Change: (rowIndex: number, memo: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
};

export const EqTable: React.FC<EqTableProps> = ({
  rows,
  edit,
  handleCellChange,
  handleMeisaiDelete,
  handleMemoChange,
  handleMemo2Change,
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
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              受注
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              予備
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              連絡
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <EqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              handleOrderRef={handleOrderRef(rowIndex)}
              handleYobiRef={handleYobiRef(rowIndex)}
              handleMeisaiDelete={handleMeisaiDelete}
              handleMemoChange={handleMemoChange}
              handleMemo2Change={handleMemo2Change}
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

type EqTableRowProps = {
  row: JuchuKizaiMeisaiValues;
  rowIndex: number;
  edit: boolean;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleYobiRef: (el: HTMLInputElement | null) => void;
  handleMeisaiDelete: (rowIndex: number, row: JuchuKizaiMeisaiValues) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleMemo2Change: (rowIndex: number, memo: string) => void;
  handleCellChange: (
    rowIndex: number,
    kizaiId: number,
    planKizaiQty: number,
    planYobiQty: number,
    planQty: number
  ) => void;
  handleOrderKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
  handleYobiKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const EqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    handleOrderRef,
    handleYobiRef,
    handleMeisaiDelete,
    handleMemoChange,
    handleMemo2Change,
    handleCellChange,
    handleOrderKeyDown,
    handleYobiKeyDown,
  }: EqTableRowProps) => {
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
            sx={{ p: 0, justifyContent: 'start', textTransform: 'none' }}
            onClick={() => window.open(`/loan-situation/${row.kizaiId}`)}
          >
            {row.kizaiNam}
          </Button>
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planKizaiQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleCellChange(rowIndex, row.kizaiId, Number(e.target.value), row.planYobiQty, row.planQty);
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
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
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planYobiQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleCellChange(rowIndex, row.kizaiId, row.planKizaiQty, Number(e.target.value), row.planQty);
              }
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
                padding: 0,
                fontSize: 'small',
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
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.planQty}
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip
            name={row.kizaiNam}
            memo={row.mem2 ?? ''}
            handleMemoChange={handleMemo2Change}
            rowIndex={rowIndex}
            disabled={!edit}
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row && prevProps.edit === nextProps.edit;
  }
);

EqTableRow.displayName = 'EqTableRow';

type IdoEqTableProps = {
  rows: IdoJuchuKizaiMeisaiValues[];
  edit: boolean;
  handleCellDateChange: (kizaiId: number, date: Dayjs | null) => void;
  handleCellDateClear: (kizaiId: number) => void;
};

export const IdoEqTable: React.FC<IdoEqTableProps> = ({ rows, edit, handleCellDateChange, handleCellDateClear }) => {
  const visibleRows = rows.filter((row) => !row.delFlag);

  return (
    <TableContainer style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              移動日
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              YK
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              有効
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              受注
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              予備
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell
                align="right"
                size="small"
                sx={{ bgcolor: grey[200], py: 0, px: 1, border: '1px solid black' }}
              >
                {rowIndex + 1}
              </TableCell>
              <TableCell style={styles.row} size="small">
                <Box display="flex" width={'200px'}>
                  <TestDate
                    sx={{
                      '& .MuiPickersInputBase-root': {
                        height: '23px',
                      },
                      '& .MuiPickersSectionList-root': {
                        padding: 0,
                      },
                      '& .MuiButtonBase-root': {
                        padding: 0,
                      },
                    }}
                    date={row.sagyoDenDat}
                    onChange={(date) => handleCellDateChange(row.kizaiId, date)}
                    onClear={() => handleCellDateClear(row.kizaiId)}
                    disabled={!edit}
                  />
                  {row.sagyoSijiId && <Typography>{row.sagyoSijiId === 1 ? 'K→Y' : 'Y→K'}</Typography>}
                </Box>
              </TableCell>
              <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: grey[200] }}>
                {row.shozokuId === 1 ? 'K' : 'Y'}
              </TableCell>
              <TableCell style={styles.row} align="left" size="small">
                <Button
                  variant="text"
                  sx={{ p: 0, justifyContent: 'start', textTransform: 'none' }}
                  onClick={() => window.open(`/loan-situation/${row.kizaiId}`)}
                >
                  {row.kizaiNam}
                </Button>
              </TableCell>
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
                {row.kizaiQty}
              </TableCell>
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
                {row.planKizaiQty}
              </TableCell>
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
                {row.planYobiQty}
              </TableCell>
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
                {row.planQty}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export const ContainerTable = (props: {
  rows: JuchuContainerMeisaiValues[];
  edit: boolean;
  handleContainerMemoChange: (rowIndex: number, memo: string) => void;
  handleContainerCellChange: (rowIndex: number, kicsValue: number, yardValue: number) => void;
  handleMeisaiDelete: (row: JuchuContainerMeisaiValues) => void;
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
            <TableCell size="small" style={styles.header} />
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              K
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              Y
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計数
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
                  sx={{ p: 0, justifyContent: 'start', textTransform: 'none' }}
                  onClick={() => window.open(`/loan-situation/${row.kizaiId}`)}
                >
                  {row.kizaiNam}
                </Button>
              </TableCell>
              <TableCell style={styles.row} align="right" size="small">
                <TextField
                  variant="standard"
                  value={row.planKicsKizaiQty}
                  type="text"
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value)) {
                      handleContainerCellChange(rowIndex, Number(e.target.value), row.planYardKizaiQty);
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 0,
                      fontSize: 'small',
                      width: 60,
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
                    if (/^\d*$/.test(e.target.value)) {
                      handleContainerCellChange(rowIndex, row.planKicsKizaiQty, Number(e.target.value));
                    }
                  }}
                  sx={{
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 0,
                      fontSize: 'small',
                      width: 60,
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
              <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
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
