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

import { toISOString } from '@/app/(main)/_lib/date-conversion';

import { EqTableValues, VehicleTableValues } from '../_lib/types';

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
  orderEqRows: EqTableValues[] | undefined;
  edit: boolean;
  onEqSelectionChange: (selectedIds: number[]) => void;
};

export const OrderEqTable: React.FC<OrderEqTableProps> = ({ orderEqRows, edit, onEqSelectionChange }) => {
  const [rows, setRows] = useState(orderEqRows);
  const [selected, setSelected] = useState<number[]>([]);

  const mode = edit ? 'edit' : 'view';

  const handleSelect = (id: number) => {
    const newSelected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];

    setSelected(newSelected);
    onEqSelectionChange(newSelected);
  };

  // const moveRow = (index: number, direction: number) => {
  //   console.log(index);
  //   const newIndex = index + direction;
  //   if (newIndex < 0 || newIndex >= rows.length) return;

  //   const updatedRows = [...rows];
  //   [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
  //   setRows(updatedRows);
  // };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small">
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow sx={{ whiteSpace: 'nowrap' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={rows && selected.length > 0 && selected.length < rows.length}
                  checked={rows && rows.length > 0 && selected.length === rows.length}
                  onChange={(e) => {
                    const newSelected = e.target.checked && rows ? rows.map((row) => row.juchuKizaiHeadId) : [];
                    setSelected(newSelected);
                    onEqSelectionChange(newSelected);
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
              {/* <TableCell /> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows!.map((row, index) => (
              <TableRow hover key={row.juchuKizaiHeadId}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(row.juchuKizaiHeadId)}
                    onChange={() => handleSelect(row.juchuKizaiHeadId)}
                  />
                </TableCell>
                <TableCell padding="none">{index + 1}</TableCell>
                <TableCell align={'left'}>
                  <Button
                    href={
                      row.juchuKizaiHeadKbn === 1
                        ? `/eq-main-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${mode}`
                        : row.juchuKizaiHeadKbn === 2
                          ? `/eq-return-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${row.oyaJuchuKizaiHeadId}/${mode}`
                          : row.juchuKizaiHeadKbn === 3
                            ? `/eq-keep-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${row.oyaJuchuKizaiHeadId}/${mode}`
                            : `/eq-main-order-detail/${row.juchuHeadId}/${row.juchuKizaiHeadId}/${mode}`
                    }
                    variant="text"
                    sx={{
                      color:
                        row.juchuKizaiHeadKbn === 1
                          ? 'primary'
                          : row.juchuKizaiHeadKbn === 2
                            ? 'red'
                            : row.juchuKizaiHeadKbn === 3
                              ? 'green'
                              : 'primary',
                      whiteSpace: 'nowrap',
                      justifyContent: 'start',
                      ...(row.juchuKizaiHeadKbn !== 1 && { pl: 2 }),
                    }}
                  >
                    {row.headNam}
                  </Button>
                </TableCell>
                <TableCell align="left">{row.sagyoStaNam}</TableCell>
                <TableCell align="left">{row.shukoDat ? toISOString(new Date(row.shukoDat)) : ''}</TableCell>
                <TableCell align="left">{row.nyukoDat ? toISOString(new Date(row.nyukoDat)) : ''}</TableCell>
                <TableCell align="right">{row.sikomibi}</TableCell>
                <TableCell align="right">{row.rihabi}</TableCell>
                <TableCell align="right">{row.genebi}</TableCell>
                <TableCell align="right">{row.honbanbi}</TableCell>
                <TableCell align="right">{row.juchuHonbanbiCalcQty}</TableCell>
                <TableCell align="right">{row.shokei}</TableCell>
                <TableCell align="left" color="red">
                  {row.keikoku}
                </TableCell>
                {/* <TableCell>
                  <Box display={'flex'}>
                    <IconButton onClick={() => moveRow(index, -1)} disabled={index === 0}>
                      <ArrowUpwardIcon fontSize="small" />
                    </IconButton>
                    <IconButton onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1}>
                      <ArrowDownwardIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

type OrderVehicleTableProps = {
  orderVehicleRows: VehicleTableValues[] | undefined;
  onVehicleSelectionChange: (selectedIds: number[]) => void;
};

export const OrderVehicleTable: React.FC<OrderVehicleTableProps> = ({ orderVehicleRows, onVehicleSelectionChange }) => {
  const [rows, setRows] = useState(orderVehicleRows);
  const [selected, setSelected] = useState<number[]>([]);

  const handleSelect = (id: number) => {
    const newSelected = selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id];

    setSelected(newSelected);
    onVehicleSelectionChange(newSelected);
  };

  // const moveRow = (index: number, direction: number) => {
  //   console.log(index);
  //   const newIndex = index + direction;
  //   if (newIndex < 0 || newIndex >= rows.length) return;

  //   const updatedRows = [...rows];
  //   [updatedRows[index], updatedRows[newIndex]] = [updatedRows[newIndex], updatedRows[index]];
  //   setRows(updatedRows);
  // };

  return (
    <Paper sx={{ width: '100%', mb: 2 }}>
      <TableContainer sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small">
          <TableHead sx={{ bgcolor: 'primary.light' }}>
            <TableRow sx={{ whiteSpace: 'nowrap' }}>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={rows && selected.length > 0 && selected.length < rows.length}
                  checked={rows && rows.length > 0 && selected.length === rows.length}
                  onChange={(e) => {
                    const newSelected = e.target.checked && rows ? rows.map((row) => row.juchuSharyoHeadId) : [];
                    setSelected(newSelected);
                    onVehicleSelectionChange(newSelected);
                  }}
                />
              </TableCell>
              <TableCell padding="none" />
              <TableCell align="left">車両明細名</TableCell>
              <TableCell align="left">区分</TableCell>
              <TableCell align="left">日付</TableCell>
              <TableCell align="left">車両メモ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows!.map((row, index) => (
              <TableRow hover key={row.juchuSharyoHeadId}>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.includes(row.juchuSharyoHeadId)}
                    onChange={() => handleSelect(row.juchuSharyoHeadId)}
                  />
                </TableCell>
                <TableCell padding="none">{index + 1}</TableCell>
                <TableCell align="left">
                  <Button
                    href={'/order/vehicle-order-detail'}
                    variant="text"
                    sx={{
                      color: 'primary',
                      whiteSpace: 'nowrap',
                      justifyContent: 'start',
                    }}
                  >
                    {row.headNam}
                  </Button>
                </TableCell>
                <TableCell align="left">{row.kbn}</TableCell>
                <TableCell align="left">{row.dat ? toISOString(new Date(row.dat)) : ''}</TableCell>
                <TableCell align="left">{row.mem}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
