'use client';

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
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { IdoEqptSelection } from '../_lib/types';

/**
 * 機材選択の機材テーブル
 * @param param0
 * @returns 機材選択の機材テーブルコンポーネント
 */
export const IdoEqptTable = ({
  bumonId,
  selectedEqpt,
  datas,
  searching,
  isLoading,
  handleSelect,
}: {
  selectedEqpt: readonly number[];
  bumonId: number;
  datas: IdoEqptSelection[] | undefined;
  searching: boolean;
  isLoading: boolean;
  handleSelect: (event: React.MouseEvent<unknown>, id: number) => void;
}) => {
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
    <TableContainer component={Paper} variant="outlined" square sx={{ height: '75vh' }}>
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
              const isItemSelected = selectedEqpt.includes(row.kizaiId);
              const labelId = `enhanced-table-checkbox-${index}`;
              const nextRow = list![index + 1];

              const rows = [];

              rows.push(
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
                rows.push(
                  <TableRow key={`divider-${index}`}>
                    <TableCell colSpan={3}>
                      <Box height={10} width={'100%'} alignContent={'center'}>
                        <Divider sx={{ borderStyle: 'dashed', borderColor: 'CaptionText', borderBottomWidth: 2 }} />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }
              return rows;
            })}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};
