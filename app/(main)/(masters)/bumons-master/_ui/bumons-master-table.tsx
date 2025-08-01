'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/tables';
import { BumonsMHeader } from '../_lib/datas';
import { getFilteredBumons } from '../_lib/funcs';
import { BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterDialog } from './bumons-master-dialog';

/**
 * 部門マスタテーブル
 * @param
 * @returns {JSX.Element} 部門マスタテーブル
 */

export const BumonsMasterTable = ({
  bumons,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  bumons: BumonsMasterTableValues[] | undefined;
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState --------------------------------------- */
  /* ダイアログ開く部門のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 部門リスト */
  const [theBumons, setTheBumons] = useState<BumonsMasterTableValues[] | undefined>(bumons);

  /* methods ---------------------------------------- */
  /* 選んだ部門ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /* ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /* 情報が変わったときに更新される */
  const refetchBumons = async () => {
    setIsLoading(true);
    const updated = await getFilteredBumons({
      q: '',
      d: 0,
      s: 0,
    });
    setTheBumons(updated?.data);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheBumons(bumons); // 親からのBumonsが更新された場合に同期
  }, [bumons]);

  useEffect(() => {
    setIsLoading(false); //theBumonsが変わったらローディング終わり
  }, [theBumons, setIsLoading]);

  return (
    <>
      <Box>
        <Typography pt={2} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={theBumons!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={3}>
            <Grid2 alignContent={'center'}>
              <Typography color="error" variant="body2">
                ※マスタは無効にできません。登録画面で無効化してください
                <br />
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
            {theBumons!.length < 1 && <Typography>該当するデータがありません</Typography>}
            {theBumons!.length > 0 && (
              <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
                <MasterTable
                  headers={BumonsMHeader}
                  datas={theBumons!.map((l) => ({ id: l.bumonId!, name: l.bumonNam, ...l }))}
                  handleOpenDialog={handleOpenDialog}
                  page={page}
                  rowsPerPage={rowsPerPage}
                />
              </TableContainer>
            )}
          </>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <BumonsMasterDialog handleClose={handleCloseDialog} bumonId={openId} refetchBumons={refetchBumons} />
        </Dialog>
      </Box>
    </>
  );
};
