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
import { CheckboxElement, Controller, TextFieldElement, useForm } from 'react-hook-form-mui';

import { selectNone, SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../_lib/constants';
import { MasterTableOfEqpt } from '../../_ui/tables';
import { eqptMHeader } from '../_lib/datas';
import { getFilteredEqpts } from '../_lib/funcs';
import { EqptsMasterTableValues } from '../_lib/types';
import { EqMasterDialog } from './eqpt-master-dialog';

export const EqptMaster = () => {
  /* テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* useState ------------------------------------------------- */
  /** 表示する機材の配列 */
  const [eqpts, setEqpts] = useState<EqptsMasterTableValues[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** ローディング */
  const [isLoading, setIsLoading] = useState(true);
  /** 選択肢 */
  const [options, setOptions] = useState<{ d: SelectTypes[]; s: SelectTypes[]; b: SelectTypes[] }>({
    d: [],
    s: [],
    b: [],
  });
  /* ダイアログ開く機材のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<number>(FAKE_NEW_ID);
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /** 検索useForm-------------------------- */
  const { control, handleSubmit, getValues } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      query: '',
      bumonQuery: FAKE_NEW_ID,
      daibumonQuery: FAKE_NEW_ID,
      shukeiQuery: FAKE_NEW_ID,
      ngFlg: false,
    },
  });

  /* methods ------------------------------------------ */
  /** 検索ボタン押下時 */
  const onSubmit = async (data: {
    query: string | undefined;
    bumonQuery: number;
    daibumonQuery: number;
    shukeiQuery: number;
    ngFlg: boolean;
  }) => {
    setIsLoading(true);
    console.log('data : ', data);
    const newList = await getFilteredEqpts({
      q: data.query!,
      d: data.daibumonQuery === FAKE_NEW_ID ? null : data.daibumonQuery,
      s: data.shukeiQuery === FAKE_NEW_ID ? null : data.shukeiQuery,
      b: data.bumonQuery === FAKE_NEW_ID ? null : data.bumonQuery,
      ngFlg: data.ngFlg,
    });
    setPage(1);
    setEqpts(newList?.data);
    setIsLoading(false);
    console.log('theEqpt : ', eqpts);
  };

  /** 詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: number) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /** ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /** 情報が変わったときに更新される */
  const refetchEqpts = async () => {
    setIsLoading(true);
    const searchParams = getValues();
    const updated = await getFilteredEqpts({
      q: searchParams.query!,
      d: searchParams.daibumonQuery === FAKE_NEW_ID ? null : searchParams.daibumonQuery,
      s: searchParams.shukeiQuery === FAKE_NEW_ID ? null : searchParams.shukeiQuery,
      b: searchParams.bumonQuery === FAKE_NEW_ID ? null : searchParams.bumonQuery,
      ngFlg: searchParams.ngFlg,
    });
    setEqpts(updated?.data);
    setIsLoading(false);
  };

  /* useEffect ----------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const dataList = await getFilteredEqpts();
      setEqpts(dataList.data);
      setOptions(dataList.options);
      setIsLoading(false);
    };
    getList();
  }, []);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>機材マスタ一覧</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2} component={'form'} onSubmit={handleSubmit(onSubmit)}>
          <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
            <Stack>
              <Typography noWrap>機材名キーワード</Typography>
              <TextFieldElement name={'query'} control={control} />
            </Stack>
          </Stack>
          <Grid2 container justifyContent={'space-between'} alignItems={'start'} mt={1} spacing={1}>
            <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
              <Typography width={100}>部門</Typography>
              <Controller
                name="bumonQuery"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <Select {...field} sx={{ width: 250 }}>
                    {[selectNone, ...options!.b!].map((opt) => (
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
            </Grid2>
            <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
              <Typography width={100}>大部門</Typography>
              <Controller
                name="daibumonQuery"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <Select {...field} sx={{ width: 250 }}>
                    {[selectNone, ...options!.d!].map((opt) => (
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
            </Grid2>
            <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
              <Typography width={100}>集計部門</Typography>
              <Controller
                name="shukeiQuery"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <Select {...field} sx={{ width: 250 }}>
                    {[selectNone, ...options!.s!].map((opt) => (
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
            </Grid2>
          </Grid2>
          <Grid2 container alignItems={'center'} justifyContent={'space-between'} mt={1}>
            <Grid2 size={'grow'} display={'flex'} alignItems={'center'}>
              <Typography width={100}>NG有</Typography>
              <CheckboxElement name="ngFlg" control={control} />
            </Grid2>
            <Grid2 size={1}>
              <Box mt={1} alignSelf={'end'} justifySelf={'end'}>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Grid2>
          </Grid2>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={eqpts ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
        ) : !eqpts || eqpts.length === 0 ? (
          <Typography>該当するデータがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            <MasterTableOfEqpt
              headers={eqptMHeader}
              datas={eqpts.map((l) => ({
                ...l,
                id: l.kizaiId,
                name: l.kizaiNam,
              }))}
              page={page}
              rowsPerPage={rowsPerPage}
              handleOpenDialog={handleOpenDialog}
            />
          </TableContainer>
        )}

        <Dialog open={dialogOpen} fullScreen>
          <EqMasterDialog handleClose={handleCloseDialog} eqptId={openId} refetchEqpts={refetchEqpts} />
        </Dialog>
      </Box>
    </Container>
  );
};
