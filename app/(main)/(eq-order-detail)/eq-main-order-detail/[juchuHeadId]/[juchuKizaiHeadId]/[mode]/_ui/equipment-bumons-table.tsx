'use client';

import { alpha, useTheme } from '@mui/material';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

/** 機材選択の部門一覧の1行 */
export type EqptBumon = {
  tblDspNum: number;
  id: number;
  label: string;
};

/**
 * 機材選択の部門選択テーブル
 * 部門一覧は機材一覧と一緒に機材選択ダイアログが取得して渡す（取得のエラー表示もダイアログ側で行う）
 * @param param0
 * @returns 機材選択の部門選択テーブルコンポーネント
 */
export const EqptBumonsTable = ({
  bumons,
  selected,
  handleClick,
}: {
  /** 部門一覧（null は取得中） */
  bumons: EqptBumon[] | null;
  selected: number;
  handleClick: (id: number) => void;
}) => {
  /* 選択されているときの背景色 */
  const theme = useTheme();
  const selectedColor = alpha(theme.palette.primary.light, 0.4);

  return (
    <TableContainer component={Paper} variant="outlined" square sx={{ height: '75vh' }}>
      {bumons === null ? (
        <Loading />
      ) : (
        <Table stickyHeader padding="none">
          <TableHead>
            <TableRow>
              <TableCell>部門名</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bumons.map((row) => {
              return (
                <TableRow
                  hover
                  onClick={() => handleClick(row.id)}
                  tabIndex={-1}
                  key={row.tblDspNum}
                  sx={{ cursor: 'pointer', bgcolor: selected === row.id ? selectedColor : '' }}
                >
                  <TableCell component="th" scope="row">
                    {row.label}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </TableContainer>
  );
};
