'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { lMHeader } from '../_lib/datas';
import { getFilteredLocs } from '../_lib/funcs';
import { LocsMasterTableValues } from '../_lib/types';
import { LocationsMasterDialog } from './locations-master-dialog';

/**
 * 車両マスタテーブル
 * @param
 * @returns {JSX.Element} 車両マスタのテーブルコンポーネント
 */
export const LocationsMasterTable = ({
  locs,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  locs: LocsMasterTableValues[] | undefined;
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /* テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* useState ------------------------------------------------ */
  /* ダイアログ開く公演場所のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 場所リスト */
  const [theLocs, setTheLocs] = useState<LocsMasterTableValues[] | undefined>(locs);

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
  const refetchLocs = async () => {
    setIsLoading(true);
    const updated = await getFilteredLocs();
    setTheLocs(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheLocs(locs); // 親からのlocsが更新された場合に同期
  }, [locs]);

  useEffect(() => {
    setIsLoading(false); //theLocsが変わったらローディング終わり
  }, [theLocs, setIsLoading]);

  return (
    <Box>
      <Typography pt={1} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={theLocs!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
      ) : !theLocs || theLocs!.length === 0 ? (
        <Typography>該当するデータがありません</Typography>
      ) : (
        <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
          <MasterTable
            headers={lMHeader}
            datas={theLocs!.map((l) => ({
              ...l,
              id: l.locId,
              name: l.locNam,
              address: `${l.adrShozai}${l.adrTatemono}${l.adrSonota}`,
            }))}
            handleOpenDialog={handleOpenDialog}
            page={page}
            rowsPerPage={rowsPerPage}
          />
        </TableContainer>
      )}
      <Dialog open={dialogOpen} fullScreen>
        <LocationsMasterDialog handleClose={handleCloseDialog} locationId={openId} refetchLocs={refetchLocs} />
      </Dialog>
    </Box>
  );
};
