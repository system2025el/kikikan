'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Collapse, IconButton } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { grey } from '@mui/material/colors';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';
import { useState } from 'react';

type Header = {
  key: string;
  label: string;
};

type Row = {
  id: string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

type Cell = {
  id: number;
  parent: Row;
  child: Row[];
};

type TableProps = {
  headers: Header[];
  datas: Row[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
};

type RowProps = {
  headers: Header[];
  row: Cell;
  index: number;
  length: number;
  selected: (string | number)[];
  handleSelect: (id: string | number) => void;
  moveRow: (index: number, direction: number) => void;
};

// const test = (datas: Row[]) => {
//   const cells: Cell[] = [];
//   for (let i = 1; i < 100; i++) {
//     const test: Cell = {
//       id: i,
//       parent: datas[0],
//       child: [datas[1], datas[2], datas[3], datas[4]],
//     };
//     cells.push(test);
//   }
//   return cells;
// };

export const SelectTable: React.FC<TableProps> = ({ headers, datas, onSelectionChange }) => {
  const cells: Cell[] = [
    {
      id: 1,
      parent: datas[0],
      child: [datas[1]],
    },
    {
      id: 2,
      parent: datas[2],
      child: [datas[3], datas[4]],
    },
  ];

  //const testRow: Cell[] = test(datas);

  const [rows, setRows] = useState(cells);
  const [selected, setSelected] = useState<(string | number)[]>([]);

  const handleSelect = (id: string | number) => {
    const newSelected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];

    setSelected(newSelected);
    onSelectionChange?.(newSelected);
  };

  const moveRow = (index: number, direction: number) => {
    console.log(index);
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= rows.length) return;

    const updatedRows = [...rows];
    [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
    setRows(updatedRows);
  };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer sx={{ overflow: 'auto', bgcolor: grey[200] }}>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small">
          <TableHead sx={{ bgcolor: grey[400] }}>
            <TableRow sx={{ whiteSpace: 'nowrap' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selected.length > 0 && selected.length < rows.length}
                  checked={rows.length > 0 && selected.length === rows.length}
                  onChange={(e) => {
                    const newSelected = e.target.checked ? rows.map((row) => row.id) : [];
                    setSelected(newSelected);
                    onSelectionChange?.(newSelected);
                  }}
                />
              </TableCell>
              <TableCell />
              {headers.map((header) => (
                <TableCell key={header.key}>{header.label}</TableCell>
              ))}
              <TableCell />
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <Row
                key={row.id}
                headers={headers}
                row={row}
                index={index}
                length={rows.length}
                selected={selected}
                handleSelect={handleSelect}
                moveRow={moveRow}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const Row = (props: RowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <TableRow hover>
        <TableCell padding="checkbox">
          <Checkbox checked={props.selected.includes(props.row.id)} onChange={() => props.handleSelect(props.row.id)} />
        </TableCell>
        <TableCell>
          <IconButton onClick={handleClick}>{isExpanded ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
        </TableCell>
        {props.headers.map((header) => (
          <TableCell key={header.key} align={typeof props.row.parent[header.key] === 'number' ? 'right' : 'left'}>
            {props.row.parent[header.key]}
          </TableCell>
        ))}
        <TableCell>
          <IconButton onClick={() => props.moveRow(props.index, -1)} disabled={props.index === 0}>
            ↑
          </IconButton>
        </TableCell>
        <TableCell>
          <IconButton onClick={() => props.moveRow(props.index, 1)} disabled={props.index === props.length - 1}>
            ↓
          </IconButton>
        </TableCell>
      </TableRow>
      {props.row.child.map((row) => (
        <TableRow key={row.id}>
          <TableCell padding="checkbox" sx={!isExpanded ? styles.closeCell : undefined}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
          </TableCell>
          <TableCell sx={!isExpanded ? styles.closeCell : undefined}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
          </TableCell>
          {props.headers.map((header) => (
            <TableCell
              key={header.key}
              sx={!isExpanded ? styles.closeCell : undefined}
              align={typeof row[header.key] === 'number' ? 'right' : 'left'}
            >
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                {row[header.key]}
              </Collapse>
            </TableCell>
          ))}
          <TableCell sx={!isExpanded ? styles.closeCell : undefined}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
          </TableCell>
          <TableCell sx={!isExpanded ? styles.closeCell : undefined}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit></Collapse>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  cell: {},
  closeCell: {
    border: 'none',
    paddingTop: 0,
    paddingBottom: 0,
  },
};
