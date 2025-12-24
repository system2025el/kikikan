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
import { useEffect, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { getBumonsForEqptSelection } from '../_lib/funcs';

/**
 * 機材選択の部門選択テーブル
 * @param param0
 * @returns 機材選択の部門選択テーブルコンポーネント
 */
export const EqptBumonsTable = ({ selected, handleClick }: { selected: number; handleClick: (id: number) => void }) => {
  /* 選択されているときの背景色 */
  const theme = useTheme();
  const selectedColor = alpha(theme.palette.primary.light, 0.4);

  /* useState ---------------------------------------- */
  /* 部門一覧 */
  const [bumons, setBumons] = useState<
    {
      tblDspNum: number;
      id: number;
      label: string;
    }[]
  >([]);
  /** ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  /* useeffect ------------------------ */
  useEffect(() => {
    const getBumons = async () => {
      const abumons = await getBumonsForEqptSelection();
      setBumons(abumons!);
      setIsLoading(false);
    };
    getBumons();
  }, []);

  return (
    <TableContainer component={Paper} variant="outlined" square sx={{ height: '75vh' }}>
      {isLoading ? (
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
