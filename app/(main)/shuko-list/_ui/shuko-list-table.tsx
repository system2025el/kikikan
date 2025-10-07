'use client';

import { Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';

import { toISOString, toJapanTimeString } from '../../_lib/date-conversion';
import { ShukoTableValues } from '../_lib/types';

export const ShukoListTable = (props: {
  datas: ShukoTableValues[];
  onSelectionChange: Dispatch<SetStateAction<ShukoTableValues[]>>;
}) => {
  const { datas, onSelectionChange } = props;

  const [selected, setSelected] = useState<ShukoTableValues[]>([]);

  const handleSelect = (row: ShukoTableValues) => {
    const newSelected = selected.includes(row) ? selected.filter((item) => item !== row) : [...selected, row];

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
                  const newSelected = e.target.checked && datas ? datas.map((row) => row) : [];
                  setSelected(newSelected);
                  onSelectionChange(newSelected);
                }}
              />
            </TableCell>
            <TableCell align="center">受注番号</TableCell>
            <TableCell align="left">出庫場所</TableCell>
            <TableCell align="left">出庫日時</TableCell>
            <TableCell align="left">公演名</TableCell>
            <TableCell align="left">機材明細名</TableCell>
            <TableCell align="left">顧客名</TableCell>
            <TableCell align="left">課</TableCell>
            <TableCell align="center">スタンバイ</TableCell>
            <TableCell align="center">チェック</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow key={index} sx={{ whiteSpace: 'nowrap' }}>
              <TableCell padding="checkbox">
                <Checkbox checked={selected.includes(row)} onChange={() => handleSelect(row)} />
              </TableCell>
              <TableCell align="center">{row.juchuHeadId}</TableCell>
              <TableCell align="left">{row.nyushukoBashoId === 1 ? 'K' : 'Y'}</TableCell>
              <TableCell align="left">{toJapanTimeString(row.nyushukoDat)}</TableCell>
              <TableCell align="left">{row.koenNam}</TableCell>
              <TableCell align="left">{row.headNamv}</TableCell>
              <TableCell align="left">{row.kokyakuNam}</TableCell>
              <TableCell align="left">{row.sectionNamv}</TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  href={`shuko-list/shuko-detail/${row.juchuHeadId}/${row.nyushukoBashoId}/${toJapanTimeString(row.nyushukoDat, '-')}/10`}
                >
                  {row.sstbSagyoStsId === 0
                    ? '-'
                    : row.sstbSagyoStsId === 11
                      ? '△'
                      : row.sstbSagyoStsId === 12
                        ? '〇'
                        : ''}
                </Button>
              </TableCell>
              <TableCell align="center">
                <Button
                  variant="text"
                  size="small"
                  href={`shuko-list/shuko-detail/${row.juchuHeadId}/${row.nyushukoBashoId}/${toJapanTimeString(row.nyushukoDat, '-')}/20`}
                >
                  {row.schkSagyoStsId === 0
                    ? '-'
                    : row.schkSagyoStsId === 21
                      ? '△'
                      : row.schkSagyoStsId === 22
                        ? '〇'
                        : ''}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
