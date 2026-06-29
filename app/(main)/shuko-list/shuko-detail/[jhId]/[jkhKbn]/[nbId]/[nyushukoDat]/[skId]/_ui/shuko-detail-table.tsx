'use client';

import {
  Box,
  Button,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { grey, lightBlue } from '@mui/material/colors';
import { usePathname, useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useState } from 'react';

import { User } from '@/app/_lib/stores/usestore';
import { dispColors, statusColors } from '@/app/(main)/_lib/colors';
import { permission } from '@/app/(main)/_lib/permission';

import { ShukoDetailTableValues } from '../_lib/types';

export const ShukoDetailTable = (props: {
  datas: ShukoDetailTableValues[];
  fixFlag: boolean;
  user: User | null;
  setAdjustOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  const { datas, fixFlag, user, setAdjustOpen } = props;

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
    <TableContainer sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: 'min-content' }}>
      <Box display={'flex'} justifyContent={'space-between'} alignItems={'center'} pl={1} py={0.5}>
        <Typography>全{datas ? datas.length : 0}件</Typography>
        <Box display={'flex'} alignItems={'center'}>
          <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.completed }}>
            済
          </Typography>
          <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.lack }}>
            不足
          </Typography>
          <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.excess }}>
            過剰
          </Typography>
          <Typography minWidth={50} textAlign={'center'} sx={{ backgroundColor: statusColors.ctn }}>
            コンテナ
          </Typography>
          <Button
            onClick={() => setAdjustOpen(true)}
            disabled={
              !datas.find((data) => data.diff !== 0) || fixFlag || user?.permission.nyushuko === permission.nyushuko_ref
            }
            sx={{ ml: 2 }}
          >
            一括補正
          </Button>
        </Box>
      </Box>
      <Table stickyHeader size="small">
        <TableHead sx={{ bgcolor: 'primary.light' }}>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell align="center" />
            <TableCell align="left">機材名</TableCell>
            <TableCell align="right">出庫予定数</TableCell>
            {datas[0].juchuKizaiHeadKbn !== 3 && (
              <>
                <TableCell align="right">受注数</TableCell>
                <TableCell align="right">予備数</TableCell>
              </>
            )}
            <TableCell
              align="right"
              sx={{
                borderLeft: datas[0].juchuKizaiHeadKbn !== 3 ? '2px solid' : 'inherit',
                borderLeftColor: datas[0].juchuKizaiHeadKbn !== 3 ? 'blue' : 'inherit',
              }}
            >
              読取数
            </TableCell>
            <TableCell align="right">補正数</TableCell>
            <TableCell align="right" sx={{ pr: 1 }}>
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
                  row.diff === 0 /*&& row.planQty !== 0 && row.ctnFlg !== 1*/
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
              <TableCell
                align="right"
                sx={{
                  backgroundColor:
                    row.diff !== 0 && datas[0].juchuKizaiHeadKbn !== 3 && !row.ctnFlg ? lightBlue[100] : 'inherit',
                }}
              >
                {row.planQty}
              </TableCell>
              {datas[0].juchuKizaiHeadKbn !== 3 && (
                <>
                  <TableCell align="right">{row.planKizaiQty}</TableCell>
                  <TableCell align="right">{row.planYobiQty}</TableCell>
                </>
              )}
              <TableCell
                align="right"
                sx={{
                  borderLeft: datas[0].juchuKizaiHeadKbn !== 3 ? '2px solid' : 'inherit',
                  borderLeftColor: datas[0].juchuKizaiHeadKbn !== 3 ? 'blue' : 'inherit',
                }}
              >
                {row.resultQty}
              </TableCell>
              <TableCell align="right">{row.resultAdjQty}</TableCell>
              <TableCell
                align="right"
                sx={{
                  pr: 1,
                  backgroundColor:
                    row.diff === 0 /*&& row.planQty !== 0*/
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
