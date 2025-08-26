'use client';

import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import MergeIcon from '@mui/icons-material/Merge';
import {
  alpha,
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
  useTheme,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';

import { toISOStringYearMonthDay } from '../../_lib/date-conversion';
import { Loading } from '../../_ui/loading';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { orderList, OrderListTableValues } from '../_lib/types';

/** 受注一覧テーブルのコンポーネント */
export const OrderTable = ({
  orderList,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  orderList: OrderListTableValues[];
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  //const [page, setPage] = useState(1);
  const rowsPerPage = 50;

  // 表示するデータ
  const list = useMemo(() => {
    const pagedList = rowsPerPage > 0 ? orderList.slice((page - 1) * rowsPerPage, page * rowsPerPage) : orderList;

    return pagedList.map((item, index) => ({
      ...item,
      ordNum: (page - 1) * rowsPerPage + index + 1, // ← ここで表示順を計算！
    }));
  }, [orderList, page]);

  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - orderList.length) : 0;

  useEffect(() => {
    setIsLoading(false); //theLocsが変わったらローディング終わり
  }, [orderList, setIsLoading]);

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          受注一覧
        </Typography>
        <Divider />
        <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
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
              <Grid2>
                <Button>
                  <ContentCopyIcon fontSize="small" />
                  受注コピー
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        <TableContainer component={Paper} square sx={{ maxHeight: '80vh', mt: 1 }}>
          {isLoading ? (
            <Loading />
          ) : (
            <Table stickyHeader size="small" padding="none" sx={{ width: '100vw' }}>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell padding="none"></TableCell>
                  <TableCell align="center">受注番号</TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      受注ステータス
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      公演名
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      公演場所
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={200} maxWidth={200}>
                      顧客名
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      受注日
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      受注開始日
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box minWidth={100} maxWidth={100}>
                      受注終了日
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography noWrap>入出庫ステータス</Typography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((order, index) => (
                  <TableRow key={index}>
                    <TableCell padding="checkbox">
                      {/* <Box minWidth={10} maxWidth={10}> */}
                      <Checkbox color="primary" />
                      {/* </Box> */}
                    </TableCell>
                    <TableCell padding="none">{order.ordNum}</TableCell>
                    <TableCell align="center">
                      <Button variant="text" href={`/order/${order.juchuHeadId}/${'view'}`}>
                        <Box minWidth={60} maxWidth={60}>
                          {order.juchuHeadId}
                        </Box>
                      </Button>
                    </TableCell>
                    <TableCell>{order.juchuStsNam}</TableCell>
                    <TableCell>{order.koenNam}</TableCell>
                    <TableCell>{order.koenbashoNam}</TableCell>
                    <TableCell>{order.kokyakuNam}</TableCell>
                    <TableCell>{toISOStringYearMonthDay(new Date(order.juchuDat))}</TableCell>
                    <TableCell>{order.juchuStrDat && toISOStringYearMonthDay(new Date(order.juchuStrDat))}</TableCell>
                    <TableCell>{order.juchuEndDat && toISOStringYearMonthDay(new Date(order.juchuEndDat))}</TableCell>
                    <TableCell>{order.nyushukoStsNam}</TableCell>
                  </TableRow>
                ))}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 30 * emptyRows }}>
                    <TableCell colSpan={8} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </Box>
    </>
  );
};
