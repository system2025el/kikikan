'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { JSX, useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/tables';
import { vMHeader } from '../_lib/datas';
import { getFilteredVehs } from '../_lib/funcs';
import { VehsMasterTableValues } from '../_lib/types';
import { VehiclesMasterDialog } from './vehicles-master-dialog';

/**
 * 車両マスタテーブル
 * @param
 * @returns {JSX.Element} 車両マスタテーブルコンポーネント
 */
export const VehiclesMasterTable = ({
  vehs,
  isLoading,
  setIsLoading,
}: {
  vehs: VehsMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* テーブルの1ページのの行数 */
  const rowsPerPage = 50;
  /* useState ------------------------------- */
  /* 表示してるページ */
  const [page, setPage] = useState(1);
  /* ダイアログ開く車両のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 車両リスト */
  const [theVehs, setTheVehs] = useState<VehsMasterTableValues[] | undefined>(vehs);
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
    const updated = await getFilteredVehs('');
    setTheVehs(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheVehs(vehs); // 親からのVehsが更新された場合に同期
  }, [vehs]);

  useEffect(() => {
    setIsLoading(false); //theVehsが変わったらローディング終わり
  }, [theVehs, setIsLoading]);

  return (
    <Box>
      <Typography pt={2} pl={2}>
        一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={theVehs!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
      {isLoading ? (
        <Loading />
      ) : (
        <>
          {theVehs!.length < 1 && <Typography>該当するデータがありません</Typography>}
          {theVehs!.length > 0 && (
            <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
              <MasterTable
                headers={vMHeader}
                datas={theVehs!.map((l) => ({ id: l.sharyoId, name: l.sharyoNam, ...l }))}
                handleOpenDialog={handleOpenDialog}
                page={page}
                rowsPerPage={rowsPerPage}
              />
            </TableContainer>
          )}
        </>
      )}
      <Dialog open={dialogOpen} fullScreen>
        <VehiclesMasterDialog handleClose={handleCloseDialog} vehicleId={openId} refetchVehs={refetchVehs} />
      </Dialog>
    </Box>
  );
};
