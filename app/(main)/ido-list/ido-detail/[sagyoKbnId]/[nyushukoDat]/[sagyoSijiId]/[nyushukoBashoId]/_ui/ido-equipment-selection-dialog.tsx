'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { SetStateAction, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';

import { checkSetoptions, getIdoEqptsForEqptSelection, getIdoSelectedEqpts } from '../_lib/funcs';
import { IdoEqptSelection, SelectedIdoEqptsValues } from '../_lib/types';
import { IdoEqptBumonsTable } from './ido-equipment-bumons-table';
import { IdoEqptTable } from './ido-equipments-table';

export const IdoEqptSelectionDialog = ({
  setEqpts,
  handleCloseDialog,
}: {
  setEqpts: (data: SelectedIdoEqptsValues[]) => void;
  handleCloseDialog: () => void;
}) => {
  /* useState ------------------------- */
  /* 選ばれている機材の配列 */
  const [selectedEqptIds, setSelectedEqptIds] = useState<number[]>([]);
  /* セットオプションのダイアログ開閉 */
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  /* 選択されている部門 */
  const [selectedBumon, setSelectedBumon] = useState(-100);
  /* 機材リスト全体 */
  const [theEqpts, setTheEqpts] = useState<IdoEqptSelection[]>([]);
  /* 検索中かどうか */
  const [searching, setSearching] = useState<boolean>(false);
  /* Loadingかどうか */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /* セットオプションのデータ配列 */
  const [bundles, setBundles] = useState<IdoEqptSelection[]>([]);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useform ------------------------------- */
  const { handleSubmit, control } = useForm({ defaultValues: { query: '' } });

  /* methods ------------------------------ */
  /* 確定ボタン押下時 */
  const handleClickConfirm = async () => {
    setIsLoading(true);
    try {
      const setList = await checkSetoptions(selectedEqptIds);
      if (setList.length !== 0) {
        setBundles(setList);
        setBundleDialogOpen(true);
      } else {
        // selectedEqptIdsが今回選んだ全機材であるので、idをもとに機材情報を取得しダイアログを閉じたい
        const data = await getIdoSelectedEqpts(selectedEqptIds);
        console.log('最終的に渡される機材の配列データ: ', data!);
        setEqpts(data!);
        handleCloseDialog();
      }
    } catch (e) {
      setSnackBarMessage('データ取得に失敗しました');
      setSnackBarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  /* セットオプションダイアログを閉じる */
  const handleCloseBundle = () => {
    setBundles([]);
    setBundleDialogOpen(false);
    handleCloseDialog();
  };

  /* 機材を選択する処理 */
  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selectedEqptIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedEqptIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedEqptIds.slice(1));
    } else if (selectedIndex === selectedEqptIds.length - 1) {
      newSelected = newSelected.concat(selectedEqptIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedEqptIds.slice(0, selectedIndex),
        selectedEqptIds.slice(selectedIndex + 1)
      );
    }
    setSelectedEqptIds(newSelected);
  };

  /* 部門の行を押下時処理 */
  const handleClickBumon = (id: number) => {
    setSelectedBumon(id);
    setSearching(false);
  };

  /* 検索ボタン押下時処理 */
  const onSubmit = async (data: { query: string }) => {
    console.log('Push search', data.query);
    setIsLoading(true);
    setSearching(true);
    setSelectedBumon(-100);
    try {
      if (data.query.trim() === '') {
        const a = await getIdoEqptsForEqptSelection('');
        console.log('機材リスト[0]: ', a![0]);
        setTheEqpts(a!);
      } else {
        const a = await getIdoEqptsForEqptSelection(data.query);
        console.log('機材リスト[0]: ', a![0]);
        setTheEqpts(a!);
      }
    } catch (e) {
      setSnackBarMessage('データ取得に失敗しました');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
  };

  /* useeffect -------------------------------------- */
  useEffect(() => {
    setIsLoading(true);
    setSearching(false);
    const getEqpts = async () => {
      try {
        const a = await getIdoEqptsForEqptSelection('');
        console.log('最初の機材リスト[0]: ', a![0]);
        setTheEqpts(a!);
      } catch (e) {
        setSnackBarMessage('データ取得に失敗しました');
        setSnackBarOpen(true);
      }
    };
    getEqpts();
    setIsLoading(false);
  }, []);

  return (
    <>
      <Container disableGutters sx={{ pt: 1, px: 2, maxHeight: '100vh' }} maxWidth={'xl'}>
        <Box justifySelf={'end'} mb={0.5}>
          <Button onClick={() => handleCloseDialog()}>戻る</Button>
        </Box>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} px={2}>
            <Typography>機材選択</Typography>
          </Box>
          <Divider />
          <Box width={'100%'} px={2} pb={1}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
                <Stack alignItems={'baseline'}>
                  <Typography>機材名キーワード</Typography>
                  <TextFieldElement name="query" control={control} />
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
        <Box display={'flex'} p={0.5} justifyContent={'end'}>
          <Button
            onClick={() => handleClickConfirm()}
            disabled={selectedEqptIds.length === 0 ? true : false}
            loading={isLoading}
          >
            確定
          </Button>
          <Dialog open={bundleDialogOpen} onClose={() => setBundleDialogOpen(false)}>
            <IdoBundleDialog
              handleClose={handleCloseBundle}
              bundles={bundles}
              isLoading={isLoading}
              selectedEqpts={selectedEqptIds}
              setEqpts={setEqpts}
            />
          </Dialog>
        </Box>

        <Grid2 container display={'flex'} pb={2} spacing={1} justifyContent={'space-between'}>
          <Grid2 size={5}>
            <IdoEqptBumonsTable selected={selectedBumon} handleClick={handleClickBumon} />
          </Grid2>
          <Grid2 size={7}>
            <IdoEqptTable
              selectedEqpt={selectedEqptIds}
              datas={theEqpts}
              handleSelect={handleClick}
              bumonId={selectedBumon}
              searching={searching}
              isLoading={isLoading}
            />
          </Grid2>
        </Grid2>
      </Container>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
};

