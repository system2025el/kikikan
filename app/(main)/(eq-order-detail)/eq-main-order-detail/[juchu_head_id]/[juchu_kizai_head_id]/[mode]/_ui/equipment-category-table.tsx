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
import { useEffect } from 'react';

import { getBumonsForEqptSelection } from '@/app/(main)/(masters)/_lib/funs';

export const EqptBumonsTable = ({ selected, handleClick }: { selected: number; handleClick: (id: number) => void }) => {
  /*  */
  const theme = useTheme();
  const selectedColor = alpha(theme.palette.primary.light, 0.4);

  /* useState ---------------------------------------- */
  /* 部門一覧 */
  const [bumons, setBumons] = React.useState<
    {
      tblDspNum: number;
      id: number;
      label: string;
    }[]
  >([]);

  /* useeffect ------------------------ */
  useEffect(() => {
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getBumons = async () => {
      const abumons = await getBumonsForEqptSelection();
      setBumons(abumons!);
    };
    getBumons();
  }, []);

  return (
    <TableContainer component={Paper} variant="outlined" square sx={{ height: '65vh' }}>
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
    </TableContainer>
  );
};
