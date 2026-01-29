'use client';

import UpdateIcon from '@mui/icons-material/Update';
import { alpha, Box, Button, CircularProgress, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

import { getMinusZaikoList, getShukoList, getVehiclesList } from '../_lib/funcs';
import { DashboardTableValues, MinusZaikoValues } from '../_lib/types';
import { EqptTable } from './eqpt-table';
import { ShukoTable } from './shuko-table';
import { VehiclesTable } from './vehicles-table ';

export const Dashboard = () => {
  const today = dayjs().format('YYYY/MM/DD');
  const nextWeek = dayjs()
    .add(7 - 1, 'day')
    .format('YYYY/MM/DD');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [unsetShukoTimeOrders, setUnsetShukoTimeOrders] = useState<DashboardTableValues[]>([]);
  const [unsetTimeOrders, setUnsetTimeOrders] = useState<DashboardTableValues[]>([]);
  const [shortageEqpts, setShortageEqpts] = useState<MinusZaikoValues[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [shukoData, ordersData, shortageData] = await Promise.all([
        getShukoList(today, 7),
        getVehiclesList(today, 7),
        getMinusZaikoList(today, 7),
      ]);
      if (shukoData) {
        setUnsetShukoTimeOrders(shukoData);
      }

      if (ordersData) {
        setUnsetTimeOrders(ordersData);
      }

      if (shortageData) {
        setShortageEqpts(shortageData as MinusZaikoValues[]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  const handleReload = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) throw error;

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
          <Button startIcon={<UpdateIcon />} onClick={handleReload} disabled={loading}>
            {loading ? '更新中...' : '再表示'}
          </Button>
        </Box>
        <Divider />

        <Stack spacing={3} direction="column" alignItems="flex-start" sx={{ width: '100%', pt: 5 }}>
          <Paper variant="outlined" sx={{ p: 2, width: '100%', maxWidth: '1600px' }}>
            <Typography variant="h6" gutterBottom>
              出庫時刻未設定
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <ShukoTable orders={unsetShukoTimeOrders} />
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
              <VehiclesTable orders={unsetTimeOrders} />
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, width: '100%', maxWidth: '700px' }}>
            <Typography variant="h6" gutterBottom>
              マイナス在庫
            </Typography>

            {loading ? (
              <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              //  マイナス在庫テーブル
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
