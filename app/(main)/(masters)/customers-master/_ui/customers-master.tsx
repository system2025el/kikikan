'use client';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Stack,
  TableContainer,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { cMHeader } from '../_lib/datas';
import { getFilteredCustomers } from '../_lib/funcs';
import { CustomersMasterTableValues } from '../_lib/types';
import { CustomersMasterDialog } from './customers-master-dialog';
/**
 * 顧客マスタ画面
 * @returns {JSX.Element} 顧客マスタ画面コンポーネント
 */
export const CustomersMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState ------------------------------ */
  /** 表示する顧客の配列 */
  const [customers, setCustomers] = useState<CustomersMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログ開く顧客のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState(FAKE_NEW_ID);
  /** 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* useForm ------------------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* methods ------------------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredCustomers(data.query!);
    setPage(1);
    setCustomers(newList);
    setIsLoading(false);
    console.log('theLocs : ', customers);
  };
  /** 顧客詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /** 顧客詳細ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /** 情報が変わったときに更新される */
  const refetchCustomers = async () => {
    setIsLoading(true);
    const searchParams = getValues();
    const updated = await getFilteredCustomers(searchParams.query);
    setCustomers(updated);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredCustomers();
      setCustomers(dataList);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} px={2} sx={{ minHeight: '30px', maxHeight: '30px' }} alignItems={'center'}>
          <Typography>顧客マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} px={2} py={0.5} component={'form'} onSubmit={handleSubmit(onSubmit)}>
          <Stack justifyContent={'space-between'} alignItems={'start'}>
            <Stack alignItems={'baseline'}>
              <Typography>顧客キーワード</Typography>
              <TextFieldElement
                name="query"
                control={control}
                helperText={'社名、かな、住所、TEL、FAX、メモから部分一致検索'}
              />
            </Stack>
            <Box alignSelf={'end'}>
              <Button type="submit" loading={isLoading}>
                <SearchIcon />
                検索
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={customers ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={3}>
            <Grid2 alignContent={'center'}>
              <Typography color="error" variant="body2">
                ※マスタは削除できません。登録画面で無効化してください
              </Typography>
            </Grid2>
            <Grid2>
              <Button onClick={() => handleOpenDialog(FAKE_NEW_ID)}>
                <AddIcon fontSize="small" />
                新規
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
        {isLoading ? (
          <Loading />
        ) : customers && customers.length > 0 ? (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTable
              headers={cMHeader}
              datas={customers.map((l) => ({
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
        ) : (
          <Typography>該当するデータがありません</Typography>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <CustomersMasterDialog
            customerId={openId}
            handleClose={handleCloseDialog}
            refetchCustomers={refetchCustomers}
          />
        </Dialog>
      </Box>
    </Container>
  );
};
