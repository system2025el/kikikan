'use client';

import AddIcon from '@mui/icons-material/Add';
import MergeIcon from '@mui/icons-material/Merge';
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
import React, { useEffect, useMemo } from 'react';

import { toISOStringYearMonthDay, toJapanDateString } from '../../_lib/date-conversion';
import { Loading } from '../../_ui/loading';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { EqptOrderListTableValues } from '../_lib/types';

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
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(() => {
    return rowsPerPage > 0
      ? orderList.map((l, index) => ({ ...l, ordNum: index + 1 })).slice((page - 1) * rowsPerPage, page * rowsPerPage)
      : orderList.map((l, index) => ({ ...l, ordNum: index + 1 }));
  }, [orderList, page]);
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - orderList.length) : 0;

  /* useEffect -------------------------------------------- */
  useEffect(() => {
    setIsLoading(false);
  }, [orderList, setIsLoading]);

  return (
    <>
      <Box>
        <Typography pt={1} pl={2}>
          機材明細一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={orderList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button href="/order/0/edit">
                  <AddIcon fontSize="small" />
                  新規受注
                </Button>
              </Grid2>
            </Grid2>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button>
                  <MergeIcon fontSize="small" />
                  受注マージ
                </Button>
              </Grid2>
              {/* <Grid2>
                <Button>
                  <ContentCopyIcon fontSize="small" />
                  受注コピー
                </Button>
              </Grid2> */}
            </Grid2>
          </Grid2>
        </Grid2>
        {isLoading ? (
          <Loading />
        ) : !list || list.length === 0 ? (
          <Typography justifySelf={'center'}>該当する受注がありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <Table stickyHeader size="small" padding="none">
              <TableHead>
                <TableRow sx={{ whiteSpace: 'nowrap' }}>
                  <TableCell />
                  <TableCell padding="none" />
                  <TableCell align="right">受注番号</TableCell>
                  <TableCell align="left">機材明細名</TableCell>
                  <TableCell align="left">公演名</TableCell>
                  <TableCell align="left">公演場所</TableCell>
                  <TableCell align="left">顧客名</TableCell>
                  <TableCell align="left">出庫日</TableCell>
                  <TableCell align="left">入庫日</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((order, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" />
                    </TableCell>
                    <TableCell
                      width={50}
                      sx={{
                        paddingLeft: 1,
                        paddingRight: 1,
                        textAlign: 'end',
                      }}
                    >
                      {order.ordNum}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="text"
                        size="small"
                        sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
                        href={`/order/${order.juchuHeadId}/${'view'}`}
                      >
                        <Box minWidth={60}>{order.juchuHeadId}</Box>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={200}>
                        {order.headNam}
                      </LightTooltipWithText>
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
                      <LightTooltipWithText variant={'body2'} maxWidth={120}>
                        {`K ${order.kShukoDat ? toJapanDateString(order.kShukoDat) : '-'}`}
                        <br />
                        {`Y ${order.yShukoDat ? toJapanDateString(order.yShukoDat) : '-'}`}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={100}>
                        {`K ${order.kNyukoDat ? toJapanDateString(order.kNyukoDat) : '-'}`}
                        <br />
                        {`Y ${order.yNyukoDat ? toJapanDateString(order.yNyukoDat) : '-'}`}
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
        )}
      </Box>
    </>
  );
};
