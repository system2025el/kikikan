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
import React, { useRef, useState } from 'react';

import { getDateHeaderBackgroundColor, getDateRowBackgroundColor } from '../_lib/colorselect';
import { KeepJuchuKizaiMeisaiValues } from '../_lib/types';

type KeepEqTableProps = {
  rows: KeepJuchuKizaiMeisaiValues[];
  edit: boolean;
  handleDelete: (kizaiId: number) => void;
  handleMemoChange: (kizaiId: number, memo: string) => void;
  onChange: (rowIndex: number, returnValue: number) => void;
};

export const KeepEqTable: React.FC<KeepEqTableProps> = ({ rows, edit, handleDelete, handleMemoChange, onChange }) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const visibleRows = rows.filter((row) => !row.delFlag);

  const handleKeepCellChange = (rowIndex: number, newValue: number) => {
    onChange(rowIndex, newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRefs.current[rowIndex + 1]?.focus();
    }
  };

  const handleKeepRef = (rowIndex: number) => (el: HTMLInputElement | null) => {
    inputRefs.current[rowIndex] = el;
  };

  return (
    <TableContainer component={Paper} style={{ overflow: 'scroll', maxHeight: '80vh' }}>
      <Table>
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
              sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: 'green' }}
              rowSpan={2}
            >
              キープ数
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }} />
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              在庫場所
            </TableCell>
            <TableCell align="left" size="small" style={styles.header} sx={{ position: 'sticky', top: 24, zIndex: 2 }}>
              キープメモ
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
          </TableRow>
        </TableHead>
        <TableBody>
          {visibleRows.map((row, rowIndex) => (
            <KeepEqTableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              edit={edit}
              handleDelete={handleDelete}
              handleKeepRef={handleKeepRef(rowIndex)}
              handleMemoChange={handleMemoChange}
              handleKeyDown={handleKeyDown}
              handleKeepCellChange={handleKeepCellChange}
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
  handleDelete: (kizaiId: number) => void;
  handleKeepRef: (el: HTMLInputElement | null) => void;
  handleMemoChange: (kizaiId: number, memo: string) => void;
  handleKeepCellChange: (kizaiId: number, newValue: number) => void;
  handleKeyDown: (e: React.KeyboardEvent, rowIndex: number) => void;
};

const KeepEqTableRow = React.memo(
  ({
    row,
    rowIndex,
    edit,
    handleDelete,
    handleMemoChange,
    handleKeepCellChange,
    handleKeepRef,
    handleKeyDown,
  }: KeepEqTableRowProps) => {
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
          <Button variant="text" sx={{ p: 0, justifyContent: 'start' }} href={`/loan-situation/${row.kizaiId}`}>
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
              if (/^\d*$/.test(e.target.value) && Number(e.target.value) <= row.oyaPlanKizaiQty + row.oyaPlanYobiQty) {
                handleKeepCellChange(row.kizaiId, Number(e.target.value));
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
            disabled={!edit}
          />
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.row === nextProps.row;
  }
);

KeepEqTableRow.displayName = 'KeepEqTableRow';

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
      <Tooltip title={equipmentMemo} arrow sx={{ p: 0 }} color={equipmentMemo ? 'primary' : 'default'}>
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
