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
  TableContainer,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { shukeibumonMHeader } from '../_lib/datas';
import { getFilteredShukeibumons } from '../_lib/funcs';
import { ShukeibumonsMasterTableValues } from '../_lib/types';
import { ShukeibumonsMasterDialog } from './shukeibumons-master-dialog';

/**
 * 集計部門マスタ
 * @param {shukeibumons} 集計部門リスト配列
 * @returns {JSX.Element} 集計部門マスタコンポーネント
 */
export const ShukeibumonsMaster = () => {
  /* 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState ---------------------------------------- */
  /** 表示する集計部門の配列 */
  const [shukeibumons, setShukeibumons] = useState<ShukeibumonsMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);
  /* ダイアログ開く集計部門のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* useForm --------------------------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '' },
  });

  /* methods --------------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredShukeibumons(data.query!);
    setPage(1);
    setShukeibumons(newList);
    setIsLoading(false);
    console.log('theLocs : ', shukeibumons);
  };

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
    const searchParams = getValues();
    const updated = await getFilteredShukeibumons(searchParams.query);
    setShukeibumons(updated);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredShukeibumons();
      setShukeibumons(dataList);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>集計部門マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2} component={'form'} onSubmit={handleSubmit(onSubmit)}>
          <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
            <Stack alignItems={'baseline'}>
              <Typography noWrap width={200}>
                集計部門名キーワード
              </Typography>
              <TextFieldElement name="query" control={control} helperText={''} />
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
            <MuiTablePagination
              arrayList={shukeibumons ?? []}
              rowsPerPage={rowsPerPage}
              page={page}
              setPage={setPage}
            />
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
        ) : !shukeibumons || shukeibumons.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTable
              headers={shukeibumonMHeader}
              datas={shukeibumons.map((l) => ({
                ...l,
                id: l.shukeibumonId,
                name: l.shukeibumonNam,
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
    </Container>
  );
};
