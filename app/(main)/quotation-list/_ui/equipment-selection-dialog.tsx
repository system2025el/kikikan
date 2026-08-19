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
import { green } from '@mui/material/colors';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';

import { checkSetoptions, getEqptsForEqptSelection, getSelectedEqpts, getSetOptions } from '../_lib/funcs';
import { EqptGroup, EqptSelection, SelectedEqptsValues } from '../_lib/types';
import { EqptBumonsTable } from './equipment-bumons-table';
import { EqptTable } from './equipments-table';

/**
 * 見積の機材明細に機材マスタから検索して項目を追加するためのダイアログ
 * @param param0
 * @returns 機材選択ダイアログコンポーネント
 */
export const QuotEqptSelectionDialog = ({
  onSelect,
  handleCloseDialog,
}: {
  /** 機材選択画面で選ばれた機材配列を明細へ渡す関数 */
  onSelect: (data: SelectedEqptsValues[]) => void;
  /** 機材選択ダイアログを閉じる関数 */
  handleCloseDialog: () => void;
}) => {
  /* useState ------------------------- */
  /* 選ばれている機材の配列 */
  const [selectedEqptIds, setSelectedEqptIds] = useState<number[]>([]);
  /* 選択されている部門 */
  const [selectedBumon, setSelectedBumon] = useState(-100);
  /* 機材リスト全体 */
  const [theEqpts, setTheEqpts] = useState<EqptSelection[]>([]);
  /* 検索中かどうか */
  const [searching, setSearching] = useState<boolean>(false);
  /* Loadingかどうか */
  const [isLoading, setIsLoading] = useState<boolean>(false);
  /* セットオプション有機材のデータ配列 */
  const [eqptsWSet, setEqptsWSet] = useState<number[]>([]);
  /* セットオプションのダイアログ開閉 */
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
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
      // 選ばれた機材IDの配列からセットオプションの存在確認
      const setList = await checkSetoptions(selectedEqptIds);
      if (setList.length !== 0) {
        // セットオプション付きの機材があるとき
        setEqptsWSet(setList);
        setBundleDialogOpen(true);
      } else {
        // セットオプションがない時
        const data = await getSelectedEqpts(selectedEqptIds);
        onSelect(data!);
        handleCloseDialog();
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
  };

  /** セットオプションダイアログを閉じる */
  const handleCloseBundle = () => {
    setEqptsWSet([]);
    setBundleDialogOpen(false);
  };

  /** 機材を選択する処理 */
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

  /** 部門の行を押下時処理 */
  const handleClickBumon = (id: number) => {
    setSelectedBumon(id);
    setSearching(false);
  };

  /** 検索ボタン押下時処理 */
  const onSubmit = async (data: { query: string }) => {
    setIsLoading(true);
    setSearching(true);
    setSelectedBumon(-100);

    try {
      const a = await getEqptsForEqptSelection(data.query.trim());
      setTheEqpts(a!);
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
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
        const a = await getEqptsForEqptSelection('');
        setTheEqpts(a!);
      } catch (e) {
        setSnackBarMessage('サーバー接続エラー');
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
          <Box
            width={'100%'}
            px={2}
            pb={1}
            component={'form'}
            onSubmit={(e) => {
              // MUIのDialogはPortalでDOM上は親フォームの外に出るが、
              // submitイベントはReactツリーに沿ってバブリングするため、
              // 何もしないと親（見積本体）のonSubmit（保存処理）まで伝播してしまう
              e.stopPropagation();
              handleSubmit(onSubmit)(e);
            }}
          >
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'baseline'}>
                <Typography>機材名キーワード</Typography>
                <TextFieldElement name="query" control={control} />
              </Stack>
              <Box alignSelf={'end'}>
                <Button type="submit" loading={isLoading}>
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
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
          {eqptsWSet.length > 0 && (
            <BundleDialog
              open={bundleDialogOpen}
              handleConfirmAll={(selected: SelectedEqptsValues[]) => {
                onSelect(selected);
                handleCloseBundle();
                handleCloseDialog();
              }}
              handleCloseDialog={handleCloseBundle}
              eqptsWSet={eqptsWSet}
              eqptsAll={selectedEqptIds}
            />
          )}
        </Box>

        <Grid2 container display={'flex'} pb={2} spacing={1} justifyContent={'space-between'}>
          <Grid2 size={5}>
            <EqptBumonsTable selected={selectedBumon} handleClick={handleClickBumon} />
          </Grid2>
          <Grid2 size={7}>
            <EqptTable
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
        sx={{ marginTop: '65px' }}
      />
    </>
  );
};

