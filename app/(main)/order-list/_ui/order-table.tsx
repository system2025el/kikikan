'use client';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopyOutlined';
import MergeIcon from '@mui/icons-material/Merge';
import {
  alpha,
  Box,
  Button,
  Checkbox,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import React, { useState } from 'react';

import { orderList } from '../../../_lib/mock-data';
import { MuiTablePagination } from '../../_ui/table-pagination';

// const MuiTablePaginationorder = styled(MuiTablePagination)(({ theme }) => ({
//   sx: { bgcolor: grey[300], justifyItems: 'end', width: '25vw' },
//   [theme.breakpoints.down('md')]: {
//     colSpan: 9,
//   },
//   [theme.breakpoints.up('md')]: {
//     colSpan: 4,
//   },
// }));

/** 受注一覧テーブルのコンポーネント */
export const OrderTable = () => {
  const theme = useTheme();

  const [page, setPage] = useState(0);
  const rowsPerPage = 20;

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - orderList.length) : 0;

  return (
    <>
      <Box bgcolor={grey[200]} mt={3}>
        <Typography pt={2} pl={2}>
          受注一覧
        </Typography>
        <Stack mt={1} display={{ xs: 'flex', md: 'none' }} justifyContent={'end'}>
          <Button sx={{ ml: '40%', px: 1.5, py: 1.5 }} href="/new-order">
            +新規受注
          </Button>
          <Button color="error">-受注削除</Button>
          <Button>受注マージ</Button>
          <Button>受注コピー</Button>
        </Stack>
        <TableContainer component={Paper} elevation={0} square sx={{ maxHeight: 600, bgcolor: grey[200] }}>
          <Table stickyHeader size="small">
            <TableHead>
              {/* デスクトップで表示するヘッダー */}
              <TableRow sx={{ display: { xs: 'none', md: 'table-row' } }}>
                <MuiTablePagination
                  arrayList={orderList}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  setPage={setPage}
                  colSpan={4}
                  sx={{ bgcolor: grey[200], justifyItems: 'end', width: '25vw' }}
                />
                <TableCell colSpan={2} sx={{ bgcolor: grey[200] }}>
                  <Button sx={{ ml: '40%', px: 1.5, py: 1.5 }} href="/new-order">
                    +新規受注
                  </Button>
                </TableCell>
                <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                  <Button color="error">-受注削除</Button>
                </TableCell>
                <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                  <Button>受注マージ</Button>
                </TableCell>
                <TableCell colSpan={1} sx={{ bgcolor: grey[200] }}>
                  <Button>受注コピー</Button>
                </TableCell>
              </TableRow>
              {/* スマホサイズで表示するヘッダー */}
              <TableRow sx={{ display: { xs: 'table-row', md: 'none' } }}>
                <MuiTablePagination
                  arrayList={orderList}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  setPage={setPage}
                  colSpan={5}
                  sx={{ bgcolor: grey[200], justifyItems: 'end', width: '25vw' }}
                />
                <TableCell colSpan={4} sx={{ bgcolor: grey[200] }}></TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}></TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }} align="center">
                  受注番号
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65, maxWidth: 100 }}>
                  <Box minWidth={100} maxWidth={100}>
                    受注ステータス
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}>
                  <Box minWidth={100} maxWidth={100}>
                    公演名
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}>
                  <Box minWidth={100} maxWidth={100}>
                    公演場所
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}>
                  <Box minWidth={200} maxWidth={200}>
                    顧客名
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}>
                  <Box minWidth={100} maxWidth={100}>
                    受注日
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}>
                  <Box minWidth={100} maxWidth={100}>
                    受注開始日
                  </Box>
                </TableCell>
                <TableCell sx={{ bgcolor: grey[300], top: 65 }}>
                  <Box minWidth={100} maxWidth={100}>
                    終了日
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(rowsPerPage > 0
                ? orderList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                : orderList
              ).map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Box minWidth={10} maxWidth={10}>
                      <Checkbox color="primary" />
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Button variant="text">
                      <Box minWidth={60} maxWidth={60}>
                        {order.orderNumber}
                      </Box>
                    </Button>
                  </TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.location}</TableCell>
                  <TableCell>{order.customerName}</TableCell>
                  <TableCell>{order.orderedDate}</TableCell>
                  <TableCell>{order.issueDate}</TableCell>
                  <TableCell>{order.returnDate}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 53 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      {/* <SpeedDial
        // color={alpha(theme.palette.primary.light, 0.5)}
        ariaLabel="SpeedDial basic example"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { md: 'none' },
        }}
        icon={
          <SpeedDialIcon
            sx={{
              bgcolor: transparentColor, // ✅ ここで透過カラー指定
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.7), // hover時の色も透過で調整可能
              },
            }}
          />
        }
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            slotProps={{
              tooltip: {
                title: action.name,
                open: true,
                placement: 'left',
              },
              fab: {
                sx: {
                  color: 'white',
                  bgcolor: action.colors,
                  '&:hover': {
                    bgcolor: action.hoverColors,
                  },
                },
              },
            }}
          />
        ))}
      </SpeedDial> */}
    </>
  );
};

const actions = [
  { icon: <DeleteIcon />, name: '受注削除', colors: 'error.light', hoverColors: 'error.dark' },
  { icon: <FileCopyIcon />, name: '受注コピー', colors: 'primary.light', hoverColors: 'primary.dark' },
  { icon: <MergeIcon />, name: '受注マージ', colors: 'primary.light', hoverColors: 'primary.dark' },
  { icon: <AddIcon />, name: '新規受注', colors: 'primary.main', hoverColors: 'primary.dark' },
];
