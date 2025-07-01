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
import { JSX, useEffect, useMemo, useState } from 'react';

import { MasterTable } from '@/app/(main)/_ui/table';

// import { getAllCustomers } from '@/app/_lib/supabase/supabaseFuncs';
import { MuiTablePagination } from '../../../_ui/table-pagination';
import { cMHeader, customerMasterDialogDetailsValues, CustomerMasterTableValues, customers } from '../_lib/types';
import { CustomerDialogContents } from './customers-master-dialog';

/**
 * 顧客マスタのテーブルコンポーネント
 * @returns {JSX.Element}
 */
export const CustomersMasterTable = (/*{ customers }: { customers: CustomerMasterTableValues[] | undefined }*/) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState
   * -------------------------------------------------------- */
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState(-100);
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ソート方法 */
  const [order, setOrder] = useState<'desc' | 'asc'>('desc');
  /* ソート対象 */
  const [orderBy, setOrderBy] = useState<string>('');
  /* 表示する列 今のところソート、フィルターなし */
  const [customersList, setCustomers] = useState<CustomerMasterTableValues[]>();
  /* ダイアログでの編集モード */
  const [editable, setEditable] = useState(false);
  /* DBのローディング状態 */
  const [loading, setLoading] = useState(true);

  /* Methods
   *---------------------------------------------------- */
  /**
   * 顧客詳細ダイアログを開く関数
   * @param id 顧客ID
   */
  const handleOpen = (id: number) => {
    if (id === -100) {
      setEditable(true);
    } else {
      setOpenID(id);
      console.log(openId);
    }
    setDialogOpen(true);
  };
  /**
   * 顧客詳細ダイアログを閉じる関数
   */
  const handleClose = () => {
    console.log(openId);
    setOpenID(-100);
    setDialogOpen(false);
    setEditable(false);
  };

  // useEffect(() => {
  //   console.log(customers);
  // /*  */
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
  /* 表示する顧客リスト */
  const list = useMemo(
    () => (rowsPerPage > 0 ? customers!.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : customers),
    [page, rowsPerPage]
  );
  console.log('list is here : ', list);
  /**
   * テーブル最後のページ用の空データの長さ
   */

  return (
    <Box>
      {/* {loading ? (
        <Loading>
      ) : ( */}
      {/* <> */}
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={customers!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={3}>
          <Grid2>
            <Typography color="error" variant="body2">
              ※マスタは削除できません。登録画面で削除フラグを付けてください
              <br />
              ※表示順を変更する場合は、検索条件無しで全件表示してください
            </Typography>
          </Grid2>
          <Grid2>
            <Button onClick={() => handleOpen(-100)}>
              <AddIcon fontSize="small" />
              新規
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
        <MasterTable
          headers={cMHeader}
          datas={customers.map((l) => ({
            ...l,
            id: l.kokyakuId,
            address: [l.adrShozai, l.adrTatemono, l.adrSonota].filter(Boolean).join(' '),
          }))}
          page={page}
          rowsPerPage={rowsPerPage}
          handleOpenDialog={handleOpen}
        />
        <Dialog open={dialogOpen} fullScreen>
          <CustomerDialogContents
            customerId={openId}
            handleClose={handleClose}
            editable={editable}
            setEditable={setEditable}
          />
        </Dialog>
      </TableContainer>
      {/* </>
      )} */}
    </Box>
  );
};
