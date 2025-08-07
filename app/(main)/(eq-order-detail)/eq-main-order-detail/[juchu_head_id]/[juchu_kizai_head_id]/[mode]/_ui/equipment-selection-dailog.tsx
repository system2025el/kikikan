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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';
import { CheckSetoptions } from '@/app/(main)/(masters)/_lib/funs';
import { getEqptsForEqptSelection } from '@/app/(main)/(masters)/eqpt-master/_lib/funcs';

import { bundleData } from '../_lib/eqdata';
import { EqptBumonsTable } from './equipment-bumons-table';
import { EqptTable } from './equipments-table';

export const EqptSelectionDialog = ({ handleCloseDialog }: { handleCloseDialog: () => void }) => {
  /* useState ------------------------- */
  /* 選ばれている機材の配列 */
  const [selectedEqpt, setSelectedEqpt] = useState<number[]>([]);
  /* セットオプションのダイアログ開閉 */
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  /* 選択されている部門 */
  const [selectedBumon, setSelectedBumon] = useState(-100);
  /* 機材リスト全体 */
  const [theEqpts, setTheEqpts] = useState<EqptSelection[]>([]);
  /* 検索中かどうか */
  const [searching, setSearching] = useState<boolean>(false);
  /* Loadingかどうか */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /* セットオプションのデータ配列 */
  const [bundles, setBundles] = useState<EqptSelection[]>([]);

  /* useform ------------------------------- */
  const { handleSubmit, control, watch, getValues } = useForm({ defaultValues: { query: '' } });

  /* methods ------------------------------ */
  /* 確定ボタン押下時 */
  const handleClickConfirm = async () => {
    const setList = await CheckSetoptions(selectedEqpt);
    if (setList.length !== 0) {
      setBundles(setList);
      setBundleDialogOpen(true);
    } else {
      // selectedEqptが今回選んだ全機材であるので、ダイアログを閉じる
      handleCloseDialog();
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
    const selectedIndex = selectedEqpt.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedEqpt, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedEqpt.slice(1));
    } else if (selectedIndex === selectedEqpt.length - 1) {
      newSelected = newSelected.concat(selectedEqpt.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selectedEqpt.slice(0, selectedIndex), selectedEqpt.slice(selectedIndex + 1));
    }
    setSelectedEqpt(newSelected);
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
    if (data.query.trim() === '') {
      const a = await getEqptsForEqptSelection('');
      console.log('機材リストだあああああああああああああああああ', a![0]);
      setTheEqpts(a!);
    } else {
      const a = await getEqptsForEqptSelection(data.query);
      console.log('機材リストだあああああああああああああああああ', a![0]);
      setTheEqpts(a!);
    }
    setIsLoading(false);
  };

  /* useeffect -------------------------------------- */
  useEffect(() => {
    setIsLoading(true);
    setSearching(false);
    console.log('★★★★★★★★★★★★★★★★★★★★★');
    const getEqpts = async () => {
      const a = await getEqptsForEqptSelection('');
      console.log('最初の機材リスト＝＝＝＝＝＝＝＝＝1個目→', a![0]);
      setTheEqpts(a!);
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
          <Box width={'100%'} display={'flex'} p={2}>
            <Typography>顧客マスタ検索</Typography>
          </Box>
          <Divider />
          <Box width={'100%'} px={2} pb={1}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
                <Stack alignItems={'baseline'}>
                  <Typography>キーワード</Typography>
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
          <Button onClick={() => handleClickConfirm()} disabled={selectedEqpt.length === 0 ? true : false}>
            確定
          </Button>
          <Dialog open={bundleDialogOpen} onClose={() => setBundleDialogOpen(false)}>
            <BundleDialog handleClose={handleCloseBundle} bundles={bundles} isLoading={isLoading} />
          </Dialog>
        </Box>

        <Grid2 container display={'flex'} pb={2} spacing={1} justifyContent={'space-between'}>
          <Grid2 size={5}>
            <EqptBumonsTable selected={selectedBumon} handleClick={handleClickBumon} />
          </Grid2>
          <Grid2 size={7}>
            <EqptTable
              selectedEqpt={selectedEqpt}
              datas={theEqpts}
              handleSelect={handleClick}
              bumonId={selectedBumon}
              searching={searching}
              isLoading={isLoading}
            />
          </Grid2>
        </Grid2>
      </Container>
    </>
  );
};

/**
 * 機材のセットオプションを選ぶダイアログ
 * @param param0
 * @returns 機材のセットオプションを選ぶダイアログコンポーネント
 */
const BundleDialog = ({
  bundles,
  isLoading,
  handleClose,
}: {
  bundles: EqptSelection[];
  isLoading: boolean;
  handleClose: () => void;
}) => {
  const [selected, setSelected] = useState<readonly number[]>([]);
  const handleClick = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

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

  return (
    <>
      <DialogTitle justifyContent={'space-between'} display={'flex'}>
        セットオプション
        <Box>
          <Button onClick={() => handleClose()}>確定</Button>
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

                  const rowsToRender = [];

                  rowsToRender.push(
                    <TableRow
                      hover
                      onClick={(event) => handleClick(event, row.kizaiId)}
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
                    rowsToRender.push(
                      <TableRow key={`divider-${index}`}>
                        <TableCell colSpan={3}>
                          <Box height={10} width={'100%'} alignContent={'center'}>
                            <Divider sx={{ borderStyle: 'dashed', borderColor: 'CaptionText', borderBottomWidth: 2 }} />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return rowsToRender;
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      </DialogContent>
    </>
  );
};

export type EqptSelection = {
  kizaiId: number;
  kizaiNam: string;
  shozokuNam: string;
  bumonId: number;
  kizaiGrpCod: string;
};