/**
 * 機材のセットオプションを選ぶダイアログ
 * @param param0
 * @returns 機材のセットオプションを選ぶダイアログコンポーネント
 */
const BundleDialog = ({
  open,
  eqptsWSet,
  eqptsAll,
  handleConfirmAll,
  handleCloseDialog,
}: {
  open: boolean;
  /** セット有機材のID配列 */
  eqptsWSet: number[];
  eqptsAll: number[];
  /** 選んだ機材配列を画面に渡してダイアログをすべて閉じる */
  handleConfirmAll: (selected: SelectedEqptsValues[]) => void;
  /** セットオプションダイアログを閉じる */
  handleCloseDialog: () => void;
}) => {
  /** セット全体の機材配列 */
  const selectedEqptListRef = useRef<SelectedEqptsValues[]>([]);
  const hasRun = useRef(false);
  /* useState ------------------------------------------ */
  /** セットダイアログに表示する機材名 */
  const [oyaKizaiNam, setOyakizaiNam] = useState<string>('');
  /* 選択される機材のidのリスト */
  const [selected, setSelected] = useState<number[]>([]);
  /* 今開いてる機材ID配列のインデックス */
  const [currentIndex, setCurrentIndex] = useState(0);
  /* 表示するセットオプションの配列 */
  const [bundles, setBundles] = useState<EqptSelection[]>([]);
  /* ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* methods -------------------------------------------------------- */
  /** 行押下時（選択時）の処理 */
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

  /** 確定ボタン押下時 */
  const handleClickConfirm = async () => {
    setIsLoading(true);
    // 今機材が選択されてたら配列にpush
    if (selected && selected.length > 0) {
      try {
        const sets = await getSelectedEqpts(selected);
        // セットなので、indentNumを1にする
        const setList = sets!.map((d) => ({ ...d, indentNum: 1 }));
        selectedEqptListRef.current.push(...setList);
      } catch (e) {
        setSnackBarMessage('サーバー接続エラー');
        setSnackBarOpen(true);
      }
    }
    // 選択リセット
    setSelected([]);

    // セットあり機材IDリストの長さでダイアログ続けるか判断
    if (currentIndex + 1 < eqptsWSet.length) {
      setIsLoading(true);
      setCurrentIndex(currentIndex + 1);
    } else {
      const currentList = [...selectedEqptListRef.current];

      const groups: EqptGroup[] = [];
      let currentGroup: EqptGroup | null = null;

      for (const item of currentList) {
        if (item.indentNum === 0) {
          // 親機材の場合：新しいグループを作成
          currentGroup = { parent: item, children: [] };
          groups.push(currentGroup);
        } else {
          // オプション機材の場合：直近の親グループに追加
          if (currentGroup) {
            currentGroup.children.push(item);
          } else {
            // 万が一、最初の要素がオプションだった場合のセーフティ
            groups.push({ parent: item, children: [] });
          }
        }
      }

      groups.sort((a, b) => {
        if (a.parent.kizaiGrpCod < b.parent.kizaiGrpCod) return -1;
        if (a.parent.kizaiGrpCod > b.parent.kizaiGrpCod) return 1;

        return a.parent.dspOrdNum - b.parent.dspOrdNum;
      });

      // グループをバラして一つの平坦な配列に戻す
      const sortedList = groups.flatMap((group) => [group.parent, ...group.children]);

      selectedEqptListRef.current = sortedList;
      handleConfirmAll(selectedEqptListRef.current);
    }
  };

  /** 別セット選択ボタン押下時 */
  const handleClickAnother = async () => {
    setIsLoading(true);
    try {
      const [sets, oya] = await Promise.all([getSelectedEqpts(selected), getSelectedEqpts([eqptsWSet[currentIndex]])]);
      // セットなので、indentNumを1にする
      const setList = sets!.map((d) => ({ ...d, indentNum: 1 }));
      selectedEqptListRef.current.push(...setList);
      selectedEqptListRef.current.push(...oya);
      setSelected([]);
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    }
    setIsLoading(false);
  };

  /* useEffect */
  /* 画面初期表示 */
  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      if (open) {
        // ダイアログが開いた時、最初のデータ（index: 0）を取得
        setIsLoading(true);
        const getSet = async () => {
          try {
            // セット有機材詳細と表示するセット機材を取得
            const [oya, sets] = await Promise.all([
              getSelectedEqpts([eqptsWSet[0]]), // 0番目を決め打ちで取得
              getSetOptions(eqptsWSet[0]),
            ]);
            setBundles(sets.setList);
            setOyakizaiNam(sets.eqptNam);

            // セットがない単独の機材
            const solo = await getSelectedEqpts(eqptsAll.filter((d) => !eqptsWSet.includes(d)));

            // 配列をリセットしてから親機材と単独機材をpush
            selectedEqptListRef.current = [];

            selectedEqptListRef.current.push(...solo);
            selectedEqptListRef.current.push(...oya);
          } catch (e) {
            setSnackBarMessage('サーバー接続エラー');
            setSnackBarOpen(true);
          }
          setIsLoading(false);
        };
        getSet();
      } else {
        // ダイアログが閉じたら、すべての状態をリセット
        setCurrentIndex(0);
        setSelected([]);
        setOyakizaiNam('');
        setBundles([]);
        selectedEqptListRef.current = [];
      }
    }
  }, [open, eqptsAll, eqptsWSet]);

  /* インデックスが進んだとき */
  useEffect(() => {
    // 0 は上記の初期化で処理済みなので、1以上の場合のみ実行
    if (currentIndex > 0) {
      setIsLoading(true);
      const getSet = async () => {
        try {
          const [oya, sets] = await Promise.all([
            getSelectedEqpts([eqptsWSet[currentIndex]]), // 変更後の currentIndex を使用
            getSetOptions(eqptsWSet[currentIndex]),
          ]);
          setBundles(sets.setList);
          setOyakizaiNam(sets.eqptNam);
          // 選択された機材配列に親機材をpush
          selectedEqptListRef.current.push(...oya);
        } catch (e) {
          setSnackBarMessage('サーバー接続エラー');
          setSnackBarOpen(true);
        }
        setIsLoading(false);
      };
      getSet();
    }
  }, [eqptsWSet, currentIndex]);

  return (
    <Dialog open={open} onClose={() => handleCloseDialog()}>
      <DialogTitle justifyContent={'space-between'} display={'flex'}>
        セットオプション
        <br />
        {isLoading ? <></> : oyaKizaiNam}
        <Stack spacing={2}>
          <Box>
            <Button sx={{ bgcolor: green[500] }} onClick={() => handleClickAnother()} loading={isLoading}>
              別セット選択
            </Button>
          </Box>
          <Box>
            <Button onClick={() => handleClickConfirm()} loading={isLoading}>
              確定
            </Button>
          </Box>
        </Stack>
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
                            <Divider
                              sx={{
                                borderStyle: 'dashed',
                                borderColor: 'CaptionText',
                                borderBottomWidth: 2,
                              }}
                            />
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
        sx={{ marginTop: '65px' }}
      />
    </Dialog>
  );
};
