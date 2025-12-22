'use client';

import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React from 'react';

import { dispColors } from '../../_lib/colors';
import { toJapanTimeString } from '../../_lib/date-conversion';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { DashboardTableValues } from '../_lib/types';

/**
 * 車両未設定テーブル
 */
export const VehiclesTable = ({ orders }: { orders: DashboardTableValues[] }) => {
  console.log('orders(車両)', orders);
  // データがない場合の表示
  if (!orders || orders.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
        該当するデータはありません
      </Typography>
    );
  }
  return (
    <TableContainer component={Paper} square sx={{ maxHeight: '230px', mt: 0.5, overflow: 'auto' }}>
      <Table stickyHeader size="small" padding="none">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell>受注番号</TableCell>
            <TableCell>受注明細名</TableCell>
            <TableCell>公演名</TableCell>
            <TableCell>公演場所</TableCell>
            <TableCell>顧客名</TableCell>
            <TableCell>出庫日時</TableCell>
            <TableCell>入庫日時</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order, index) => (
            <TableRow key={index} hover>
              {/* <TableCell align="right" sx={{ minWidth: 0, whiteSpace: 'nowrap' }}> */}
              <TableCell>
                <Button
                  variant="text"
                  size="small"
                  // sx={{ py: 0.2, px: 1, m: 0, width: 'auto' }}
                  onClick={() => window.open(`/order/${order.juchuHeadId}/${'view'}`)}
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
                  onClick={() => window.open(`/eq-main-order-detail/${order.juchuHeadId}/${order.kizaiHeadId}/view`)}
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
                  {`K ${order.kicsShukoDat ? toJapanTimeString(order.kicsShukoDat ?? undefined) : '-'}`}
                  <br />
                  {`Y ${order.yardShukoDat ? toJapanTimeString(order.yardShukoDat) : '-'}`}
                </LightTooltipWithText>
              </TableCell>
              <TableCell>
                <LightTooltipWithText variant={'body2'} maxWidth={180}>
                  {`K ${order.kicsNyukoDat ? toJapanTimeString(order.kicsNyukoDat) : '-'}`}
                  <br />
                  {`Y ${order.yardNyukoDat ? toJapanTimeString(order.yardNyukoDat) : '-'}`}
                </LightTooltipWithText>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
