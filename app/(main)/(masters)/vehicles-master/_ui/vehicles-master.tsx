'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Container, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { permission } from '@/app/(main)/_lib/permission';
import { Loading } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
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
  /* user情報 */
  const user = useUserStore((state) => state.user);

  /* useState ------------------ */
  /** 表示する車両の配列 */
  const [vehs, setVehs] = useState<VehsMasterTableValues[]>([]);
  /** 表示してるページ */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);
  // エラーハンドリング
  const [error, setError] = useState<Error | null>(null);
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
    try {
      const updated = await getFilteredVehs();
      setVehs(updated);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
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
      try {
        const dataList = await getFilteredVehs();
        setVehs(dataList);
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      }
      setIsLoading(false);
    };
    getList();
  }, []);

  if (error) throw error;

  return (
    <PermissionGuard category={'masters'} required={permission.mst_ref}>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box
            width={'100%'}
            display={'flex'}
            px={2}
            sx={{ minHeight: '30px', maxHeight: '30px' }}
            alignItems={'center'}
          >
            <Typography>車両マスタ</Typography>
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
                <Button
                  onClick={() => handleOpenDialog(FAKE_NEW_ID)}
                  disabled={!((user?.permission.masters ?? 0) & permission.mst_upd)}
                >
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
            <VehiclesMasterDialog
              user={user}
              handleClose={handleCloseDialog}
              vehicleId={openId}
              refetchVehs={refetchVehs}
            />
          </Dialog>
        </Box>
      </Container>
    </PermissionGuard>
  );
};
