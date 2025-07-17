import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { MasterTable } from '../../_ui/tables';
import { daibumonMHeader } from '../_lib/datas';
import { getFilteredDaibumons } from '../_lib/funcs';
import { DaibumonsMasterTableValues } from '../_lib/types';
import { DaibumonsMasterDialog } from './daibumons-master-dialog';

/**
 * 大部門マスタテーブル
 * @param
 * @returns {JSX.Element} 大部門マスタテーブルコンポーネント
 */
export const DaibumonsMasterTable = ({
  daibumons,
  isLoading,
  setIsLoading,
}: {
  daibumons: DaibumonsMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState --------------------------------------- */
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ダイアログ開く大部門のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /*  */
  const [theDaibumons, setTheDaibumons] = useState<DaibumonsMasterTableValues[] | undefined>(daibumons);
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
  const refetchDaibumons = async () => {
    setIsLoading(true);
    const updated = await getFilteredDaibumons('');
    setTheDaibumons(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheDaibumons(daibumons); // 親からのDaibumonsが更新された場合に同期
  }, [daibumons]);

  useEffect(() => {
    setIsLoading(false); //theDaibumonsが変わったらローディング終わり
  }, [theDaibumons, setIsLoading]);

  // 表示するデータ
  const list = useMemo(
    () =>
      theDaibumons && rowsPerPage > 0
        ? theDaibumons.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : theDaibumons,
    [page, rowsPerPage, theDaibumons]
  );

  return (
    <>
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
        {isLoading ? (
          <Loading />
        ) : (
          <>
            {list!.length < 1 && <Typography>該当するデータがありません</Typography>}
            {list!.length > 0 && (
              <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
                <MasterTable
                  headers={daibumonMHeader}
                  datas={list!.map((l) => ({ id: l.daibumonId!, name: l.daibumonNam, ...l }))}
                  handleOpenDialog={handleOpenDialog}
                  page={page}
                  rowsPerPage={rowsPerPage}
                />
              </TableContainer>
            )}
          </>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <DaibumonsMasterDialog
            handleClose={handleCloseDialog}
            daibumonId={openId}
            refetchDaibumons={refetchDaibumons}
          />
        </Dialog>
      </Box>
    </>
  );
};
