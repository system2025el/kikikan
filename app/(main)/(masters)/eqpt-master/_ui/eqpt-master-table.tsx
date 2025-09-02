'use client';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { NEW_MASTER_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTableOfEqpt } from '../../_ui/tables';
import { eqptMHeader } from '../_lib/datas';
import { getFilteredEqpts } from '../_lib/funcs';
import { EqptsMasterTableValues } from '../_lib/types';
import { EqMasterDialog } from './eqpt-master-dialog';

/** 機材マスタのテーブルコンポーネント */
export const EqptMasterTable = ({
  eqpts,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  eqpts: EqptsMasterTableValues[] | undefined;
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /* テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* useState ------------------------------------------------ */
  /* ダイアログ開く機材のID、閉じるとき、未選択でNEW_MASTER_IDとする */
  const [openId, setOpenID] = useState<number>(NEW_MASTER_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 場所リスト */
  const [theEqpts, setTheEqpts] = useState<EqptsMasterTableValues[] | undefined>(eqpts);

  /* methods ------------------------------------------- */
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
  const refetchEqpts = async () => {
    setIsLoading(true);
    const updated = await getFilteredEqpts();
    setTheEqpts(updated?.data);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheEqpts(eqpts); // 親からのEqptsが更新された場合に同期
  }, [eqpts]);

  useEffect(() => {
    setIsLoading(false); //theEqptsが変わったらローディング終わり
  }, [theEqpts, setIsLoading]);

  return (
    <Box>
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={theEqpts!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={3}>
          <Grid2 alignContent={'center'}>
            <Typography color="error" variant="body2">
              ※マスタは削除できません。登録画面で無効化してください
              <br />
              ※表示順を変更する場合は、検索条件無しで全件表示してください
            </Typography>
          </Grid2>
          <Grid2>
            <Button onClick={() => handleOpenDialog(NEW_MASTER_ID)}>
              <AddIcon fontSize="small" />
              新規
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      {isLoading ? (
        <Loading />
      ) : !theEqpts || theEqpts!.length === 0 ? (
        <Typography>該当するデータがありません</Typography>
      ) : (
        <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
          <MasterTableOfEqpt
            headers={eqptMHeader}
            datas={theEqpts!.map((l) => ({
              id: l.kizaiId ?? 0,
              name: l.kizaiNam,
              ...l,
            }))}
            page={page}
            rowsPerPage={rowsPerPage}
            handleOpenDialog={handleOpenDialog}
          />
        </TableContainer>
      )}

      <Dialog open={dialogOpen} fullScreen>
        <EqMasterDialog handleClose={handleCloseDialog} eqptId={openId} refetchEqpts={refetchEqpts} />
      </Dialog>
    </Box>
  );
};
