'use client';

import { BorderColor } from '@mui/icons-material';
import Delete from '@mui/icons-material/Delete';
import EditNoteIcon from '@mui/icons-material/EditNote';
import {
  Button,
  colors,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { Dayjs } from 'dayjs';
import React, { useState } from 'react';

import { EquipmentData } from './equipment-order-detail';

type TableProps = {
  header: string[];
  rows: Array<{
    id: number;
    data: Array<string | number>;
  }>;
  dateRange: string[];
  startKICSDate: Date;
  endKICSDate: Date;
  preparation: EquipmentData[];
  RH: EquipmentData[];
  GP: EquipmentData[];
  actual: EquipmentData[];
  editableColumns?: number[] | null;
  cellWidths?: Array<string | number>;
  getHeaderBackgroundColor: (date: string, dateRange: string[]) => string;
  rowColorSelect: boolean;
  getRowBackgroundColor: (
    dateHeader: string,
    startKICSDate: Date,
    endKICSDate: Date,
    preparation: EquipmentData[],
    RH: EquipmentData[],
    GP: EquipmentData[],
    actual: EquipmentData[]
  ) => string;
};

const GridTable: React.FC<TableProps> = ({
  header,
  rows,
  dateRange,
  startKICSDate,
  endKICSDate,
  preparation,
  RH,
  GP,
  actual,
  cellWidths = [],
  getHeaderBackgroundColor,
  rowColorSelect,
  getRowBackgroundColor,
}) => {
  const getWidth = (index: number) => cellWidths[index] ?? cellWidths[1];

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
            <TableRow key={rowIndex}>
              {row.data.map((cell, colIndex) => {
                const width = getWidth(colIndex);

                return (
                  <TableCell
                    key={colIndex}
                    align={typeof cell === 'number' ? 'right' : 'left'}
                    sx={{
                      border: '1px solid black',
                      whiteSpace: 'nowrap',
                      width,
                      height: 25,
                      bgcolor: getRowBackgroundColor(
                        header[colIndex],
                        startKICSDate,
                        endKICSDate,
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default GridTable;

type GridSelectBoxTableProps = {
  header: string[] | null;
  rows: Array<{
    id: number;
    data: Array<string | number>;
  }>;
  editableColumns?: number[] | null;
  onChange?: (rowIndex: number, updatedRows: { id: number; data: Array<string | number> }[]) => void;
  cellWidths?: Array<string | number>;
  getRowBackgroundColor: (rowIndex: number, colIndex: number) => string;
  handleMemoChange: (rowIndex: number, memo: string) => void;
};

export const GridSelectBoxTable: React.FC<GridSelectBoxTableProps> = ({
  header,
  rows,
  editableColumns = [],
  onChange,
  cellWidths = [],
  getRowBackgroundColor,
  handleMemoChange,
}) => {
  const handleCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex] = {
      ...updatedRows[rowIndex],
      data: [...updatedRows[rowIndex].data],
    };
    updatedRows[rowIndex].data[colIndex] = newValue;
    updatedRows[rowIndex].data[7] = Number(updatedRows[rowIndex].data[5]) + Number(updatedRows[rowIndex].data[6]);
    onChange?.(rowIndex, updatedRows);
  };

  const getWidth = (index: number) => cellWidths[index] ?? cellWidths[1];

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {header?.map((data, index) => (
              <TableCell
                key={index}
                align={typeof rows[0].data[index] === 'number' ? 'right' : 'left'}
                size="small"
                sx={{
                  border: '1px solid grey',
                  whiteSpace: 'nowrap',
                  padding: 0,
                }}
              >
                {data}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell sx={{ padding: 0 }}>
                <IconButton sx={{ padding: 0, color: 'red' }}>
                  <Delete fontSize="small" />
                </IconButton>
              </TableCell>
              {row.data.map((cell, colIndex) => {
                const isEditable = editableColumns?.includes(colIndex);
                const width = getWidth(colIndex);

                return (
                  <TableCell
                    key={colIndex}
                    align={typeof cell === 'number' ? 'right' : 'left'}
                    sx={{
                      border: '1px solid black',
                      whiteSpace: 'nowrap',
                      width,
                      height: 25,
                      bgcolor: getRowBackgroundColor(rowIndex, colIndex),
                      py: 0,
                      px: 1,
                    }}
                    size="small"
                  >
                    {isEditable ? (
                      <TextField
                        variant="standard"
                        value={cell}
                        type="number"
                        onChange={(e) => handleCellChange(rowIndex, colIndex, Number(e.target.value))}
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
                          },
                        }}
                      />
                    ) : colIndex === 2 ? (
                      <MemoTooltip
                        name={row.data[1].toString()}
                        memo={row.data[2].toString()}
                        handleMemoChange={handleMemoChange}
                        rowIndex={rowIndex}
                      />
                    ) : (
                      cell
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

type Props = {
  name: string;
  memo: string;
  rowIndex: number;
  handleMemoChange: (rowIndex: number, memo: string) => void;
};

export const MemoTooltip = (props: Props) => {
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
        <DialogTitle>{props.name}</DialogTitle>
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
