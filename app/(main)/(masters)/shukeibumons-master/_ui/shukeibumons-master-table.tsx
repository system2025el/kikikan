import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { NEW_MASTER_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { shukeibumonMHeader } from '../_lib/datas';
import { getFilteredShukeibumons } from '../_lib/funcs';
import { ShukeibumonsMasterDialogValues, ShukeibumonsMasterTableValues } from '../_lib/types';
import { ShukeibumonsMasterDialog } from './shukeibumons-master-dialog';

/**
 * 集計部門マスタテーブル
 * @param {shukeibumons}
 * @returns {JSX.Element} 集計部門マスタテーブルコンポーネント
 */
export const ShukeibumonsMasterTable = ({
  shukeibumons,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  shukeibumons: ShukeibumonsMasterTableValues[] | undefined;
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* useState --------------------------------------- */
  /* ダイアログ開く集計部門のID、閉じるとき、未選択でNEW_MASTER_IDとする */
  const [openId, setOpenID] = useState<number>(NEW_MASTER_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /*  */
  const [theShukeibumons, setTheShukeibumons] = useState(shukeibumons);
  /* methods ---------------------------------------- */
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
  const refetchShukeibumons = async () => {
    setIsLoading(true);
    const updated = await getFilteredShukeibumons();
    setTheShukeibumons(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheShukeibumons(shukeibumons); // 親からのShukeiBumonsが更新された場合に同期
  }, [shukeibumons]);

  useEffect(() => {
    setIsLoading(false); //theShukeiBumonsが変わったらローディング終わり
  }, [theShukeibumons, setIsLoading]);

  return (
    <>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={theShukeibumons!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
        ) : !theShukeibumons || theShukeibumons!.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTable
              headers={shukeibumonMHeader}
              datas={theShukeibumons!.map((l) => ({
                id: l.shukeibumonId,
                name: l.shukeibumonNam,
                ...l,
              }))}
              handleOpenDialog={handleOpenDialog}
              page={page}
              rowsPerPage={rowsPerPage}
            />
          </TableContainer>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <ShukeibumonsMasterDialog
            handleClose={handleCloseDialog}
            shukeibumonId={openId}
            refetchShukeibumons={refetchShukeibumons}
          />
        </Dialog>
      </Box>
    </>
  );
};