/**
 * 機材のセットオプションを選ぶダイアログ
 * @param param0
 * @returns 機材のセットオプションを選ぶダイアログコンポーネント
 */
const IdoBundleDialog = ({
  bundles,
  isLoading,
  selectedEqpts,
  handleClose,
  setEqpts,
}: {
  bundles: IdoEqptSelection[];
  isLoading: boolean;
  selectedEqpts: number[];
  handleClose: () => void;
  setEqpts: (data: SelectedIdoEqptsValues[]) => void;
}) => {
  /* useState ------------------------------------------ */
  /* 選択される機材のidのリスト */
  const [selected, setSelected] = useState<number[]>([]);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* methods -------------------------------------------------------- */
  /* 行押下時（選択時）の処理 */
  const handleSelectBundles = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  /* 確定ボタン押下時 */
  const handleClickConfirm = async () => {
    try {
      const data = await getIdoSelectedEqpts([...selectedEqpts, ...selected]);
      console.log('最終的に渡される機材の配列データ: ', data!);
      setEqpts(data!);
      handleClose();
    } catch (e) {
      setSnackBarMessage('データ取得に失敗しました');
      setSnackBarOpen(true);
    }
  };

  return (
    <>
      <DialogTitle justifyContent={'space-between'} display={'flex'}>
        セットオプション
        <Box>
          <Button onClick={() => handleClickConfirm()}>確定</Button>
        </Box>
      </DialogTitle>
      <DialogContent>
        <TableContainer component={Paper} sx={{ width: 500 }}>
          {isLoading ? (
            <Loading />
          ) : (
            <Table stickyHeader padding="none">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell>機材名</TableCell>
                  <TableCell>在庫場所</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bundles!.map((row, index) => {
                  const isItemSelected = selected.includes(row.kizaiId);
                  const labelId = `enhanced-table-checkbox-${index}`;
                  const nextRow = bundles![index + 1];
                  const rows = [];
                  rows.push(
                    <TableRow
                      hover
                      onClick={(event) => handleSelectBundles(event, row.kizaiId)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.kizaiId}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox color="primary" checked={isItemSelected} />
                      </TableCell>
                      <TableCell component="th" id={labelId} scope="row" padding="none">
                        {row.kizaiNam}
                      </TableCell>
                      <TableCell>{row.shozokuNam}</TableCell>
                    </TableRow>
                  );
                  // 次のkizaiGrpCodが異なるなら区切り行を追加
                  if (!nextRow || row.kizaiGrpCod !== nextRow.kizaiGrpCod) {
                    rows.push(
                      <TableRow key={`divider-${index}`}>
                        <TableCell colSpan={3}>
                          <Box height={10} width={'100%'} alignContent={'center'}>
                            <Divider sx={{ borderStyle: 'dashed', borderColor: 'CaptionText', borderBottomWidth: 2 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return rows;
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </DialogContent>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
    </>
  );
};
