'use client';

import { alpha, useTheme } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';

import { eqCategories } from '../_lib/eqdata';

const EnhancedTableHead = () => {
  return (
    <TableHead>
      <TableRow>
        <TableCell>部門</TableCell>
      </TableRow>
    </TableHead>
  );
};

export const EquipmentCategoriesTable = (props: { selected: number; handleClick: (id: number) => void }) => {
  const { selected, handleClick } = props;
  const theme = useTheme();
  const selectedColor = alpha(theme.palette.primary.light, 0.4);

  return (
    <TableContainer component={Paper} variant="outlined" square sx={{ height: '65vh' }}>
      <Table stickyHeader padding="none">
        <EnhancedTableHead />
        <TableBody>
          {eqCategories.map((row) => {
            return (
              <TableRow
                hover
                onClick={() => handleClick(row.id)}
                tabIndex={-1}
                key={row.id}
                sx={{ cursor: 'pointer', bgcolor: selected === row.id ? selectedColor : '' }}
              >
                <TableCell component="th" scope="row">
                  {row.name}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
