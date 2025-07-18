'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Collapse, IconButton, Typography } from '@mui/material';
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

export type Row = {
  id: number;
  name: string;
  status: string;
  issue: string;
  return: string;
  preparation: number | undefined;
  rh: number | undefined;
  gp: number | undefined;
  actual: number | undefined;
  days: number | undefined;
  price: number | undefined;
  caveat: string;
  juchuKizaiHeadKbn: number;
};

type OrderEqTableProps = {
  orderRows: Row[];
  edit: boolean;
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
};

export const OrderEqTable: React.FC<OrderEqTableProps> = ({ orderRows, edit, onSelectionChange }) => {
  const [rows, setRows] = useState(orderRows);
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
      <TableContainer sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small">
          <TableHead sx={{ bgcolor: 'primary.light' }}>
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
              <TableCell padding="none" />
              <TableCell align="left">機材明細名</TableCell>
              <TableCell align="left">作業ステータス</TableCell>
              <TableCell align="left">出庫</TableCell>
              <TableCell align="left">入庫</TableCell>
              <TableCell align="right">仕込</TableCell>
              <TableCell align="right">RH</TableCell>
              <TableCell align="right">GP</TableCell>
              <TableCell align="right">本番</TableCell>
              <TableCell align="right">日数</TableCell>
              <TableCell align="right">小計金額</TableCell>
              <TableCell align="left">警告</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow hover key={row.id}>
                <TableCell padding="checkbox">
                  <Checkbox checked={selected.includes(row.id)} onChange={() => handleSelect(row.id)} />
                </TableCell>
                <TableCell padding="none">{index + 1}</TableCell>
                <TableCell align="left">
                  <Button
                    href={
                      row.juchuKizaiHeadKbn === 1
                        ? '/order/equipment-order-detail'
                        : row.juchuKizaiHeadKbn === 2
                          ? '/order/equipment-return-order-detail'
                          : '/order/equipment-keep-order-detail'
                    }
                    variant="text"
                    sx={{
                      color: row.juchuKizaiHeadKbn === 1 ? 'primary' : row.juchuKizaiHeadKbn === 2 ? 'red' : 'green',
                      whiteSpace: 'nowrap',
                      justifyContent: 'start',
                    }}
                  >
                    {row.name}
                  </Button>
                </TableCell>
                <TableCell align="left">{row.status}</TableCell>
                <TableCell align="left">{row.issue}</TableCell>
                <TableCell align="left">{row.return}</TableCell>
                <TableCell align="right">{row.preparation}</TableCell>
                <TableCell align="right">{row.rh}</TableCell>
                <TableCell align="right">{row.gp}</TableCell>
                <TableCell align="right">{row.actual}</TableCell>
                <TableCell align="right">{row.days}</TableCell>
                <TableCell align="right">{row.price}</TableCell>
                <TableCell align="left" color="red">
                  {row.caveat}
                </TableCell>
                <TableCell>
                  <Box display={'flex'}>
                    <IconButton onClick={() => moveRow(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
