'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/tables';
import { cMHeader } from '../_lib/datas';
import { getFilteredCustomers } from '../_lib/funcs';
import { CustomersMasterTableValues } from '../_lib/types';
import { CustomersMasterDialog } from './customers-master-dialog';

/**
 * 顧客マスタのテーブルコンポーネント
 * @returns {JSX.Element}
 */
export const CustomersMasterTable = ({
  customers,
  isLoading,
  setIsLoading,
}: {
  customers: CustomersMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState ----------------------------------- */
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState(-100);
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* 顧客リスト */
  const [theCustomers, setTheCustomers] = useState<CustomersMasterTableValues[] | undefined>(customers);

  /* methods ------------------------------------------- */
  /* 顧客詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /* 顧客詳細ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /* 情報が変わったときに更新される */
  const refetchCustomers = async () => {
    setIsLoading(true);
    const updated = await getFilteredCustomers('');
    setTheCustomers(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheCustomers(customers); // 親からのCustomersが更新された場合に同期
  }, [customers]);

  useEffect(() => {
    setIsLoading(false); //theCustomersが変わったらローディング終わり
  }, [theCustomers, setIsLoading]);

  /* 表示する顧客リスト */
  const list = useMemo(
    () =>
      theCustomers && rowsPerPage > 0
        ? theCustomers.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : theCustomers,
    [page, rowsPerPage, theCustomers]
  );

  return (
    <Box>
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={list!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={3}>
          <Grid2 alignContent={'center'}>
            <Typography color="error" variant="body2">
              {/* ※マスタは削除できません。登録画面で削除フラグを付けてください */}
              {/* <br /> */}
              ※表示順を変更する場合は、検索条件無しで全件表示してください
            </Typography>
          </Grid2>
          <Grid2>
            <Button onClick={() => handleOpenDialog(-100)}>
              <AddIcon fontSize="small" />
              新規
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {list!.length < 1 && <Typography>該当するデータがありません</Typography>}
          {list!.length > 0 && (
            <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
              <MasterTable
                headers={cMHeader}
                datas={list!.map((l) => ({
                  ...l,
                  id: l.kokyakuId,
                  name: l.kokyakuNam,
                  address: [l.adrShozai, l.adrTatemono, l.adrSonota].filter(Boolean).join(' '),
                }))}
                page={page}
                rowsPerPage={rowsPerPage}
                handleOpenDialog={handleOpenDialog}
              />
            </TableContainer>
          )}
        </>
      )}
      <Dialog open={dialogOpen} fullScreen>
        <CustomersMasterDialog
          customerId={openId}
          handleClose={handleCloseDialog}
          refetchCustomers={refetchCustomers}
        />
      </Dialog>
    </Box>
  );
};
