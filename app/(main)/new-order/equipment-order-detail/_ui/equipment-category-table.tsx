'use client';

import Box from '@mui/material/Box';
import { lightBlue } from '@mui/material/colors';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import { visuallyHidden } from '@mui/utils';
import * as React from 'react';

import { Cate, eqCategories } from '../_lib/eqdata';

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
  console.log(props.selected);
  return (
    <TableContainer component={Paper} sx={{ width: '38%', height: 600 }}>
      <Table stickyHeader>
        <EnhancedTableHead />
        <TableBody>
          {eqCategories.map((row) => {
            return (
              <TableRow
                hover
                onClick={() => props.handleClick(row.id)}
                tabIndex={-1}
                key={row.id}
                sx={{ cursor: 'pointer', bgcolor: props.selected === row.id ? lightBlue[300] : '' }}
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
