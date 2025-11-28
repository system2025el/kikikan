'use client';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { LightTooltipWithText } from '../../_ui/tables';
import { userMHeader } from '../_lib/datas';
import { getFilteredUsers } from '../_lib/funcs';
import { UsersMasterTableValues } from '../_lib/types';
import { UsersMasterDialog } from './users-master-dialog';

/**
 * 担当者マスタ画面
 * @returns {JSX.Element} 担当者マスタ画面コンポーネント
 */
export const UsersMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState ------------------------------------------------ */
  /** 表示する担当者の配列 */
  const [users, setUsers] = useState<UsersMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログ開く顧客のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState(String(FAKE_NEW_ID));
  /* 顧客詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* 表示するリスト */
  const list = useMemo(
    () => (users && rowsPerPage > 0 ? users.slice((page - 1) * rowsPerPage, page * rowsPerPage) : users),
    [page, rowsPerPage, users]
  );
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - users!.length) : 0;

  /* useForm ----------------------------------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* methods ------------------------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredUsers(data.query!);
    setPage(1);
    setUsers(newList);
    setIsLoading(false);
    console.log('theLocs : ', users);
  };

  /** 詳細ダイアログを開く関数 */
  const handleOpenDialog = (mailAdr: string) => {
    setOpenID(mailAdr);
    setDialogOpen(true);
  };
  /** ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /** 情報が変わったときに更新される */
  const refetchUsers = async () => {
    setIsLoading(true);
    const searchParams = getValues();
    const updated = await getFilteredUsers(searchParams.query);
    setUsers(updated);
    setIsLoading(false);
  };

  /* useEffect ------------------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredUsers();
      setUsers(dataList);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>担当者マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} px={2} py={1} component={'form'} onSubmit={handleSubmit(onSubmit)}>
          <Stack justifyContent={'space-between'} alignItems={'start'}>
            <Stack alignItems={'baseline'}>
              <Typography>担当者名キーワード</Typography>
              <TextFieldElement name="query" control={control} helperText={'名前の部分一致検索'} />
            </Stack>
            <Box alignSelf={'end'}>
              <Button type="submit">
                <SearchIcon />
                検索
              </Button>
            </Box>
          </Stack>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={users ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={3} alignItems={'center'}>
            <Grid2>
              <Typography color="error" variant="body2">
                ※マスタは削除できません。登録画面で無効化してください
              </Typography>
            </Grid2>
            <Grid2>
              <Button onClick={() => handleOpenDialog(String(FAKE_NEW_ID))}>
                <AddIcon fontSize="small" />
                新規
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
        {isLoading ? (
          <Loading />
        ) : !users || users.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <Table sx={{ minWidth: '100%' }} aria-labelledby="tableTitle" padding="none" stickyHeader>
              <TableHead sx={{ bgcolor: 'primary.light' }}>
                <TableRow sx={{ whiteSpace: 'nowrap' }}>
                  <TableCell width={50} />
                  {userMHeader.map((h) => (
                    <TableCell key={h.key}>{h.label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {list!.map((l) => {
                  const isDeleted = l.delFlg === true;
                  return (
                    <TableRow hover key={l.tblDspId}>
                      <TableCell
                        width={50}
                        sx={{
                          bgcolor: isDeleted ? grey[300] : undefined,
                          paddingLeft: 1,
                          paddingRight: 1,
                          textAlign: 'end',
                        }}
                      >
                        {l.tblDspId}
                      </TableCell>
                      <TableCell sx={{ bgcolor: isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                        <Button
                          variant="text"
                          size="medium"
                          onClick={() => handleOpenDialog(l.mailAdr)}
                          sx={{ p: 0, m: 0, minWidth: 0 }}
                        >
                          <LightTooltipWithText variant={'button'} maxWidth={300}>
                            {l.tantouNam}
                          </LightTooltipWithText>
                        </Button>
                      </TableCell>
                      <TableCell sx={{ bgcolor: isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                        {l.mailAdr}
                      </TableCell>
                      <TableCell sx={{ bgcolor: isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                        {l.shainCod ?? ''}
                      </TableCell>
                      <TableCell sx={{ bgcolor: isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                        {l.mem}
                      </TableCell>
                      <TableCell sx={{ bgcolor: isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                        {l.lastLogin}
                      </TableCell>
                      <TableCell sx={{ bgcolor: isDeleted ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                        {isDeleted && <>無効</>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 25 * emptyRows }}>
                    <TableCell colSpan={userMHeader.length + 1} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog open={dialogOpen} fullScreen>
          <UsersMasterDialog currentMailAdr={openId} handleClose={handleCloseDialog} refetchUsers={refetchUsers} />
        </Dialog>
      </Box>
    </Container>
  );
};
