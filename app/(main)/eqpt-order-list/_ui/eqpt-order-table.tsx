'use client';

import {
  Box,
  Button,
  Checkbox,
  Divider,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useState } from 'react';

import { dispColors } from '../../_lib/colors';
import { toJapanTimeString, toJapanYMDString } from '../../_lib/date-conversion';
import { Loading } from '../../_ui/loading';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { ROWS_PER_MASTER_TABLE_PAGE } from '../../(masters)/_lib/constants';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { EqptOrderListTableValues, EqptOrderSearchValues } from '../_lib/types';

/**
 * 受注一覧用テーブル
 * @param param0
 * @returns 受注一覧用テーブルコンポーネント
 */
export const EqptOrderTable = ({
  orderList,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  orderList: EqptOrderListTableValues[];
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /** テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /** ページルーター */
  const router = useRouter();

  const [push, setPush] = useState(false);

  /** 表示するデータ */
  const list = useMemo(() => {
    return rowsPerPage > 0
      ? orderList.map((l, index) => ({ ...l, ordNum: index + 1 })).slice((page - 1) * rowsPerPage, page * rowsPerPage)
      : orderList.map((l, index) => ({ ...l, ordNum: index + 1 }));
  }, [orderList, page, rowsPerPage]);
  /** テーブル最後のページ用の空データの長さ */
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - orderList.length) : 0;

  /* useEffect -------------------------------------------- */
  useEffect(() => {
    setIsLoading(false);
  }, [orderList, setIsLoading]);

  return (
    <>
      <Box>
        <Typography pt={1} pl={2}>
          受注明細一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={orderList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
        </Grid2>
        {isLoading ? (
          <Loading />
        ) : list && list.length > 0 ? (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <Table stickyHeader size="small" padding="none">
              <TableHead>
                <TableRow sx={{ whiteSpace: 'nowrap' }}>
                  {/* <TableCell /> */}
                  {/* <TableCell padding="none" /> */}
                  <TableCell align="right">受注番号</TableCell>
                  <TableCell align="left">受注明細名</TableCell>
                  <TableCell align="left">公演名</TableCell>
                  <TableCell align="left">公演場所</TableCell>
                  <TableCell align="left">顧客名</TableCell>
                  <TableCell align="left">出庫日時</TableCell>
                  <TableCell align="left">入庫日時</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((order, index) => (
                  <TableRow key={index}>
                    {/* <TableCell padding="checkbox">
                      <Checkbox color="primary" />
                    </TableCell> */}
                    {/* <TableCell
                      width={50}
                      sx={{
                        paddingLeft: 1,
                        paddingRight: 1,
                        textAlign: 'end',
                      }}
                    >
                      {order.ordNum}
                    </TableCell> */}
                    <TableCell align="right" sx={{ minWidth: 0, whiteSpace: 'nowrap' }}>
                      <Button
                        variant="text"
                        size="small"
                        sx={{ py: 0.2, px: 1, m: 0, width: 'auto' }}
                        onClick={() => {
                          if (push) return;
                          setPush(true);
                          router.push(`/order/${order.juchuHeadId}/${'view'}`);
                        }}
                      >
                        {order.juchuHeadId}
                      </Button>
                    </TableCell>
                    <TableCell sx={{ minWidth: 0, whiteSpace: 'nowrap' }}>
                      <Button
                        variant="text"
                        size="small"
                        sx={{
                          py: 0.2,
                          px: 1,
                          m: 0,
                          width: 'auto',
                          justifyContent: 'flex-start',
                          textAlign: 'left',
                          color:
                            order.headKbn === 1
                              ? dispColors.main
                              : order.headKbn === 2
                                ? dispColors.return
                                : order.headKbn === 3
                                  ? dispColors.keep
                                  : dispColors.main,
                        }}
                        onClick={() => {
                          if (push) return;
                          setPush(true);
                          router.push(
                            order.headKbn === 1
                              ? `/eq-main-order-detail/${order.juchuHeadId}/${order.kizaiHeadId}/view`
                              : order.headKbn === 2
                                ? `/eq-return-order-detail/${order.juchuHeadId}/${order.kizaiHeadId}/${order.oyaJuchuKizaiHeadId}/view`
                                : order.headKbn === 3
                                  ? `/eq-keep-order-detail/${order.juchuHeadId}/${order.kizaiHeadId}/${order.oyaJuchuKizaiHeadId}/view`
                                  : `/eq-main-order-detail/${order.juchuHeadId}/${order.kizaiHeadId}/view`
                          );
                        }}
                      >
                        <LightTooltipWithText variant={'button'} maxWidth={300}>
                          {order.headNam}
                        </LightTooltipWithText>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={200}>
                        {order.koenNam}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={200}>
                        {order.koenbashoNam}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={300}>
                        {order.kokyakuNam}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={180}>
                        {`K  ${order.kShukoDat}`}
                        <br />
                        {`Y  ${order.yShukoDat}`}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={180}>
                        {`K  ${order.kNyukoDat}`}
                        <br />
                        {`Y  ${order.yNyukoDat}`}
                      </LightTooltipWithText>
                    </TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 31 * emptyRows }}>
                    <TableCell colSpan={11} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography justifySelf={'center'}>該当する受注がありません</Typography>
        )}
      </Box>
    </>
  );
};
