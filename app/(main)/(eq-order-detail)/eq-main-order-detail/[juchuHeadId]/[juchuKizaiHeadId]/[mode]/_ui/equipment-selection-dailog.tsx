import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  DialogActions,
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
import React, { SetStateAction, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { Loading } from '@/app/(main)/_ui/loading';

import { bundleData } from '../_lib/eqdata';
import { checkSetoptions, getEqptsForEqptSelection, getSelectedEqpts, getSetOptions } from '../_lib/funcs';
import { EqptSelection, JuchuKizaiMeisaiValues, SelectedEqptsValues } from '../_lib/types';
import { EqptBumonsTable } from './equipment-bumons-table';
import { EqptTable } from './equipments-table';

export const EqptSelectionDialog = ({
  // rank,
  eqpts,
  setEqpts,
  handleCloseDialog,
  lock,
}: {
  // rank: number;
  /**
   * 機材選択画面に渡す機材配列をセットする関数
   * @param {SelectedEqptsValues[]} data
   * @returns
   */
  eqpts: JuchuKizaiMeisaiValues[];
  setEqpts: (data: SelectedEqptsValues[]) => void;
  /** 機材選択ダイアログ閉じる関数 */
  handleCloseDialog: () => void;
  lock: () => Promise<boolean | React.JSX.Element | undefined>;
}) => {
  /** 機材明細画面に渡す機材の配列 */
  const selectedEqptList: SelectedEqptsValues[] = [];
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
  /* 受注明細に重複のある機材配列 */
  const [duplicateEqpts, setDuplicateEqpts] = useState<JuchuKizaiMeisaiValues[]>([]);
  /* セットオプション有機材のデータ配列 */
  const [eqptsWSet, setEqptsWSet] = useState<number[]>([]);
  /* セットオプションのダイアログ開閉 */
  const [bundleDialogOpen, setBundleDialogOpen] = useState(false);
  /* 重複機材のダイアログ開閉 */
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  // スナックバー制御
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  // スナックバーメッセージ
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useform ------------------------------- */
  const { handleSubmit, control, watch, getValues } = useForm({ defaultValues: { query: '' } });

  /* methods ------------------------------ */
  /* 確定ボタン押下時 */
  const handleClickConfirm = async () => {
    setIsLoading(true);

    // 機材明細の重複機材排除
    const uniqueIds = new Set();
    const uniqueEqList = eqpts.filter((d) => {
      if (uniqueIds.has(d.kizaiId)) {
        return false;
      }
      uniqueIds.add(d.kizaiId);
      return true;
    });
    // 選ばれた機材IDの配列から、機材明細の重複機材を抽出
    const DuplicateEqpts = uniqueEqList.filter((eqpt) => selectedEqptIds.includes(eqpt.kizaiId));

    if (DuplicateEqpts.length > 0) {
      setDuplicateEqpts(DuplicateEqpts);
      setDuplicateDialogOpen(true);
    } else {
      // 選ばれた機材IDの配列からセットオプションの存在確認
      try {
        const setList = await checkSetoptions(selectedEqptIds);
        if (setList.length !== 0) {
          // セットオプション付きの機材があるとき
          // セット有機材IDリスト
          setEqptsWSet(setList);
          setBundleDialogOpen(true);
        } else {
          // セットオプションがない時
          // 親機材(blankQty: 0)として配列に保持する
          const data = await getSelectedEqpts(selectedEqptIds);
          console.log('最終的に渡される機材の配列データ: ', data!);
          setEqpts(data!);
          //handleCloseDialog();
        }
      } catch (e) {
        setSnackBarMessage('サーバー接続エラー');
        setSnackBarOpen(true);
      }
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
    console.log('Push search', data.query);
    setIsLoading(true);
    setSearching(true);
    setSelectedBumon(-100);

    try {
      const lockResult = await lock();

      if (lockResult) {
        if (data.query.trim() === '') {
          const a = await getEqptsForEqptSelection('');
          console.log('機材リスト[0]: ', a![0]);
          setTheEqpts(a!);
        } else {
          const a = await getEqptsForEqptSelection(data.query);
          console.log('機材リスト[0]: ', a![0]);
          setTheEqpts(a!);
        }
      }
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
        console.log('最初の機材リスト[0]: ', a![0]);
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
          <Box width={'100%'} px={2} pb={1} component={'form'} onSubmit={handleSubmit(onSubmit)}>
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
          <DuplicateDialog
            open={duplicateDialogOpen}
            selectedEqptIds={selectedEqptIds}
            duplicateEqpts={duplicateEqpts}
            setSelectedEqptIds={setSelectedEqptIds}
            setEqptsWSet={setEqptsWSet}
            setBundleDialogOpen={setBundleDialogOpen}
            setEqpts={setEqpts}
            handleCloseDialog={() => setDuplicateDialogOpen(false)}
            setSnackBarOpen={setSnackBarOpen}
            setSnackBarMessage={setSnackBarMessage}
          />
          {eqptsWSet.length > 0 && (
            <BundleDialog
              open={bundleDialogOpen}
              handleConfirmAll={(selected: SelectedEqptsValues[]) => {
                setEqpts(selected);
                handleCloseBundle();
                handleCloseDialog();
              }}
              handleCloseDialog={handleCloseBundle}
              eqptsWSet={eqptsWSet}
              eqptsAll={selectedEqptIds}
              // rank={rank}
              setEqpts={setEqpts}
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
  // rank,
  handleConfirmAll,
  handleCloseDialog,
  setEqpts,
}: {
  open: boolean;
  /** セット有機材のID配列 */
  eqptsWSet: number[];
  eqptsAll: number[];
  // rank: number;
  /** 選んだ機材配列を画面に渡してダイアログをすべて閉じる */
  handleConfirmAll: (selected: SelectedEqptsValues[]) => void;
  /** セットオプションダイアログを閉じる */
  handleCloseDialog: () => void;
  /** 機材明細画面に渡す機材をセットする */
  setEqpts: (data: SelectedEqptsValues[]) => void;
}) => {
  /** セット全体の機材配列 */
  const selectedEqptListRef = useRef<SelectedEqptsValues[]>([]);
  /** debug用、レンダリング回数取得に使用 */
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
    console.log('-------------------------セットオプションダイアログ確定ボタン');
    // 今機材が選択されてたら配列にpush
    if (selected && selected.length > 0) {
      const sets = await getSelectedEqpts(selected);
      // セットなので、blankQtyを1にする
      const setList = sets!.map((d) => ({ ...d, indentNum: 1 }));
      selectedEqptListRef.current.push(...setList);
    }
    // 選択リセット
    setSelected([]);

    // セットあり機材IDリストの長さでダイアログ続けるか判断
    console.log('今のインデックス: ', currentIndex, ' 元の親機材の長さ: ', eqptsWSet.length);
    if (currentIndex + 1 < eqptsWSet.length) {
      setIsLoading(true);
      setCurrentIndex(currentIndex + 1);
      // const [oya, sets] = await Promise.all([
      //   getSelectedEqpts([eqptsWSet[currentIndex + 1]]),
      //   getSetOptions(eqptsWSet[currentIndex + 1]),
      // ]);
      // setBundles(sets.setList);
      // setOyakizaiNam(sets.eqptNam);
      // setIsLoading(false);
      // // 選択された機材配列に親機材をpush
      // selectedEqptListRef.current.push(...oya);
      // console.log('初期表示の時の親機材', selectedEqptListRef.current);
    } else {
      console.log('選ばれたデータ、親子どっちも', selectedEqptListRef.current);
      handleConfirmAll(selectedEqptListRef.current);
    }
  };

  /** 別セット選択ボタン押下時 */
  const handleClickAnother = async () => {
    setIsLoading(true);
    const [sets, oya] = await Promise.all([getSelectedEqpts(selected), getSelectedEqpts([eqptsWSet[currentIndex]])]);
    // セットなので、indentNumを1にする
    const setList = sets!.map((d) => ({ ...d, indentNum: 1 }));
    selectedEqptListRef.current.push(...setList);
    selectedEqptListRef.current.push(...oya);
    setSelected([]);
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
          console.log('初期表示の時の親機材', selectedEqptListRef.current);
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
        const [oya, sets] = await Promise.all([
          getSelectedEqpts([eqptsWSet[currentIndex]]), // 変更後の currentIndex を使用
          getSetOptions(eqptsWSet[currentIndex]),
        ]);
        setBundles(sets.setList);
        setOyakizaiNam(sets.eqptNam);
        // 選択された機材配列に親機材をpush
        selectedEqptListRef.current.push(...oya);
        console.log('次の親機材', selectedEqptListRef.current);
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
    </Dialog>
  );
};

/* 重複機材確認ダイアログ */
const DuplicateDialog = ({
  open,
  selectedEqptIds,
  duplicateEqpts,
  setSelectedEqptIds,
  setEqptsWSet,
  setBundleDialogOpen,
  setEqpts,
  handleCloseDialog,
  setSnackBarOpen,
  setSnackBarMessage,
}: {
  open: boolean;
  selectedEqptIds: number[];
  duplicateEqpts: JuchuKizaiMeisaiValues[];
  setSelectedEqptIds: React.Dispatch<SetStateAction<number[]>>;
  setEqptsWSet: (data: number[]) => void;
  setBundleDialogOpen: React.Dispatch<SetStateAction<boolean>>;
  setEqpts: (data: SelectedEqptsValues[]) => void;
  handleCloseDialog: () => void;
  setSnackBarOpen: React.Dispatch<SetStateAction<boolean>>;
  setSnackBarMessage: React.Dispatch<SetStateAction<string>>;
}) => {
  /* 今開いてる機材ID配列のインデックス */
  const [currentIndex, setCurrentIndex] = useState(0);
  /* ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!open) {
      setCurrentIndex(0);
      //setIsLoading(false);
    }
  }, [open]);

  /* はい・いいえボタン押下時 */
  const handleClick = async (result: boolean) => {
    setIsLoading(true);

    try {
      let updatedSelectedEqptIds = [...selectedEqptIds];
      if (!result) {
        updatedSelectedEqptIds = selectedEqptIds.filter((id) => id !== duplicateEqpts[currentIndex].kizaiId);
        setSelectedEqptIds(updatedSelectedEqptIds);
      }

      if (currentIndex + 1 < duplicateEqpts.length) {
        setCurrentIndex((prev) => prev + 1);
      } else if (updatedSelectedEqptIds.length > 0) {
        // 選ばれた機材IDの配列からセットオプションの存在確認
        const setList = await checkSetoptions(updatedSelectedEqptIds);
        if (setList.length !== 0) {
          // セットオプション付きの機材があるとき
          // セット有機材IDリスト
          setEqptsWSet(setList);
          handleCloseDialog();
          setBundleDialogOpen(true);
        } else {
          // セットオプションがない時
          // 親機材(blankQty: 0)として配列に保持する
          const data = await getSelectedEqpts(updatedSelectedEqptIds);
          handleCloseDialog();
          setEqpts(data!);
        }
      } else {
        handleCloseDialog();
      }
    } catch (e) {
      setSnackBarMessage('サーバー接続エラー');
      setSnackBarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open}>
      <DialogTitle>{duplicateEqpts[currentIndex]?.kizaiNam ?? 'aaaaa'}</DialogTitle>
      <DialogContent>
        <Typography>重複機材を追加してもよろしいでしょうか？</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isLoading}>
          はい
        </Button>
        <Button onClick={() => handleClick(false)} loading={isLoading}>
          いいえ
        </Button>
      </DialogActions>
    </Dialog>
  );
};
