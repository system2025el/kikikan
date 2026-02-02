'use client';

import { Button, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { grey } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { dispColors, statusColors } from '@/app/(main)/_lib/colors';

import { ShukoDetailTableValues } from '../_lib/types';

export const ShukoDetailTable = (props: { datas: ShukoDetailTableValues[] }) => {
  const { datas } = props;

  const router = useRouter();
  const path = usePathname();

  // 処理中制御
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = (juchuKizaiHeadId: number | null, juchuKizaiMeisaiId: number | null, kizaiId: number | null) => {
    if (juchuKizaiHeadId && juchuKizaiMeisaiId && kizaiId && !isProcessing) {
      setIsProcessing(true);
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
            <TableCell align="left">連絡メモ</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {datas.map((row, index) => (
            <TableRow
              key={index}
              sx={{
                whiteSpace: 'nowrap',
                backgroundColor:
                  row.diff === 0 && row.planQty !== 0 //&& row.ctnFlg !== 1
                    ? statusColors.completed
                    : row.ctnFlg === 1
                      ? statusColors.ctn
                      : 'white',
              }}
            >
              <TableCell padding="checkbox">{index + 1}</TableCell>
              <TableCell
                align="left"
                onClick={() => handleClick(row.juchuKizaiHeadId, row.juchuKizaiMeisaiId, row.kizaiId)}
                sx={{ cursor: 'pointer', '&:hover': { backgroundColor: dispColors.hover } }}
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
                    row.diff === 0 && row.planQty !== 0
                      ? statusColors.completed
                      : row.diff > 0
                        ? statusColors.excess
                        : row.diff < 0
                          ? statusColors.lack
                          : row.ctnFlg === 1
                            ? statusColors.ctn
                            : undefined,
                }}
              >
                {row.diff}
              </TableCell>
              <TableCell align="left" sx={{ whiteSpace: 'pre-wrap' }}>
                {row.mem2}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
