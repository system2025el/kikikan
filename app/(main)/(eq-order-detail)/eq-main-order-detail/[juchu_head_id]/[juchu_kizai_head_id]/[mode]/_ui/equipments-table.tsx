'use client';

import { Box, Divider } from '@mui/material';
import Checkbox from '@mui/material/Checkbox';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import React, { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { EqptSelection } from './equipment-selection-dailog';

export const EqptTable = ({
  bumonId,
  eqSelected,
  datas,
  searching,
  isLoading,
  handleSelect,
}: {
  eqSelected: readonly number[];
  bumonId: number;
  datas: EqptSelection[] | undefined;
  searching: boolean;
  isLoading: boolean;
  handleSelect: (event: React.MouseEvent<unknown>, id: number) => void;
}) => {
  /* useState ---------------------------------- */

  // 表示するリスト
  const list = useMemo(() => {
    if (!datas) {
      return [];
    }
    // 検索してる時
    if (searching) {
      return datas;
    }
    // 部門でフィルタリングする場合
    return datas.filter((eq) => eq.bumonId === bumonId);
  }, [datas, searching, bumonId]);

  return (
    <TableContainer component={Paper} variant="outlined" square sx={{ height: '65vh' }}>
      {isLoading ? (
        <Loading />
      ) : (
        <Table stickyHeader padding="none">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>機材名</TableCell>
              <TableCell>在庫場所</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {list!.map((row, index) => {
              const isItemSelected = eqSelected.includes(row.kizaiId);
              const labelId = `enhanced-table-checkbox-${index}`;
              const nextRow = list![index + 1];

              const rowsToRender = [];

              rowsToRender.push(
                <TableRow
                  hover
                  onClick={(event) => handleSelect(event, row.kizaiId)}
                  role="checkbox"
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.kizaiId}
                  selected={isItemSelected}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" checked={isItemSelected} />
                  </TableCell>
                  <TableCell component="th" id={labelId} scope="row" padding="none">
                    {row.kizaiNam}
                  </TableCell>
                  <TableCell>{row.shozokuNam}</TableCell>
                </TableRow>
              );

              // 次のkizaiGrpCodが異なるなら区切り行を追加
              if (!nextRow || row.kizaiGrpCod !== nextRow.kizaiGrpCod) {
                rowsToRender.push(
                  <TableRow key={`divider-${index}`}>
                    <TableCell colSpan={3}>
                      <Box height={20} width={'100%'} alignContent={'center'}>
                        <Divider sx={{ borderStyle: 'dashed', borderColor: 'CaptionText' }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }

              return rowsToRender;
            })}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};
