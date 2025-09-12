'use client';

import { Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';

import { toISOString } from '../../_lib/date-conversion';
import { ShukoTableValues } from '../_lib/types';

export const ShukoListTable = (props: {
  datas: ShukoTableValues[];
  onSelectionChange: Dispatch<SetStateAction<number[]>>;
}) => {
  const { datas, onSelectionChange } = props;

  const [selected, setSelected] = useState<number[]>([]);

  const handleSelect = (index: number) => {
    const newSelected = selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index];

    setSelected(newSelected);
    onSelectionChange(newSelected);
  };

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small">
        <TableHead sx={{ bgcolor: 'primary.light' }}>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={datas && selected.length > 0 && selected.length < datas.length}
                checked={datas && datas.length > 0 && selected.length === datas.length}
                onChange={(e) => {
                  const newSelected = e.target.checked && datas ? datas.map((row, index) => index) : [];
                  setSelected(newSelected);
                  onSelectionChange(newSelected);
                }}
              />
            </TableCell>
            <TableCell align="center">受注番号</TableCell>
            <TableCell align="left">出庫場所</TableCell>
            <TableCell align="left">出庫日時</TableCell>
            <TableCell align="left">公演名</TableCell>
            <TableCell align="left">顧客名</TableCell>
            <TableCell align="left">出庫機材担当者</TableCell>
            <TableCell align="center">スタンバイ</TableCell>
            <TableCell align="center">チェック</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow key={index}>
              <TableCell padding="checkbox">
                <Checkbox checked={selected.includes(index)} onChange={() => handleSelect(index)} />
              </TableCell>
              <TableCell align="center">{row.juchuHeadId}</TableCell>
              <TableCell align="left"></TableCell>
              <TableCell align="left">{toISOString(row.shukoDat)}</TableCell>
              <TableCell align="left">{row.koenNam}</TableCell>
              <TableCell align="left">{row.kokyakuNam}</TableCell>
              <TableCell align="left"></TableCell>
              <TableCell align="center"></TableCell>
              <TableCell align="center"></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
