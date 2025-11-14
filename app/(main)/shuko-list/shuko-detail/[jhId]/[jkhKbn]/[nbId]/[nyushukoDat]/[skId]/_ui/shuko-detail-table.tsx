'use client';

import { Button, Link, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';

import { ShukoDetailTableValues } from '../_lib/types';

export const ShukoDetailTable = (props: { datas: ShukoDetailTableValues[] }) => {
  const { datas } = props;

  const router = useRouter();
  const path = usePathname();

  const handleClick = (juchuKizaiHeadId: number | null, juchuKizaiMeisaiId: number | null, kizaiId: number | null) => {
    if (juchuKizaiHeadId && juchuKizaiMeisaiId && kizaiId) {
      router.push(`${path}/shuko-eqpt-detail/${juchuKizaiHeadId}/${juchuKizaiMeisaiId}/${kizaiId}`);
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
                  row.diff === 0 && row.ctnFlg !== 1 && row.planQty !== 0
                    ? 'rgba(158, 158, 158, 1)'
                    : row.ctnFlg === 1
                      ? 'rgba(68, 138, 255, 1)'
                      : 'white',
              }}
            >
              <TableCell padding="checkbox">{index + 1}</TableCell>
              <TableCell
                align="left"
                onClick={() => handleClick(row.juchuKizaiHeadId, row.juchuKizaiMeisaiId, row.kizaiId)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}
              >
                {row.kizaiNam}
              </TableCell>
              <TableCell align="right">{row.planQty}</TableCell>
              <TableCell align="right">{row.resultQty}</TableCell>
              <TableCell align="right">{row.resultAdjQty}</TableCell>
              <TableCell
                align="right"
                sx={{
                  pr: 3,
                  backgroundColor:
                    row.diff > 0
                      ? 'rgba(255, 255, 0, 1)'
                      : row.diff < 0
                        ? 'rgba(255, 171, 64, 1)'
                        : row.diff === 0 && row.ctnFlg === 1
                          ? 'rgba(68, 138, 255, 1)'
                          : row.planQty !== 0
                            ? 'rgba(158, 158, 158, 1)'
                            : undefined,
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
