'use client';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {} from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../_ui/table-pagination';
import { MasterTable } from '../../_ui/tables';
import { mMHeader } from '../_lib/data';
import { ManagersMasterTableValues } from '../_lib/types';
import { ManagerMasterDialog } from './managers-master-dialog';

/**
 * 担当者マスタのテーブル
 * @returns {JSX.Element} 担当者マスタのテーブルコンポーネント
 */
export const ManagerssMasterTable = ({
  managers,
  isLoading,
  setIsLoading,
}: {
  managers: ManagersMasterTableValues[] | undefined;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* 1ページごとの表示数 */
  const rowsPerPage = 50;
  /* useState
   * -------------------------------------------------------- */
  /* ダイアログ開く顧客のID、閉じるとき、未選択で-100とする */
  const [openId, setOpenID] = useState(-100);
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /* 担当者リスト */
  const [theManagers, setTheManagers] = useState(managers);
  /* Methods
  ------------------------------------------------------------ */
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
  const refetchManagers = async () => {
    setIsLoading(true);
    // const updated = await GetFilteredmanagers('');
    // setThemanagers(updated);
    setIsLoading(false);
  };

  useEffect(() => {
    setTheManagers(managers); // 親からのManagersが更新された場合に同期
  }, [managers]);

  useEffect(() => {
    setIsLoading(false); //theManagersが変わったらローディング終わり
  }, [theManagers, setIsLoading]);

  /* 表示する担当者リスト */
  const list = useMemo(
    () =>
      rowsPerPage > 0 ? theManagers!.slice((page - 1) * rowsPerPage, page * rowsPerPage + rowsPerPage) : theManagers,
    [page, rowsPerPage, theManagers]
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
              headers={mMHeader}
              datas={list!.map((l) => ({ ...l, id: l.tantouId, name: l.tantouNam }))}
              page={page}
              rowsPerPage={rowsPerPage}
              handleOpenDialog={handleOpenDialog}
            />
            <Dialog open={dialogOpen} fullScreen>
              <ManagerMasterDialog
                managerId={openId}
                handleClose={handleCloseDialog}
                refetchManagers={refetchManagers}
              />
            </Dialog>
          </>
        )}
      </TableContainer>
    </Box>
  );
};
