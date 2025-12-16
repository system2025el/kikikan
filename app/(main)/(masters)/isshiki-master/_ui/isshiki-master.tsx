'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Container, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { isshikiMHeader } from '../_lib/datas';
import { getFilteredIsshikis } from '../_lib/funcs';
import { IsshikisMasterTableValues } from '../_lib/types';
import { IsshikisMasterDialog } from './isshiki-master-dialog';

/**
 * 一式マスタ画面
 * @param {isshikis} 一式リスト
 * @returns {JSX.Element} 一式マスタコンポーネント
 */
export const IsshikisMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState ------------------------------------- */
  /** 表示する一式の配列 */
  const [isshikis, setIsshikis] = useState<IsshikisMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログ開く一式のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* methods ------------------------------------- */

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
  const refetchIsshikis = async () => {
    setIsLoading(true);
    const updated = await getFilteredIsshikis();
    setIsshikis(updated);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredIsshikis();
      setIsshikis(dataList);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>一式マスタ検索</Typography>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={isshikis ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
        ) : !isshikis || isshikis.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTable
              headers={isshikiMHeader}
              datas={isshikis.map((l) => ({ ...l, id: l.isshikiId, name: l.isshikiNam }))}
              handleOpenDialog={handleOpenDialog}
              page={page}
              rowsPerPage={rowsPerPage}
            />
          </TableContainer>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <IsshikisMasterDialog handleClose={handleCloseDialog} isshikiId={openId} refetchIsshikis={refetchIsshikis} />
        </Dialog>
      </Box>
    </Container>
  );
};
