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

import { toISOStringMonthDay, toISOStringYearMonthDay } from '@/app/(main)/_lib/date-conversion';
import { TestDate } from '@/app/(main)/_ui/date';

import { getDateHeaderBackgroundColor, getStockRowBackgroundColor } from '../_lib/colorselect';
import { JuchuKizaiHonbanbiValues, JuchuKizaiMeisaiValues, StockTableValues } from '../_lib/types';

type StockTableProps = {
  eqStockList: StockTableValues[][];
  dateRange: string[];
  juchuHonbanbiList: JuchuKizaiHonbanbiValues[];
  ref: React.RefObject<HTMLDivElement | null>;
};

export const StockTable: React.FC<StockTableProps> = ({ eqStockList, dateRange, juchuHonbanbiList, ref }) => {
  return (
    <TableContainer ref={ref} component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
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
                      getDateHeaderBackgroundColor(toISOStringYearMonthDay(data.calDat), dateRange) === 'black'
                        ? '1px solid grey'
                        : '1px solid black',
                    whiteSpace: 'nowrap',
                    color: 'white',
                    bgcolor: getDateHeaderBackgroundColor(toISOStringYearMonthDay(data.calDat), dateRange),
                    padding: 0,
                    height: '26px',
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
  onChange: (kizaiId: number, orderValue: number, spareValue: number, totalValue: number) => void;
  handleDelete: (kizaiId: number) => void;
  handleCellDateChange: (kizaiId: number, date: Dayjs | null) => void;
  handleCellDateClear: (kizaiId: number) => void;
  handleMemoChange: (kizaiId: number, memo: string) => void;
  ref: React.RefObject<HTMLDivElement | null>;
};

export const EqTable: React.FC<EqTableProps> = ({
  rows,
  edit,
  onChange,
  handleDelete,
  handleCellDateChange,
  handleCellDateClear,
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

  const handleOrderRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
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
          {visibleRows.map((row, rowIndex) => (
            <EqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              handleOrderRef={handleOrderRef(rowIndex)}
              handleDelete={handleDelete}
              handleCellDateChange={handleCellDateChange}
              handleCellDateClear={handleCellDateClear}
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

type EqTableRowProps = {
  row: JuchuKizaiMeisaiValues;
  rowIndex: number;
  edit: boolean;
  handleOrderRef: (el: HTMLInputElement | null) => void;
  handleDelete: (kizaiId: number) => void;
  handleCellDateChange: (kizaiId: number, date: Dayjs | null) => void;
  handleCellDateClear: (kizaiId: number) => void;
  handleMemoChange: (kizaiId: number, memo: string) => void;
  handlePlanKizaiQtyChange: (kizaiId: number, newValue: number) => void;
  handlePlanYobiQtyChange: (kizaiId: number, newValue: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, kizaiId: number) => void;
};

const EqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    handleOrderRef,
    handleDelete,
    handleCellDateChange,
    handleCellDateClear,
    handleMemoChange,
    handlePlanKizaiQtyChange,
    handlePlanYobiQtyChange,
    handleKeyDown,
  }: EqTableRowProps) => {
    console.log('描画', rowIndex);

    const handleDateChange = (date: Dayjs | null) => {
      if (date !== null) {
        handleCellDateChange(row.kizaiId, date);
      }
    };

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
              onChange={handleDateChange}
              onClear={() => handleCellDateClear(row.kizaiId)}
              disabled={!edit}
            />
            {row.sagyoDenDat && <Typography>{row.shozokuId === 1 ? 'K→Y' : 'Y→K'}</Typography>}
          </Box>
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
          {row.kizaiQty}
        </TableCell>
        <TableCell style={styles.row} align="right" size="small">
          <TextField
            variant="standard"
            value={row.planKizaiQty}
            type="text"
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) {
                handlePlanKizaiQtyChange(row.kizaiId, Number(e.target.value));
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
                handlePlanYobiQtyChange(row.kizaiId, Number(e.target.value));
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
            disabled={!edit}
          />
        </TableCell>
        <TableCell style={styles.row} align="right" size="small" sx={{ bgcolor: grey[200] }}>
          {row.planQty}
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row && prevProps.edit === nextProps.edit;
  }
);

EqTableRow.displayName = 'EqTableRow';

type MemoTooltipProps = {
  name: string;
  memo: string;
  kizaiId: number;
  handleMemoChange: (kizaiId: number, memo: string) => void;
  disabled: boolean;
};

export const MemoTooltip = (props: MemoTooltipProps) => {
  const [open, setOpen] = useState(false);
  const [equipmentMemo, setEquipmentMemo] = useState(props.memo);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleSave = () => {
    props.handleMemoChange(props.kizaiId, equipmentMemo);
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
            disabled={props.disabled}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>キャンセル</Button>
          <Button onClick={handleSave} variant="contained" disabled={props.disabled}>
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
