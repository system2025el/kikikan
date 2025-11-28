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
  MenuItem,
  Paper,
  Select,
  Stack,
  TableContainer,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useState } from 'react';
import { Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTable } from '../../_ui/tables';
import { bumonsMHeader } from '../_lib/datas';
import { getFilteredBumons } from '../_lib/funcs';
import { BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterDialog } from './bumons-master-dialog';

/**
 * 部門マスタ画面
 * @param {bumons} 部門リスト
 * @returns {JSX.Element} 部門マスタコンポーネント
 */
export const BumonsMaster = () => {
  /** 1ページごとの表示数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState -------------------------------------- */
  /** 表示する部門の配列 */
  const [bumons, setBumons] = useState<BumonsMasterTableValues[]>([]);
  /** 選択肢 */
  const [options, setOptions] = useState<{ d: SelectTypes[]; s: SelectTypes[] }>({ d: [], s: [] });
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);
  /** ダイアログ開く部門のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /** 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* useForm ---------------------------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: { query: '', daibumonQuery: FAKE_NEW_ID, shukeiQuery: FAKE_NEW_ID },
  });

  /* methods ---------------------------------------- */
  /** 検索ボタン押下 */
  const onSubmit = async (data: { query: string | undefined; daibumonQuery: number; shukeiQuery: number }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredBumons({
      q: data.query!,
      d: data.daibumonQuery === FAKE_NEW_ID ? null : data.daibumonQuery,
      s: data.shukeiQuery === FAKE_NEW_ID ? null : data.shukeiQuery,
    });
    setPage(1);
    setBumons(newList?.data);
    setIsLoading(false);
    console.log('theLocs : ', bumons);
  };
  /** 選んだ部門ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /** ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /** 情報が変わったときに更新される */
  const refetchBumons = async () => {
    setIsLoading(true);
    const searchParams = getValues();
    const updated = await getFilteredBumons({
      q: searchParams.query!,
      d: searchParams.daibumonQuery === FAKE_NEW_ID ? null : searchParams.daibumonQuery,
      s: searchParams.shukeiQuery === FAKE_NEW_ID ? null : searchParams.shukeiQuery,
    });
    setBumons(updated?.data);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredBumons();
      setBumons(dataList.data);
      setOptions(dataList.options);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>部門マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} px={2} py={1}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack alignItems={'center'}>
              <Typography noWrap width={140}>
                部門名キーワード
              </Typography>
              <TextFieldElement name="query" control={control} />
            </Stack>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack mt={1} spacing={1}>
                <Typography noWrap width={140}>
                  大部門名
                </Typography>
                <Controller
                  name="daibumonQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.d].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.id}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <Box width={50}></Box>
                <Typography noWrap width={100}>
                  集計部門名
                </Typography>
                <Controller
                  name="shukeiQuery"
                  control={control}
                  defaultValue={0}
                  render={({ field }) => (
                    <Select {...field} sx={{ width: 250 }}>
                      {[selectNone, ...options!.s].map((opt) => (
                        <MenuItem
                          key={opt.id}
                          value={opt.id}
                          sx={opt.id === FAKE_NEW_ID ? { color: grey[600] } : undefined}
                        >
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  )}
                />
              </Stack>
              <Box alignSelf={'end'}>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={bumons ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
        ) : !bumons || bumons.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTable
              headers={bumonsMHeader}
              datas={bumons.map((l) => ({ ...l, id: l.bumonId, name: l.bumonNam }))}
              handleOpenDialog={handleOpenDialog}
              page={page}
              rowsPerPage={rowsPerPage}
            />
          </TableContainer>
        )}
        <Dialog open={dialogOpen} fullScreen>
          <BumonsMasterDialog handleClose={handleCloseDialog} bumonId={openId} refetchBumons={refetchBumons} />
        </Dialog>
      </Box>
    </Container>
  );
};
