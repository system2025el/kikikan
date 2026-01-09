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

import { deleteEqptSets } from '@/app/_lib/db/tables/m-kizai-set';
import { useUserStore } from '@/app/_lib/stores/usestore';
import { permission } from '@/app/(main)/_lib/permission';
import { Loading } from '@/app/(main)/_ui/loading';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { eqptSetMHeader } from '../_lib/datas';
import { getFilteredEqptSets } from '../_lib/funcs';
import { EqptSetsMasterTableValues } from '../_lib/types';
import { EqptSetsMasterDialog } from './eqpt-set-master-dialog';

/**
 * 機材セットマスタ画面
 * @param {eqptSets} 機材セットリスト
 * @returns {JSX.Element} 機材セットマスタコンポーネント
 */
export const EqptSetsMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* user情報 */
  const user = useUserStore((state) => state.user);

  /* useState ------------------------------------- */
  /** 表示する機材セットの配列 */
  const [eqptSets, setEqptSets] = useState<EqptSetsMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログ開く機材セットのID、閉じるとき、未選択でFAKE_NEW_IDとする */
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
    const newList = await getFilteredEqptSets(data.query!);
    setPage(1);
    setEqptSets(newList);
    setIsLoading(false);
    console.log('theLocs : ', eqptSets, '検索終了検索終了');
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
  const refetchEqptSets = async () => {
    setIsLoading(true);
    const searchParams = getValues();
    const updated = await getFilteredEqptSets(searchParams.query);
    setEqptSets(updated);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredEqptSets();
      setEqptSets(dataList);
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
            <Typography>機材セットマスタ検索</Typography>
          </Box>
          <Divider />
          <Box width={'100%'} px={2} py={0.5} component={'form'} onSubmit={handleSubmit(onSubmit)}>
            <Stack justifyContent={'space-between'} alignItems={'start'}>
              <Stack alignItems={'baseline'}>
                <Typography noWrap width={200}>
                  機材セット名キーワード
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
              <MuiTablePagination arrayList={eqptSets ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
            </Grid2>
            <Grid2 container spacing={3}>
              <Button
                onClick={() => handleOpenDialog(FAKE_NEW_ID)}
                disabled={!((user?.permission.masters ?? 0) & permission.mst_upd)}
              >
                <AddIcon fontSize="small" />
                新規
              </Button>
            </Grid2>
          </Grid2>
          {isLoading ? (
            <Loading />
          ) : !eqptSets || eqptSets.length === 0 ? (
            <Typography>該当するデータがありません</Typography>
          ) : (
            <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
              <MasterTable
                headers={eqptSetMHeader}
                datas={eqptSets.map((l) => ({ ...l, id: l.oyaEqptId, name: l.oyaEqptNam }))}
                handleOpenDialog={handleOpenDialog}
                page={page}
                rowsPerPage={rowsPerPage}
              />
            </TableContainer>
          )}
          <Dialog open={dialogOpen} fullScreen>
            <EqptSetsMasterDialog
              user={user}
              handleClose={handleCloseDialog}
              oyaId={openId}
              refetchEqptSets={refetchEqptSets}
            />
          </Dialog>
        </Box>
      </Container>
    </PermissionGuard>
  );
};
