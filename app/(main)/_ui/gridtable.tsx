'use client';

import { BorderColor } from '@mui/icons-material';
import Delete from '@mui/icons-material/Delete';
import {
  Button,
  colors,
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
} from '@mui/material';
import React, { useState } from 'react';

type TableProps = {
  header: string[] | null;
  rows: Array<{
    id: number;
    data: Array<string | number>;
  }>;
  editableColumns?: number[] | null;
  onChange?: (rowIndex: number, colIndex: number, newValue: number) => void;
  cellWidths?: Array<string | number>;
  headerColorSelect: boolean;
  getHeaderBackgroundColor: (index: number, headerColorSelect: boolean) => string;
  getHeaderTextColor: (index: number, headerColorSelect: boolean) => string;
  rowColorSelect: boolean;
  getRowBackgroundColor: (rowIndex: number, colIndex: number, rowColorSelect: boolean) => string;
};

const GridTable: React.FC<TableProps> = ({
  header,
  rows,
  editableColumns = [],
  onChange,
  cellWidths = [],
  headerColorSelect,
  getHeaderBackgroundColor,
  getHeaderTextColor,
  rowColorSelect,
  getRowBackgroundColor,
}) => {
  const [localRows, setLocalRows] = useState(rows);

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updated = [...localRows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      data: [...updated[rowIndex].data],
    };
    updated[rowIndex].data[colIndex] = newValue;
    updated[rowIndex].data[4] = Number(updated[rowIndex].data[2]) + Number(updated[rowIndex].data[3]);
    setLocalRows(updated);
    //onChange?.(rowIndex, colIndex, newValue);
  };

  const getWidth = (index: number) => cellWidths[index] ?? cellWidths[1];

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {header?.map((date, index) => (
              <TableCell
                key={index}
                align={typeof localRows[0].data[index] === 'number' ? 'right' : 'left'}
                size="small"
                sx={{
                  border:
                    getHeaderBackgroundColor(index, headerColorSelect) === 'black'
                      ? '1px solid grey'
                      : '1px solid black',
                  whiteSpace: 'nowrap',
                  color: getHeaderTextColor(index, headerColorSelect),
                  bgcolor: getHeaderBackgroundColor(index, headerColorSelect),
                  padding: 0,
                }}
              >
                {date}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {localRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
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
                      bgcolor: getRowBackgroundColor(rowIndex, colIndex, rowColorSelect),
                      py: 0,
                      px: 1,
                    }}
                    size="small"
                  >
                    {isEditable && (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) ? (
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
                            style: { textAlign: 'center' },
                            disableUnderline: true,
                          },
                        }}
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

export default GridTable;

type GridSelectBoxTableProps = {
  header: string[] | null;
  rows: Array<{
    id: number;
    data: Array<string | number>;
  }>;
  editableColumns?: number[] | null;
  onChange?: (rowIndex: number, colIndex: number, newValue: number) => void;
  cellWidths?: Array<string | number>;
  headerColorSelect: boolean;
  getHeaderBackgroundColor: (index: number, headerColorSelect: boolean) => string;
  getHeaderTextColor: (index: number, headerColorSelect: boolean) => string;
  rowColorSelect: boolean;
  getRowBackgroundColor: (rowIndex: number, colIndex: number, rowColorSelect: boolean) => string;
  selectIssueBase: string[];
  selectIssueBaseChange: (index: number, value: string) => void;
};

export const GridSelectBoxTable: React.FC<GridSelectBoxTableProps> = ({
  header,
  rows,
  editableColumns = [],
  onChange,
  cellWidths = [],
  headerColorSelect,
  getHeaderBackgroundColor,
  getHeaderTextColor,
  rowColorSelect,
  getRowBackgroundColor,
  selectIssueBase,
  selectIssueBaseChange,
}) => {
  const [localRows, setLocalRows] = useState(rows);

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: number) => {
    const updated = [...localRows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      data: [...updated[rowIndex].data],
    };
    updated[rowIndex].data[colIndex] = newValue;
    updated[rowIndex].data[4] = Number(updated[rowIndex].data[2]) + Number(updated[rowIndex].data[3]);
    setLocalRows(updated);
    onChange?.(rowIndex, colIndex, newValue);
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
                align={typeof localRows[0].data[index] === 'number' ? 'right' : 'left'}
                size="small"
                sx={{
                  border:
                    getHeaderBackgroundColor(index, headerColorSelect) === 'black'
                      ? '1px solid grey'
                      : '1px solid black',
                  whiteSpace: 'nowrap',
                  color: getHeaderTextColor(index, headerColorSelect),
                  bgcolor: getHeaderBackgroundColor(index, headerColorSelect),
                  padding: 0,
                }}
              >
                {data}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {localRows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              <Cell index={rowIndex} value={selectIssueBase[rowIndex]} onChange={selectIssueBaseChange} />
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
                      bgcolor: getRowBackgroundColor(rowIndex, colIndex, rowColorSelect),
                      py: 0,
                      px: 1,
                    }}
                    size="small"
                  >
                    {isEditable && (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) ? (
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

type CellProps = {
  index: number;
  value: string;
  onChange: (index: number, value: string) => void;
};

const options = ['KICS', 'YARD'];

export const Cell = (props: CellProps) => {
  const handleSelectChange = (event: SelectChangeEvent) => {
    props.onChange(props.index, event.target.value);
  };

  return (
    <>
      <TableCell sx={{ padding: 0 }}>
        <IconButton sx={{ padding: 0, color: 'red' }}>
          <Delete fontSize="small" />
        </IconButton>
      </TableCell>
    </>
  );
};
