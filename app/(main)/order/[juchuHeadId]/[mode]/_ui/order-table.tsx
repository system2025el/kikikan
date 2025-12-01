'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Button, Collapse, IconButton, Radio, RadioGroup, Typography } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import { grey } from '@mui/material/colors';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';

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
  selectEq: number | null;
  onEqSelectionChange: (selectedId: number) => void;
  handleClickEqOrderName: (row: EqTableValues) => void;
};

export const OrderEqTable: React.FC<OrderEqTableProps> = ({
  orderEqRows,
  edit,
  selectEq,
  onEqSelectionChange,
  handleClickEqOrderName,
}) => {
  const router = useRouter();

  const [rows, setRows] = useState(orderEqRows);

  const mode = edit ? 'edit' : 'view';

  const handleSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    onEqSelectionChange(Number(event.target.value));
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
              <TableCell padding="none" />
              <TableCell padding="none" />
              <TableCell align="left">受注明細名</TableCell>
              <TableCell align="left">出庫</TableCell>
              <TableCell align="left">入庫</TableCell>
              <TableCell align="right">仕込</TableCell>
              <TableCell align="right">RH</TableCell>
              <TableCell align="right">GP</TableCell>
              <TableCell align="right">本番</TableCell>
              <TableCell align="right">日数</TableCell>
              <TableCell align="right">小計金額</TableCell>
              {/* <TableCell /> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows!.map((row, index) => (
              <TableRow hover key={row.juchuKizaiHeadId}>
                <TableCell padding="checkbox">
                  <Radio
                    name="table-radio"
                    checked={selectEq === row.juchuKizaiHeadId}
                    value={row.juchuKizaiHeadId}
                    onChange={handleSelect}
                  />
                </TableCell>
                <TableCell padding="none">{index + 1}</TableCell>
                <TableCell align={'left'}>
                  <Button
                    onClick={() => handleClickEqOrderName(row)}
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
                      textTransform: 'none',
                      ...(row.juchuKizaiHeadKbn !== 1 && { pl: 2 }),
                    }}
                  >
                    {row.headNam}
                  </Button>
                </TableCell>
                <TableCell align="left">
                  {`K ${row.kicsShukoDat ? toJapanTimeString(new Date(row.kicsShukoDat)) : 'ー'}`}
                  <br />
                  {`Y ${row.yardShukoDat ? toJapanTimeString(new Date(row.yardShukoDat)) : 'ー'}`}
                </TableCell>
                <TableCell align="left">
                  {`K ${row.kicsNyukoDat ? toJapanTimeString(new Date(row.kicsNyukoDat)) : 'ー'}`}
                  <br />
                  {`Y ${row.yardNyukoDat ? toJapanTimeString(new Date(row.yardNyukoDat)) : 'ー'}`}
                </TableCell>
                <TableCell align="right">{row.sikomibi}</TableCell>
                <TableCell align="right">{row.rihabi}</TableCell>
                <TableCell align="right">{row.genebi}</TableCell>
                <TableCell align="right">{row.honbanbi}</TableCell>
                <TableCell align="right">{row.juchuHonbanbiCalcQty}</TableCell>
                <TableCell align="right">{row.shokei && `¥${row.shokei.toLocaleString()}`}</TableCell>
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
  orderVehicleRows: VehicleTableValues[];
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
    <TableContainer sx={{ overflow: 'auto' }}>
      <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="small" padding="none">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={rows && selected.length > 0 && selected.length < rows.length}
                checked={rows && rows.length > 0 && selected.length === rows.length}
                onChange={(e) => {
                  const newSelected = e.target.checked && rows ? rows.map((row) => row.sharyoHeadId) : [];
                  setSelected(newSelected);
                  onVehicleSelectionChange(newSelected);
                }}
              />
            </TableCell>
            <TableCell padding="none" />
            <TableCell align="left">車両明細名</TableCell>
            <TableCell align="left">場所</TableCell>
            <TableCell align="left">出庫</TableCell>
            <TableCell align="left">入庫</TableCell>
            <TableCell align="left">日付</TableCell>
            <TableCell align="left">車両メモ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows!.map((row, index) => (
            <TableRow hover key={row.sharyoHeadId}>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={selected.includes(row.sharyoHeadId)}
                  onChange={() => handleSelect(row.sharyoHeadId)}
                />
              </TableCell>
              <TableCell padding="none">{index + 1}</TableCell>
              <TableCell align="left">
                <Button
                  href={`/vehicle-order-detail/${row.juchuHeadId}/${row.sharyoHeadId}/view`}
                  variant="text"
                  sx={{
                    color: 'primary',
                    whiteSpace: 'nowrap',
                    justifyContent: 'start',
                  }}
                >
                  {row.sharyoHeadNam}
                </Button>
              </TableCell>
              <TableCell align="left">{row.basho}</TableCell>
              <TableCell align="left">{row.shubetsuId === 1 ? row.shubetuNam : ' - '}</TableCell>
              <TableCell align="left">{row.shubetsuId === 2 ? row.shubetuNam : ' - '}</TableCell>
              <TableCell align="left">{row.nyushukoDat}</TableCell>
              <TableCell align="left">{row.headMem}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
