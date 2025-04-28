import { BorderColor } from '@mui/icons-material';
import { colors, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import React, { useState } from 'react';

type TableProps = {
  header: string[] | null;
  rows: Array<{
    id: number;
    data: string[];
  }>;
  editableColumns?: number[] | null;
  onChange?: (rowIndex: number, colIndex: number, newValue: string) => void;
};

const GridTable: React.FC<TableProps> = ({ header, rows, editableColumns = [], onChange }) => {
  const [localRows, setLocalRows] = useState(rows);

  const handleCellChange = (rowIndex: number, colIndex: number, newValue: string) => {
    const updated = [...localRows];
    updated[rowIndex] = {
      ...updated[rowIndex],
      data: [...updated[rowIndex].data],
    };
    updated[rowIndex].data[colIndex] = newValue;
    setLocalRows(updated);
    onChange?.(rowIndex, colIndex, newValue);
  };

  return (
    <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
      <Table>
        <TableHead>
          <TableRow>
            {header?.map((date, index) => (
              <TableCell key={index} align="center" sx={{ border: '1px solid black', whiteSpace: 'nowrap' }}>
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

                return (
                  <TableCell
                    key={colIndex}
                    align="center"
                    sx={{
                      border: '1px solid black',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isEditable ? (
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        style={{
                          border: 'none',
                          textAlign: 'center',
                          outline: 'none',
                          whiteSpace: 'nowrap',
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
