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

import { TestDate } from '@/app/(main)/_ui/date';

import { Equipment, EquipmentData, StockData } from './equipment-order-detail';

type StockTableProps = {
  header: string[];
  rows: StockData[];
  dateRange: string[];
  startDate: Date | null;
  endDate: Date | null;
  preparation: EquipmentData[];
  RH: EquipmentData[];
  GP: EquipmentData[];
  actual: EquipmentData[];
  getHeaderBackgroundColor: (date: string, dateRange: string[]) => string;
  getRowBackgroundColor: (
    dateHeader: string,
    dateRange: string[],
    startKICSDate: Date | null,
    endKICSDate: Date | null,
    preparation: EquipmentData[],
    RH: EquipmentData[],
    GP: EquipmentData[],
    actual: EquipmentData[]
  ) => string;
};

export const StockTable: React.FC<StockTableProps> = ({
  header,
  rows,
  dateRange,
  startDate,
  endDate,
  preparation,
  RH,
  GP,
  actual,
  getHeaderBackgroundColor,
  getRowBackgroundColor,
}) => {
  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {header?.map((date, index) => (
              <TableCell
                key={index}
                align={typeof rows[0].data[index] === 'number' ? 'right' : 'left'}
                size="small"
                sx={{
                  border: getHeaderBackgroundColor(date, dateRange) === 'black' ? '1px solid grey' : '1px solid black',
                  whiteSpace: 'nowrap',
                  color: 'white',
                  bgcolor: getHeaderBackgroundColor(date, dateRange),
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
            <StockTableRow
              key={rowIndex}
              header={header}
              row={row}
              dateRange={dateRange}
              startDate={startDate}
              endDate={endDate}
              preparation={preparation}
              RH={RH}
              GP={GP}
              actual={actual}
              getRowBackgroundColor={getRowBackgroundColor}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export type StockTableRowProps = {
  header: string[];
  row: StockData;
  dateRange: string[];
  startDate: Date | null;
  endDate: Date | null;
  preparation: EquipmentData[];
  RH: EquipmentData[];
  GP: EquipmentData[];
  actual: EquipmentData[];
  getRowBackgroundColor: (
    dateHeader: string,
    dateRange: string[],
    startKICSDate: Date | null,
    endKICSDate: Date | null,
    preparation: EquipmentData[],
    RH: EquipmentData[],
    GP: EquipmentData[],
    actual: EquipmentData[]
  ) => string;
};

const StockTableRow = React.memo(
  ({
    header,
    row,
    dateRange,
    startDate,
    endDate,
    preparation,
    RH,
    GP,
    actual,
    getRowBackgroundColor,
  }: StockTableRowProps) => {
    console.log('date側描画', row.id);
    return (
      <TableRow>
        {row.data.map((cell, colIndex) => {
          return (
            <TableCell
              key={colIndex}
              align={typeof cell === 'number' ? 'right' : 'left'}
              sx={{
                border: '1px solid black',
                whiteSpace: 'nowrap',
                height: 25,
                bgcolor: getRowBackgroundColor(
                  header[colIndex],
                  dateRange,
                  startDate,
                  endDate,
                  preparation,
                  RH,
                  GP,
                  actual
                ),
                py: 0,
                px: 1,
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
      // prevProps.startKICSDate === nextProps.startKICSDate &&
      // prevProps.endKICSDate === nextProps.endKICSDate &&
      prevProps.preparation === nextProps.preparation &&
      prevProps.RH === nextProps.RH &&
      prevProps.GP === nextProps.GP &&
      prevProps.actual === nextProps.actual
    );
  }
);

StockTableRow.displayName = 'StockTableRow';

type EqTableProps = {
  rows: Equipment[];
  onChange: (rowIndex: number, orderValue: number, spareValue: number, totalValue: number) => void;
  handleCellDateChange: (rowIndex: number, date: Dayjs | null) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
};

export const EqTable: React.FC<EqTableProps> = ({ rows, onChange, handleCellDateChange, handleMemoChange }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOrderCellChange = (rowIndex: number, newValue: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].order = newValue;
    updatedRows[rowIndex].total = updatedRows[rowIndex].order + updatedRows[rowIndex].spare;
    onChange(rowIndex, updatedRows[rowIndex].order, updatedRows[rowIndex].spare, updatedRows[rowIndex].total);
  };

  const handleSpareCellChange = (rowIndex: number, newValue: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex].spare = newValue;
    updatedRows[rowIndex].total = updatedRows[rowIndex].order + updatedRows[rowIndex].spare;
    onChange(rowIndex, updatedRows[rowIndex].order, updatedRows[rowIndex].spare, updatedRows[rowIndex].total);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRefs.current[rowIndex + 1]?.focus();
    }
  };

  const handleOrderRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[rowIndex] = el;
  };

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell size="small" style={styles.header} />
            <TableCell size="small" style={styles.header} />
            <TableCell align="left" size="small" style={styles.header}>
              移動日時
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              在庫場所
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              メモ
            </TableCell>
            <TableCell align="left" size="small" style={styles.header}>
              機材名
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              全数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              受注数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              予備数
            </TableCell>
            <TableCell align="right" size="small" style={styles.header}>
              合計数
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <EqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              handleOrderRef={handleOrderRef(rowIndex)}
              handleCellDateChange={handleCellDateChange}
              handleMemoChange={handleMemoChange}
              handleKeyDown={handleKeyDown}
              handleOrderCellChange={handleOrderCellChange}
              handleSpareCellChange={handleSpareCellChange}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type EqTableRowProps = {
  row: Equipment;
  rowIndex: number;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleCellDateChange: (rowIndex: number, date: Dayjs | null) => void;
  handleMemoChange: (rowIndex: number, memo: string) => void;
  handleOrderCellChange: (rowIndex: number, newValue: number) => void;
  handleSpareCellChange: (rowIndex: number, newValue: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const EqTableRow = React.memo(
  ({
    row,
    rowIndex,
    handleOrderRef,
    handleCellDateChange,
    handleMemoChange,
    handleOrderCellChange,
    handleSpareCellChange,
    handleKeyDown,
  }: EqTableRowProps) => {
    console.log('描画', rowIndex);

    const handleDateChange = (date: Dayjs | null) => {
      if (date !== null) {
        handleCellDateChange(rowIndex, date);
      }
    };

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
              date={row.date}
              onChange={handleDateChange}
            />
            {row.date && <Typography>{row.place === 'K' ? 'K→Y' : 'Y→K'}</Typography>}
          </Box>
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
          {row.all}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.order}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleOrderCellChange(rowIndex, Number(e.target.value));
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
              handleKeyDown(e, rowIndex);
            }}
            onFocus={(e) => e.target.select()}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.spare}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handleSpareCellChange(rowIndex, Number(e.target.value));
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
            onFocus={(e) => e.target.select()}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.total}
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row;
  }
);

EqTableRow.displayName = 'EqTableRow';

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
    height: 25,
    paddingTop: 0,
    paddingBottom: 0,
    paddingLeft: 1,
    paddingRight: 1,
  },
};
