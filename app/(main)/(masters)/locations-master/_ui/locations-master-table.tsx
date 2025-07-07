'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/table';
// import { GetFilteredLocs } from '../_lib/funcs';
import { lMHeader, LocMasterTableValues } from '../_lib/types';
import { LocationsMasterDialog } from './locations-master-dialog';

/**
 * 車両マスタのテーブル
 * @returns {JSX.Element} 車両マスタのテーブルコンポーネント
 */
export const LocationsMasterTable = ({
  locs,
  isLoading,
  setIsLoading,
}: {
  locs: LocMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* テーブル1ページの行数 */
  const rowsPerPage = 50;
  /* useState ------------------------------------------------ */
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ダイアログ開く公演場所のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  const [theLocs, setTheLocs] = useState<LocMasterTableValues[] | undefined>(locs);

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
    // const updated = await GetFilteredLocs('');
    // setTheLocs(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheLocs(locs); // 親からのlocsが更新された場合に同期
  }, [locs]);

  useEffect(() => {
    setIsLoading(false); //theLocsが変わったらローディング終わり
  }, [theLocs, setIsLoading]);

  // 表示するデータ
  const list = useMemo(
    () => (theLocs && rowsPerPage > 0 ? theLocs.slice((page - 1) * rowsPerPage, page * rowsPerPage) : theLocs),
    [page, rowsPerPage, theLocs]
  );

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
          <Grid2>
            <Typography color="error" variant="body2">
              ※マスタは削除できません。登録画面で削除フラグを付けてください
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
      <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
        {isLoading ? (
          <Loading />
        ) : (
          <>
            <MasterTable
              headers={lMHeader}
              datas={list!.map((l) => ({
                ...l,
                id: l.locId,
                name: l.locNam,
                address: `${l.adrShozai}${l.adrTatemono}${l.adrSonota}`,
              }))}
              handleOpenDialog={handleOpenDialog}
              page={page}
              rowsPerPage={rowsPerPage}
            />
            <Dialog open={dialogOpen} fullScreen>
              <LocationsMasterDialog handleClose={handleCloseDialog} locationId={openId} refetchLocs={refetchLocs} />
            </Dialog>
          </>
        )}
      </TableContainer>
    </Box>
  );
};
