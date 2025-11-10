'use client';

import UpdateIcon from '@mui/icons-material/Update';
import { alpha, Box, Button, CircularProgress, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { getFilteredOrderList } from '../../eqpt-order-list/_lib/funcs';
import { EqptOrderListTableValues } from '../../eqpt-order-list/_lib/types';
import { getFilteredEqpts } from '../../loan-situation/_lib/funcs';
import { LoanEqTableValues } from '../../loan-situation/_lib/types';
import { EqptTable } from './eqpt-table';
import { ShukoTable } from './shuko-table';
import { VehiclesTable } from './vehicles-table ';

export const Dashboard = () => {
  const theme = useTheme();
  const selectedBgColor = alpha(theme.palette.primary.main, 0.6);
  const today = dayjs().format('YYYY/MM/DD');
  const nextWeek = dayjs().add(7, 'day').format('YYYY/MM/DD');
  // ステート管理
  const [loading, setLoading] = useState<boolean>(true);
  const [unsetTimeOrders, setUnsetTimeOrders] = useState<EqptOrderListTableValues[]>([]);
  const [shortageEqpts, setShortageEqpts] = useState<LoanEqTableValues[]>([]);

  // データ取得
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      try {
        const [ordersData, shortageData] = await Promise.all([
          // 出庫時間未設定データの取得
          getFilteredOrderList({
            radio: 'shuko',
            range: { from: new Date(), to: new Date() },
            kokyaku: null,
            koenbashoNam: '',
            listSort: { sort: 'shuko', order: 'asc' },
          }),
          getFilteredEqpts(),
        ]);

        // 結果をステートにセット
        if (ordersData) {
          setUnsetTimeOrders(ordersData);
        }
        if (shortageData) {
          setShortageEqpts(shortageData as LoanEqTableValues[]);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // エラーハンドリング
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <Box sx={{ textAlign: 'left' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" px={2} pt={1}>
          <Box display="flex" alignItems="baseline" gap={2}>
            <Typography sx={{ fontSize: '24px', fontWeight: 'bold' }}>ダッシュボード</Typography>
            <Typography sx={{ fontSize: '16px', color: 'text.secondary' }}>
              {today}～{nextWeek}
            </Typography>
          </Box>
          <Button startIcon={<UpdateIcon />}>再更新</Button>
        </Box>
        <Divider />

        <Stack spacing={3} direction="column" alignItems="flex-start" sx={{ width: '100%', pt: 5 }}>
          <Paper variant="outlined" sx={{ p: 2, width: '100%', maxWidth: '1600px' }}>
            <Typography variant="h6" gutterBottom>
              出庫時間未設定
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              // 出庫時間未設定テーブル
              <ShukoTable orders={unsetTimeOrders} />
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, width: '100%', maxWidth: '1600px' }}>
            <Typography variant="h6" gutterBottom>
              車両未設定
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              // 車両未設定テーブル
              <VehiclesTable orders={unsetTimeOrders} />
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, width: '100%', maxWidth: '700px' }}>
            <Typography variant="h6" gutterBottom>
              在庫不足状況
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              // 車両未設定テーブル
              <EqptTable eqpts={shortageEqpts} />
            )}
          </Paper>
        </Stack>
      </Box>
    </>
  );
};
/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 1,
    marginLeft: 2,
  },
};
