'use client';

import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTableOfEqpt } from '../../_ui/tables';
import { eqptMHeader } from '../_lib/datas';
import { EqptMasterTableValues } from '../_lib/types';
import { EqMasterDialog } from './eqpt-master-dialog';

/** 機材マスタのテーブルコンポーネント */
export const EqptMasterTable = ({
  eqpts,
  isLoading,
  setIsLoading,
}: {
  eqpts: EqptMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* テーブル1ページの行数 */
  const rowsPerPage = 50;
  /* useState ------------------------------------------------ */
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ダイアログ開く機材のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 場所リスト */
  const [theEqpts, setTheEqpts] = useState<EqptMasterTableValues[] | undefined>(eqpts);

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
    // const updated = await getFilteredEqpts('');
    // setTheEqpts(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheEqpts(eqpts); // 親からのEqptsが更新された場合に同期
  }, [eqpts]);

  useEffect(() => {
    setIsLoading(false); //theEqptsが変わったらローディング終わり
  }, [theEqpts, setIsLoading]);

  // 表示するデータ
  const list = useMemo(
    () => (theEqpts && rowsPerPage > 0 ? theEqpts.slice((page - 1) * rowsPerPage, page * rowsPerPage) : theEqpts),
    [page, rowsPerPage, theEqpts]
  );
  // // テーブル最後のページ用の空データの長さ
  // const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - arrayList.length) : 0;

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
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <MasterTableOfEqpt
              headers={eqptMHeader}
              datas={list!.map((l) => ({
                id: l.kizaiId,
                name: l.kizaiNam,
                ...l,
              }))}
              page={page}
              rowsPerPage={rowsPerPage}
              handleOpenDialog={handleOpenDialog}
            />
            <Dialog open={dialogOpen} fullScreen>
              <EqMasterDialog handleClose={handleCloseDialog} eqptId={openId} refetchEqpts={refetchEqpts} />
            </Dialog>
          </>
        )}
      </TableContainer>
    </Box>
  );
};
