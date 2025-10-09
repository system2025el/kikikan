'use client';

import { Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';

import { ShukoDetailTableValues } from '../_lib/types';

export const ShukoDetailTable = (props: { datas: ShukoDetailTableValues[] }) => {
  const { datas } = props;

  const router = useRouter();
  const path = usePathname();

  const handleClick = (kizaiId: number | null) => {
    if (kizaiId) {
      router.push(`${path}/shuko-eqpt-detail/${kizaiId}`);
    }
  };

  return (
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '60vw' }}>
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
                  row.diff === 0 && row.ctnFlg !== 1 ? grey[300] : row.ctnFlg === 1 ? '#8EA9DB' : 'white',
              }}
              onClick={() => handleClick(row.kizaiId)}
              style={{ cursor: 'pointer' }}
              hover
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
                      ? '#FFFF00'
                      : row.diff < 0
                        ? '#F4B084'
                        : row.diff === 0 && row.ctnFlg === 1
                          ? '#8EA9DB'
                          : grey[300],
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
