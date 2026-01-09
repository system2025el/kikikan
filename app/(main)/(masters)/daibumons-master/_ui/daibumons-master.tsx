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

import { useUserStore } from '@/app/_lib/stores/usestore';
import { permission } from '@/app/(main)/_lib/permission';
import { Loading } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { daibumonMHeader } from '../_lib/datas';
import { getFilteredDaibumons } from '../_lib/funcs';
import { DaibumonsMasterTableValues } from '../_lib/types';
import { DaibumonsMasterDialog } from './daibumons-master-dialog';

/**
 * 大部門マスタ画面
 * @param {daibumons} 大部門リスト
 * @returns {JSX.Element} 大部門マスタコンポーネント
 */
export const DaibumonsMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* user情報 */
  const user = useUserStore((state) => state.user);

  /* useState ------------------------------------- */
  /** 表示する大部門の配列 */
  const [daibumons, setDaibumons] = useState<DaibumonsMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログ開く大部門のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* useForm ------------------------------------ */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* methods ------------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query?: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredDaibumons(data.query!);
    setPage(1);
    setDaibumons(newList);
    setIsLoading(false);
    console.log('theLocs : ', daibumons, '検索終了検索終了');
  };

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
  const refetchDaibumons = async () => {
    setIsLoading(true);
    const searchParams = getValues();
    const updated = await getFilteredDaibumons(searchParams.query);
    setDaibumons(updated);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredDaibumons();
      setDaibumons(dataList);
      setIsLoading(false);
    };
    getList();
  }, []);

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
            <Typography>大部門マスタ検索</Typography>
          </Box>
          <Divider />
          <Box width={'100%'} px={2} py={0.5} component={'form'} onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'}>
              <Stack alignItems={'baseline'}>
                <Typography noWrap width={200}>
                  大部門名キーワード
                </Typography>
                <TextFieldElement name="query" control={control} helperText={''} />
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
              <MuiTablePagination arrayList={daibumons ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
          ) : !daibumons || daibumons.length === 0 ? (
            <Typography>該当するデータがありません</Typography>
          ) : (
            <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
              <MasterTable
                headers={daibumonMHeader}
                datas={daibumons.map((l) => ({ ...l, id: l.daibumonId, name: l.daibumonNam }))}
                handleOpenDialog={handleOpenDialog}
                page={page}
                rowsPerPage={rowsPerPage}
              />
            </TableContainer>
          )}
          <Dialog open={dialogOpen} fullScreen>
            <DaibumonsMasterDialog
              user={user}
              handleClose={handleCloseDialog}
              daibumonId={openId}
              refetchDaibumons={refetchDaibumons}
            />
          </Dialog>
        </Box>
      </Container>
    </PermissionGuard>
  );
};
