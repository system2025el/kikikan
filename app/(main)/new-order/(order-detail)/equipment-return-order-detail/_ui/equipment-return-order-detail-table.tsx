'use client';

import Delete from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
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

import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { ReturnEquipment, ReturnEquipmentData, StockData } from './equipment-return-order-detail';

type ReturnStockTableProps = {
  header: string[];
  rows: StockData[];
  dateRange: string[];
  startDate: Date | null;
  endDate: Date | null;
  ref: React.RefObject<HTMLDivElement | null>;
};

export const ReturnStockTable: React.FC<ReturnStockTableProps> = ({
  header,
  rows,
  dateRange,
  startDate,
  endDate,
  ref,
}) => {
  return (
    <TableContainer ref={ref} component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {header?.map((date, index) => (
              <TableCell
                key={index}
                align={typeof rows[0].data[index] === 'number' ? 'right' : 'left'}
                size="small"
                sx={{
                  border:
                    getDateHeaderBackgroundColor(date, dateRange) === 'black' ? '1px solid grey' : '1px solid black',
                  whiteSpace: 'nowrap',
                  color: 'white',
                  bgcolor: getDateHeaderBackgroundColor(date, dateRange),
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
            <ReturnStockTableRow key={rowIndex} header={header} row={row} startDate={startDate} endDate={endDate} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export type ReturnStockTableRowProps = {
  header: string[];
  row: StockData;
  startDate: Date | null;
  endDate: Date | null;
};

const ReturnStockTableRow = React.memo(
  ({ header, row, startDate, endDate }: ReturnStockTableRowProps) => {
    console.log('date側描画', row.id);
    return (
      <TableRow>
        {row.data.map((cell, colIndex) => {
          return (
            <TableCell
              key={colIndex}
              align={typeof cell === 'number' ? 'right' : 'left'}
              style={styles.row}
              sx={{
                bgcolor: getDateRowBackgroundColor(header[colIndex], startDate, endDate),
                color: typeof cell === 'number' && cell < 0 ? 'red' : 'black',
              }}
              size="small"
            >
              {cell}
            </TableCell>
          );
        })}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.header === nextProps.header &&
      prevProps.row === nextProps.row &&
      prevProps.endDate === nextProps.endDate
    );
  }
);

ReturnStockTableRow.displayName = 'ReturnStockTableRow';

type ReturnEqTableProps = {
  rows: ReturnEquipment[];
  onChange: (rowIndex: number, returnValue: number) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
};

export const ReturnEqTable: React.FC<ReturnEqTableProps> = ({ rows, onChange, handleMemoChange, ref }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleReturnCellChange = (rowIndex: number, newValue: number) => {
    onChange(rowIndex, newValue);
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
            <TableCell size="small" style={styles.header} />
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              在庫場所
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              返却メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              出庫数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header} sx={{ bgcolor: 'red' }}>
              返却数
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <ReturnEqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              handleOrderRef={handleReturnRef(rowIndex)}
              handleMemoChange={handleMemoChange}
              handleKeyDown={handleKeyDown}
              handleReturnCellChange={handleReturnCellChange}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type ReturnEqTableRowProps = {
  row: ReturnEquipment;
  rowIndex: number;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleReturnCellChange: (rowIndex: number, newValue: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const ReturnEqTableRow = React.memo(
  ({
    row,
    rowIndex,
    handleOrderRef,
    handleMemoChange,
    handleReturnCellChange,
    handleKeyDown,
  }: ReturnEqTableRowProps) => {
    console.log('描画', rowIndex);

    return (
      <TableRow>
        <TableCell sx={{ padding: 0, border: '1px solid black' }}>
          <IconButton sx={{ padding: 0, color: 'red' }}>
            <Delete fontSize="small" />
          </IconButton>
        </TableCell>
        <TableCell align="right" size="small" sx={{ bgcolor: grey[200], py: 0, px: 1, border: '1px solid black' }}>
          {rowIndex + 1}
        </TableCell>
        <TableCell style={styles.row} align="left" size="small" sx={{ bgcolor: grey[200] }}>
          {row.place}
        </TableCell>
        <TableCell style={styles.row} align="center" size="small">
          <MemoTooltip name={row.name} memo={row.memo} handleMemoChange={handleMemoChange} rowIndex={rowIndex} />
        </TableCell>
        <TableCell style={styles.row} align="left" size="small">
          <Button variant="text" sx={{ p: 0 }} href={`/loan-situation/${row.id}`}>
            {row.name}
          </Button>
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.issue}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.return}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= row.issue) {
                handleReturnCellChange(rowIndex, Number(e.target.value));
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
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row;
  }
);

ReturnEqTableRow.displayName = 'ReturnEqTableRow';

type MemoTooltipProps = {
  name: string;
  memo: string;
  rowIndex: number;
  handleMemoChange: (rowIndex: number, memo: string) => void;
};

export const MemoTooltip = (props: MemoTooltipProps) => {
  const [open, setOpen] = useState(false);
  const [equipmentMemo, setEquipmentMemo] = useState(props.memo);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    props.handleMemoChange(props.rowIndex, equipmentMemo);
    handleClose();
  };

  return (
    <>
      <Tooltip title={equipmentMemo} arrow sx={{ p: 0 }}>
        <IconButton onClick={handleOpen} sx={{ padding: 0 }} color={equipmentMemo ? 'primary' : 'default'}>
          <EditNoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle fontSize="medium">{props.name}</DialogTitle>
        <DialogContent>
          <TextField
            value={equipmentMemo}
            onChange={(e) => setEquipmentMemo(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </>
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
