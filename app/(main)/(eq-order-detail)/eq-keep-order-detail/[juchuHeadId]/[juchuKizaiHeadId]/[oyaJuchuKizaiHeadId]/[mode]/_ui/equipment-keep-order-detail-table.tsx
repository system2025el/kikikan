'use client';

import Delete from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
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
import React, { useRef, useState } from 'react';

import { MemoTooltip } from '@/app/(main)/(eq-order-detail)/_ui/memo-tooltip';

import { KeepJuchuContainerMeisaiValues, KeepJuchuKizaiMeisaiValues } from '../_lib/types';

type KeepEqTableProps = {
  rows: KeepJuchuKizaiMeisaiValues[];
  edit: boolean;
  nyukoFixFlag: boolean;
  oyaShukoDate: Date | null;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleCellChange: (rowIndex: number, keepValue: number) => void;
  handleEqSelect: (row: KeepJuchuKizaiMeisaiValues) => void;
  handleEqAllSelect: () => void;
};

export const KeepEqTable: React.FC<KeepEqTableProps> = ({
  rows,
  edit,
  nyukoFixFlag,
  oyaShukoDate,
  handleMemoChange,
  handleCellChange,
  handleEqSelect,
  handleEqAllSelect,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const visibleRows = rows.filter((row) => !row.delFlag);

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      inputRefs.current[rowIndex + 1]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      inputRefs.current[rowIndex - 1]?.focus();
    }
  };

  const handleKeepRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[rowIndex] = el;
  };

  return (
    <TableContainer style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }} colSpan={5} />
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
              sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'green' }}
              rowSpan={2}
            >
              キープ
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              sx={{
                position: 'sticky',
                top: 25,
                zIndex: 2,
                padding: 0,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              <Checkbox
                indeterminate={
                  visibleRows &&
                  visibleRows.filter((d) => d.selected).length > 0 &&
                  visibleRows.filter((d) => d.selected).length < visibleRows.length
                }
                checked={
                  visibleRows &&
                  visibleRows.length > 0 &&
                  visibleRows.filter((d) => d.selected).length === visibleRows.length
                }
                onChange={handleEqAllSelect}
                sx={{
                  padding: 0,
                  '& .MuiSvgIcon-root': {
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s',
                  },
                }}
                disabled={!edit || nyukoFixFlag}
              />
            </TableCell>
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }} />
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              YK
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              受注
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              予備
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <KeepEqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              nyukoFixFlag={nyukoFixFlag}
              oyaShukoDate={oyaShukoDate}
              handleKeepRef={handleKeepRef(rowIndex)}
              handleMemoChange={handleMemoChange}
              handleEqSelect={handleEqSelect}
              handleKeyDown={handleKeyDown}
              handleCellChange={handleCellChange}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type KeepEqTableRowProps = {
  row: KeepJuchuKizaiMeisaiValues;
  rowIndex: number;
  edit: boolean;
  nyukoFixFlag: boolean;
  oyaShukoDate: Date | null;
  handleKeepRef: (el: HTMLInputElement | null) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleCellChange: (rowIndex: number, keepValue: number) => void;
  handleEqSelect: (row: KeepJuchuKizaiMeisaiValues) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const KeepEqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    nyukoFixFlag,
    oyaShukoDate,
    handleMemoChange,
    handleCellChange,
    handleEqSelect,
    handleKeepRef,
    handleKeyDown,
  }: KeepEqTableRowProps) => {
    return (
      <TableRow hover>
        <TableCell
          sx={{
            padding: 0,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          <Checkbox
            color="primary"
            checked={row.selected}
            onChange={() => handleEqSelect(row)}
            sx={{ padding: 0 }}
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
        <TableCell
          align="right"
          size="small"
          sx={{
            bgcolor: grey[200],
            py: 0,
            px: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
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
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button
            variant="text"
            sx={{ p: 0, justifyContent: 'start', textTransform: 'none', color: 'text.primary' }}
            onClick={() =>
              window.open(`/loan-situation/${row.kizaiId}?date=${oyaShukoDate ? oyaShukoDate.toISOString() : ''}`)
            }
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
            value={row.keepQty}
            type="text"
            onChange={(e) => {
              if (
                /^\d*$/.test(e.target.value) &&
                Number(e.target.value) <= (row.oyaPlanKizaiQty ?? 0) + (row.oyaPlanYobiQty ?? 0)
              ) {
                handleCellChange(rowIndex, Number(e.target.value));
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
            inputRef={handleKeepRef}
            onKeyDown={(e) => {
              handleKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row && prevProps.edit === nextProps.edit;
  }
);

KeepEqTableRow.displayName = 'KeepEqTableRow';

type KeepContainerTableRowProps = {
  row: KeepJuchuContainerMeisaiValues;
  rowIndex: number;
  edit: boolean;
  nyukoFixFlag: boolean;
  oyaShukoDate: Date | null;
  handleContainerMemoChange: (rowIndex: number, memo: string) => void;
  handleContainerCellChange: (rowIndex: number, kicsValue: number, yardValue: number) => void;
  handleCtnSelect: (row: KeepJuchuContainerMeisaiValues) => void;
  handleContainerKicsRef: (el: HTMLInputElement | null, rowIndex: number) => void;
  handleContainerYardRef: (el: HTMLInputElement | null, rowIndex: number) => void;
  handleKicsKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
  handleYardKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const KeepContainerTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    nyukoFixFlag,
    oyaShukoDate,
    handleContainerMemoChange,
    handleContainerCellChange,
    handleCtnSelect,
    handleContainerKicsRef,
    handleContainerYardRef,
    handleKicsKeyDown,
    handleYardKeyDown,
  }: KeepContainerTableRowProps) => {
    return (
      <TableRow hover>
        <TableCell
          sx={{
            padding: 0,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          <Checkbox
            color="primary"
            checked={row.selected}
            onChange={() => handleCtnSelect(row)}
            sx={{ padding: 0 }}
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
        <TableCell
          align="right"
          size="small"
          sx={{
            bgcolor: grey[200],
            py: 0,
            px: 1,
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          }}
        >
          {rowIndex + 1}
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip
            name={row.kizaiNam}
            memo={row.mem ? row.mem : ''}
            handleMemoChange={handleContainerMemoChange}
            rowIndex={rowIndex}
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button
            variant="text"
            sx={{ p: 0, justifyContent: 'start', textTransform: 'none', color: 'text.primary' }}
            onClick={() =>
              window.open(`/loan-situation/${row.kizaiId}?date=${oyaShukoDate ? oyaShukoDate.toISOString() : ''}`)
            }
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
            value={row.kicsKeepQty}
            type="text"
            onChange={(e) => {
              if (
                /^\d*$/.test(e.target.value) &&
                Number(e.target.value) + row.yardKeepQty <=
                  (row.oyaPlanKicsKizaiQty ?? 0) + (row.oyaPlanYardKizaiQty ?? 0)
              ) {
                handleContainerCellChange(rowIndex, Number(e.target.value), row.yardKeepQty);
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
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.yardKeepQty}
            type="text"
            onChange={(e) => {
              if (
                /^\d*$/.test(e.target.value) &&
                Number(e.target.value) + row.kicsKeepQty <=
                  (row.oyaPlanKicsKizaiQty ?? 0) + (row.oyaPlanYardKizaiQty ?? 0)
              ) {
                handleContainerCellChange(rowIndex, row.kicsKeepQty, Number(e.target.value));
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
            disabled={!edit || nyukoFixFlag}
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.row === nextProps.row &&
      prevProps.rowIndex === nextProps.rowIndex &&
      prevProps.edit === nextProps.edit &&
      prevProps.nyukoFixFlag === nextProps.nyukoFixFlag
    );
  }
);

KeepContainerTableRow.displayName = 'KeepContainerTableRow';

export const KeepContainerTable = (props: {
  rows: KeepJuchuContainerMeisaiValues[];
  edit: boolean;
  nyukoFixFlag: boolean;
  oyaShukoDate: Date | null;
  handleContainerMemoChange: (rowIndex: number, memo: string) => void;
  handleContainerCellChange: (rowIndex: number, kicsValue: number, yardValue: number) => void;
  handleCtnSelect: (row: KeepJuchuContainerMeisaiValues) => void;
  handleCtnAllSelect: () => void;
}) => {
  const {
    rows,
    edit,
    nyukoFixFlag,
    oyaShukoDate,
    handleContainerMemoChange,
    handleContainerCellChange,
    handleCtnSelect,
    handleCtnAllSelect,
  } = props;

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
      <Table stickyHeader sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
            <TableCell size="small" sx={{ bgcolor: 'white', position: 'sticky', top: 0, zIndex: 2 }} colSpan={4} />
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
              sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'green' }}
              colSpan={2}
            >
              キープ
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell
              sx={{
                position: 'sticky',
                top: 25,
                zIndex: 2,
                padding: 0,
                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
              }}
            >
              <Checkbox
                indeterminate={
                  visibleRows &&
                  visibleRows.filter((d) => d.selected).length > 0 &&
                  visibleRows.filter((d) => d.selected).length < visibleRows.length
                }
                checked={
                  visibleRows &&
                  visibleRows.length > 0 &&
                  visibleRows.filter((d) => d.selected).length === visibleRows.length
                }
                onChange={handleCtnAllSelect}
                sx={{
                  padding: 0,
                  '& .MuiSvgIcon-root': {
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    transition: 'background-color 0.3s',
                  },
                }}
                disabled={!edit || nyukoFixFlag}
              />
            </TableCell>
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }} />
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              K
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              Y
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              K
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ position: 'sticky', top: 25, zIndex: 2 }}>
              Y
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <KeepContainerTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              nyukoFixFlag={nyukoFixFlag}
              oyaShukoDate={oyaShukoDate}
              handleContainerMemoChange={handleContainerMemoChange}
              handleContainerCellChange={handleContainerCellChange}
              handleCtnSelect={handleCtnSelect}
              handleContainerKicsRef={handleContainerKicsRef}
              handleContainerYardRef={handleContainerYardRef}
              handleKicsKeyDown={handleKicsKeyDown}
              handleYardKeyDown={handleYardKeyDown}
            />
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
    height: '25px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
  // 行
  row: {
    borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
    borderRight: '1px solid rgba(0, 0, 0, 0.12)',
    whiteSpace: 'nowrap',
    height: '26px',
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 4,
    paddingRight: 4,
  },
};
