'use client';

import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey } from '@mui/material/colors';

import { ShukoMeisaiTableValues } from '../_lib/types';

export const ShukoDetailTable = (props: { datas: ShukoMeisaiTableValues[] }) => {
  const { datas } = props;

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '50vw' }}>
      <Table stickyHeader size="small">
        <TableHead sx={{ bgcolor: 'primary.light' }}>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="center" />
            <TableCell align="left">機材名</TableCell>
            <TableCell align="right">出庫予定数</TableCell>
            <TableCell align="right">読取数</TableCell>
            <TableCell align="right">補正数</TableCell>
            <TableCell align="right" sx={{ pr: 3 }}>
              差異
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                whiteSpace: 'nowrap',
                backgroundColor:
                  row.diff === 0 && row.ctnFlg !== 1 ? grey[200] : row.ctnFlg === 1 ? 'lightblue' : 'white',
              }}
            >
              <TableCell padding="checkbox">{index + 1}</TableCell>
              <TableCell align="left">{row.kizaiNam}</TableCell>
              <TableCell align="right">{row.planQty}</TableCell>
              <TableCell align="right">{row.resultQty}</TableCell>
              <TableCell align="right">{row.resultAdjQty}</TableCell>
              <TableCell
                align="right"
                sx={{
                  pr: 3,
                  backgroundColor:
                    row.diff > 0
                      ? 'yellow'
                      : row.diff < 0
                        ? 'orange'
                        : row.diff === 0 && row.ctnFlg === 1
                          ? 'lightblue'
                          : grey[200],
                }}
              >
                {row.diff}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
