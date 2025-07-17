'use client';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Dialog, Divider, Grid2, Paper, TableContainer, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/tables';
import { bMHeader } from '../_lib/datas';
import { BasesMasterTableValues } from '../_lib/types';
import { BasesMasterDialog } from './bases-master-dailog';

/**
 * 拠点マスタテーブル
 * @param
 * @returns {JSX.Element} 拠点マスタテーブルコンポーネント
 */
export const BasesMasterTable = ({
  bases,
  isLoading,
  setIsLoading,
}: {
  bases: BasesMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState --------------------------------------- */
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState<number>(-100);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 拠点リスト */
  const [theBases, setTheBases] = useState<BasesMasterTableValues[] | undefined>(bases);
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
  const refetchBases = async () => {
    setIsLoading(true);
    // const updated = await getFilteredBases('');
    // setTheBases(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheBases(bases); // 親からのBasesが更新された場合に同期
  }, [bases]);

  useEffect(() => {
    setIsLoading(false); //theBasesが変わったらローディング終わり
  }, [theBases, setIsLoading]);

  // 表示するデータ
  const list = useMemo(
    () =>
      theBases && rowsPerPage > 0
        ? theBases.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage)
        : theBases,
    [page, rowsPerPage, theBases]
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
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
          {isLoading ? (
            <Loading />
          ) : (
            <>
              <MasterTable
                headers={bMHeader}
                datas={list!.map((l) => ({ id: l.kyotenId!, name: l.kyotenNam, ...l }))}
                handleOpenDialog={handleOpenDialog}
                page={page}
                rowsPerPage={rowsPerPage}
              />
              <Dialog open={dialogOpen} fullScreen>
                <BasesMasterDialog handleClose={handleCloseDialog} baseId={openId} refetchBases={refetchBases} />
              </Dialog>
            </>
          )}
        </TableContainer>
      </Box>
    </>
  );
};
