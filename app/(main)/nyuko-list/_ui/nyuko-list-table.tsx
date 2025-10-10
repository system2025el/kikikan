'use client';

import { Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Dispatch, SetStateAction, useState } from 'react';

import { toISOString, toJapanTimeString } from '../../_lib/date-conversion';
import { NyukoTableValues } from '../_lib/types';

export const NyukoListTable = (props: { datas: NyukoTableValues[] }) => {
  const { datas } = props;

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh' }}>
      <Table stickyHeader size="small">
        <TableHead sx={{ bgcolor: 'primary.light' }}>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="center">受注番号</TableCell>
            <TableCell align="left">入庫場所</TableCell>
            <TableCell align="left">入庫日時</TableCell>
            <TableCell align="left">公演名</TableCell>
            <TableCell align="left">機材明細名</TableCell>
            <TableCell align="left">顧客名</TableCell>
            <TableCell align="left">課</TableCell>
            <TableCell align="center">チェック</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow key={index} sx={{ whiteSpace: 'nowrap' }}>
              <TableCell align="center">{row.juchuHeadId}</TableCell>
              <TableCell align="left">{row.nyushukoBashoId === 1 ? 'K' : 'Y'}</TableCell>
              <TableCell align="left">{toJapanTimeString(row.nyushukoDat)}</TableCell>
              <TableCell align="left">{row.koenNam}</TableCell>
              <TableCell align="left">{row.headNamv}</TableCell>
              <TableCell align="left">{row.kokyakuNam}</TableCell>
              <TableCell align="left">{row.sectionNamv}</TableCell>
              <TableCell align="center">
                {row.nchkSagyoStsId ? (
                  <Button
                    variant="text"
                    size="small"
                    href={`nyuko-list/nyuko-detail/${row.juchuHeadId}/${row.juchuKizaiHeadIdv}/${row.nyushukoBashoId}/${toJapanTimeString(row.nyushukoDat, '-')}`}
                  >
                    {row.nchkSagyoStsId === 0
                      ? 'ー'
                      : row.nchkSagyoStsId === 31
                        ? '△'
                        : row.nchkSagyoStsId === 32
                          ? '〇'
                          : ''}
                  </Button>
                ) : (
                  ''
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
