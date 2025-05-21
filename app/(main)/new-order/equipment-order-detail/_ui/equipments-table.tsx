'use client';

import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React from 'react';

import { eqData, eqList } from '../_lib/eqdata';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof number | string>(
  order: Order,
  orderBy: Key
): (a: { [key in Key]: number | string }, b: { [key in Key]: number | string }) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

type HeadCell = {
  id: keyof eqData;
  label: string;
};

const headCells: readonly HeadCell[] = [
  {
    id: 'id',
    label: '機材名',
  },
];

type EnhancedTableProps = {
  numSelected: number;
};

const EnhancedTableHead = (props: EnhancedTableProps) => {
  const { numSelected } = props;

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox color="primary" />
        </TableCell>
        <TableCell>機材名</TableCell>
      </TableRow>
    </TableHead>
  );
};

export const EquipmentTable = (props: {
  eqSelected: readonly number[];
  categoryID: number;
  handleSelect: (event: React.MouseEvent<unknown>, id: number) => void;
}) => {
  const { eqSelected, handleSelect, categoryID } = props;
  return (
    <TableContainer component={Paper} sx={{ width: '60%', height: 600 }}>
      <Table>
        <EnhancedTableHead numSelected={eqSelected.length} />
        <TableBody>
          {eqList
            .filter((eq) => eq.cateId === categoryID)
            .map((row, index) => {
              const isItemSelected = eqSelected.includes(row.id);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  onClick={(event) => handleSelect(event, row.id)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.id}
                  selected={isItemSelected}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" checked={isItemSelected} />
                  </TableCell>
                  <TableCell component="th" id={labelId} scope="row" padding="none">
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
