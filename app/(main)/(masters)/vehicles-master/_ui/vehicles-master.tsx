'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Container, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { vMHeader } from '../_lib/datas';
import { getFilteredVehs } from '../_lib/funcs';
import { VehsMasterTableValues } from '../_lib/types';
import { VehiclesMasterDialog } from './vehicles-master-dialog';
/**
 * 車両マスタ画面
 * @param vehs DBからとってきた車両リスト
 * @returns {JSX.Element} 車両マスタ画面コンポーネント
 */
export const VehiclesMaster = () => {
  /* テーブルの1ページのの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState ------------------ */
  /** 表示する車両の配列 */
  const [vehs, setVehs] = useState<VehsMasterTableValues[]>([]);
  /** 表示してるページ */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* useState ------------------------------- */
  /* ダイアログ開く車両のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* methods ------------------------------- */
  /* 詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /* ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /* 情報が変わったときに更新される */
  const refetchVehs = async () => {
    setIsLoading(true);
    const updated = await getFilteredVehs();
    setVehs(updated);
    setIsLoading(false);
  };

  // 車両マスタに検索自体必要なのか？
  // /* useForm ------------------- */
  // const { control, handleSubmit } = useForm({
  //   mode: 'onSubmit',
  //   defaultValues: { query: '' },
  // });

  // /* 検索ボタン押下 */
  // const onSubmit = async (data: { query: string | undefined }) => {
  //   setIsLoading(true);
  //   console.log('data : ', data);
  //   // const newList = await getFilteredVehs(data.query!);
  //   // setVehs(newList);
  //   console.log('Vehs : ', Vehs);
  // };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredVehs();
      setVehs(dataList);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>車両マスタ検索</Typography>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={vehs ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
        ) : !vehs || vehs.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTable
              headers={vMHeader}
              datas={vehs.map((l) => ({ ...l, id: l.sharyoId, name: l.sharyoNam }))}
              handleOpenDialog={handleOpenDialog}
              page={page}
              rowsPerPage={rowsPerPage}
            />
          </TableContainer>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <VehiclesMasterDialog handleClose={handleCloseDialog} vehicleId={openId} refetchVehs={refetchVehs} />
        </Dialog>
      </Box>
    </Container>
  );
};
