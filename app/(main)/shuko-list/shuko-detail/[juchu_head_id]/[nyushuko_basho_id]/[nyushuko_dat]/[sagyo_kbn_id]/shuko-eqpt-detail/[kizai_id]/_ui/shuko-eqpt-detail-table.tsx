'use client';

import { Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey } from '@mui/material/colors';
import { Dispatch, SetStateAction } from 'react';

import { toJapanDateString } from '@/app/(main)/_lib/date-conversion';

import { ShukoEqptDetailTableValues } from '../_lib/types';

export const ShukoEqptDetailTable = (props: {
  datas: ShukoEqptDetailTableValues[];
  selected: number[];
  setSelected: Dispatch<SetStateAction<number[]>>;
}) => {
  const { datas, selected, setSelected } = props;

  const handleSelect = (index: number) => {
    const newSelected = selected.includes(index) ? selected.filter((item) => item !== index) : [...selected, index];
    setSelected(newSelected);
  };
  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small">
        <TableHead sx={{ bgcolor: 'primary.light' }}>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell padding="none" />
            <TableCell padding="checkbox">
              <Checkbox
                indeterminate={datas && selected.length > 0 && selected.length < datas.length}
                checked={datas && datas.length > 0 && selected.length === datas.length}
                onChange={(e) => {
                  const newSelected = e.target.checked && datas ? datas.map((row, index) => index) : [];
                  setSelected(newSelected);
                }}
              />
            </TableCell>
            <TableCell align="left">EL NO.</TableCell>
            <TableCell align="left">RFIDタグID</TableCell>
            <TableCell align="left">ステータス</TableCell>
            <TableCell align="left">メモ</TableCell>
            <TableCell align="left">入出庫拠点</TableCell>
            <TableCell align="left">読取日時</TableCell>
            <TableCell align="left">担当者</TableCell>
            <TableCell align="left">無効</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow key={row.rfidTagId} sx={{ backgroundColor: row.rfidDelFlg === 1 ? grey[300] : 'white' }}>
              <TableCell align="center" padding="none">
                {index + 1}
              </TableCell>
              <TableCell padding="checkbox">
                <Checkbox checked={selected.includes(index)} onChange={() => handleSelect(index)} />
              </TableCell>
              <TableCell align="left">{row.rfidElNum}</TableCell>
              <TableCell align="left">{row.rfidTagId}</TableCell>
              <TableCell align="left">{row.rfidStsNam}</TableCell>
              <TableCell align="left">{row.rfidMem}</TableCell>
              <TableCell align="left">{row.nyushukoBashoId === 1 ? 'K' : 'Y'}</TableCell>
              <TableCell align="left">{row.rfidDat && toJapanDateString(row.rfidDat)}</TableCell>
              <TableCell align="left">{row.rfidUser}</TableCell>
              <TableCell align="left">{row.rfidDelFlg === 1 && '無効'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
