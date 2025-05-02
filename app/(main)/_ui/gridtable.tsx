'use client';

import { BorderColor } from '@mui/icons-material';
import {
  Button,
  colors,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import React, { useState } from 'react';

import { getBackgroundColor } from '@/app/(main)/new-order/schedule/_lib/colorselect';

type TableProps = {
  header: string[] | null;
  rows: Array<{
    id: number;
    data: string[];
  }>;
  editableColumns?: number[] | null;
  onChange?: (rowIndex: number, colIndex: number, newValue: string) => void;
  cellWidths?: Array<string | number>;
  colorSelect: boolean;
};

const GridTable: React.FC<TableProps> = ({
  header,
  rows,
  editableColumns = [],
  onChange,
  cellWidths = [],
  colorSelect,
}) => {
  const [localRows, setLocalRows] = useState(rows);

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const updated = [...localRows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      data: [...updated[rowIndex].data],
    };
    updated[rowIndex].data[colIndex] = newValue;
    updated[rowIndex].data[4] = (Number(updated[rowIndex].data[2]) + Number(updated[rowIndex].data[3])).toString();
    setLocalRows(updated);
    onChange?.(rowIndex, colIndex, newValue);
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
                align="center"
                size="small"
                sx={{
                  border: '1px solid black',
                  whiteSpace: 'nowrap',
                  color: colorSelect && 0 < index && index < 11 ? 'white' : 'black',
                  bgcolor: colorSelect && 0 < index && index < 11 ? 'blue' : 'white',
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
                    align="center"
                    sx={{
                      border: '1px solid black',
                      whiteSpace: 'nowrap',
                      width,
                      height: 45,
                      bgcolor: getBackgroundColor(rowIndex, colIndex, colorSelect),
                    }}
                    size="small"
                  >
                    {isEditable && (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) ? (
                      <TextField
                        variant="standard"
                        value={cell}
                        type="number"
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        sx={{
                          '& .MuiInputBase-input': {
                            textAlign: 'center',
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
