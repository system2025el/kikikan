'use client';

import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useState } from 'react';
import React from 'react';

import { eqCategories, eqData, eqList } from '../_lib/eqdata';

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

export const EquipmentTable = (props: { eqSelected: readonly number[]; setSelectedEq: Function }) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof eqData>('id');

  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = props.eqSelected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(props.eqSelected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(props.eqSelected.slice(1));
    } else if (selectedIndex === props.eqSelected.length - 1) {
      newSelected = newSelected.concat(props.eqSelected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        props.eqSelected.slice(0, selectedIndex),
        props.eqSelected.slice(selectedIndex + 1)
      );
    }
    props.setSelectedEq(newSelected);
  };

  const visibleRows = React.useMemo(() => [...eqList].sort(getComparator(order, orderBy)), [order, orderBy]);

  console.log(props.eqSelected);
  return (
    <TableContainer component={Paper} sx={{ width: '60%', height: 600 }}>
      <Table>
        <EnhancedTableHead numSelected={props.eqSelected.length} />
        <TableBody>
          {visibleRows.map((row, index) => {
            const isItemSelected = props.eqSelected.includes(row.id);
            const labelId = `enhanced-table-checkbox-${index}`;

            return (
              <TableRow
                hover
                onClick={(event) => handleClick(event, row.id)}
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
