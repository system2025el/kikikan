'use client';
import { CheckBox } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import {} from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';

import { customers } from '@/app/_lib/mock-data';
// import { getAllCustomers } from '@/app/_lib/supabase/supabaseFuncs';

import { MuiTablePagination } from '../../_ui/table-pagination';
import { cMHeader, customerMasterDialogDetailsValues, CustomerMasterTableValues } from '../_lib/types';
import { CustomerDialogContents } from './customers-dialog-contents';

/** 顧客マスタのテーブルコンポーネント */
export const CustomersMasterTable = () => {
  /* useState
   * -------------------------------------------------------- */
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState(-100);
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* ソート方法 */
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  /* ソート対象 */
  const [orderBy, setOrderBy] = useState<string>('');
  /* 表示する列 今のところソート、フィルターなし */
  const [customersList, setCustomers] = useState<CustomerMasterTableValues[]>(customers);
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);

  const [loading, setLoading] = useState(true);

  /* Methods
  ------------------------------------------------------------ */
  /**
   * 顧客詳細ダイアログを開く関数
   * @param id 顧客ID
   */
  const handleOpen = (id: number) => {
    if (id === -100) {
      setEditable(true);
    }
    setOpenID(id);
    setDialogOpen(true);
    console.log(customers[id - 1]);
  };
  /**
   * 顧客詳細ダイアログを閉じる関数
   */
  const handleClose = () => {
    setOpenID(-100);
    setDialogOpen(false);
  };
  /** */
  const deleteInfo = (id: number) => {
    setOpenID(-100);
    setDialogOpen(false);
  };

  // useEffect(() => {
  //   console.log(customers);
  //   const getThatOneCustomer = async () => {
  //     const customersList = await getAllCustomers();
  //     console.log('?????????????????????????????????????????????????????', customersList);
  //     setCustomers(customersList!);
  //     console.log('chaaaaaaaaaaaaaaaaaaaaaangemi', customers);
  //     setLoading(false);
  //   };
  //   getThatOneCustomer();
  //   console.log('chaaaaaaaaaaaaaaaaaaaaaangeYO', customers);
  // }, []);

  /**
   *
   */
  /* ソート対象、方法の変更 */
  const handleRequestSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  const createSortHandler = (property: string) => {
    handleRequestSort(property);
  };
  /**
   *  表示する顧客リスト
   */
  const list = useMemo(
    () =>
      rowsPerPage > 0 ? customersList.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : customersList,
    [page, rowsPerPage, customersList]
  );
  console.log('list is here : ', list);
  /**
   * テーブル最後のページ用の空データの長さ
   */
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - customersList.length) : 0;

  return (
    <Box>
      {/* {loading ? (
        <p>読み込み中...</p>
      ) : ( */}
      {/* <> */}
      <Typography pt={2} pl={2}>
        顧客一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={customersList} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button onClick={() => handleOpen(-100)}>
                <AddIcon fontSize="small" />
                追加
              </Button>
            </Grid2>
            <Grid2>
              <Button color="error">
                <DeleteIcon fontSize="small" />
                削除
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
        <Table stickyHeader padding="none">
          <TableHead>
            <TableRow>
              {cMHeader.map((column) => (
                <TableCell key={column.id} /*sortDirection={orderBy === column.id ? order : 'desc'}*/>
                  {column.label}
                  {/* <TableSortLabel
            active={orderBy === column.id}
            direction={orderBy === column.id ? order : 'asc'}
            onClick={createSortHandler(column.id)}
          ></TableSortLabel> */}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {list.map((customer) => (
              <TableRow key={customer.kokyakuId} onClick={() => handleOpen(customer.kokyakuId)}>
                <TableCell>
                  <CheckBox color="primary" />
                </TableCell>
                <TableCell>
                  <Button variant="text">{customer.kokyakuNam}</Button>
                </TableCell>

                <TableCell>
                  {customer.adrShozai} {customer.adrTatemono} {customer.adrSonota}
                </TableCell>
                <TableCell>{customer.tel}</TableCell>
                <TableCell>{customer.fax}</TableCell>
                <TableCell sx={{ maxWidth: 40 }}>
                  <Typography noWrap>{customer.mem}</Typography>
                </TableCell>
              </TableRow>
            ))}
            <Dialog open={dialogOpen} fullScreen>
              <CustomerDialogContents
                customerId={openId}
                handleClose={handleClose}
                editable={editable}
                setEditable={setEditable}
              />
            </Dialog>
            {emptyRows > 0 && (
              <TableRow style={{ height: 30 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {/* </>
      )} */}
    </Box>
  );
};
