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

import { toJapanDateString } from '../../_lib/date-conversion';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { EqptOrderListTableValues } from '../../eqpt-order-list/_lib/types';
/**
 * 出庫時間未設定テーブル
 */
export const VehiclesTable = ({ orders }: { orders: EqptOrderListTableValues[] }) => {
  // データがない場合の表示
  if (!orders || orders.length === 0) {
    return (
      <Typography variant="body2" color="textSecondary" sx={{ p: 2, textAlign: 'center' }}>
        該当するデータはありません
      </Typography>
    );
  }
  return (
    <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
      <Table stickyHeader size="small" padding="none">
        <TableHead>
          <TableRow sx={{ whiteSpace: 'nowrap' }}>
            <TableCell>受注番号</TableCell>
            <TableCell>受注明細名</TableCell>
            <TableCell>公演名</TableCell>
            <TableCell>公演場所</TableCell>
            <TableCell>顧客名</TableCell>
            <TableCell>出庫日</TableCell>
            <TableCell>入庫日</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.juchuHeadId} hover>
              <TableCell align="right" sx={{ minWidth: 0, whiteSpace: 'nowrap' }}>
                <Button
                  variant="text"
                  size="small"
                  sx={{ py: 0.2, px: 1, m: 0, width: 'auto' }}
                  href={`/order/${order.juchuHeadId}/${'view'}`}
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
                  }}
                  href={`/eq-main-order-detail/${order.juchuHeadId}/${order.kizaiHeadId}/view`}
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
        </TableBody>
      </Table>
    </TableContainer>
  );
};
