'use client';
import AddIcon from '@mui/icons-material/Add';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import {
  Box,
  Button,
  Checkbox,
  Container,
  Dialog,
  Divider,
  Grid2,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanTimeString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../../_lib/constants';
import { getRfidKizaiStsSelection } from '../../../_lib/funcs';
import { LightTooltipWithText } from '../../../_ui/tables';
import { getEqptNam, getRfidsOfTheKizai, updateRfidTagSts } from '../_lib/funcs';
import { RfidsMasterTableValues } from '../_lib/types';
import { RfidMasterDialog } from './rfid-master-dialog';

export const RfidMaster = ({ kizaiId }: { kizaiId: number }) => {
  /** テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /** ログインユーザ */
  const user = useUserStore((state) => state.user);
  /** useState ------------------------------------------------- */
  /** 表示されるRFIDリスト */
  const [theRfids, setTheRfids] = useState<RfidsMasterTableValues[] | undefined>([]);
  /** 初期表示のRFIDリスト（一括変更に利用） */
  const [currentRfids, setCurrentRfids] = useState<RfidsMasterTableValues[] | undefined>([]);
  /** 機材名 */
  const [kizaiNam, setKizaiNam] = useState<string>('');
  /** 選択肢 */
  const [stsOption, setStsOption] = useState<SelectTypes[]>([]);
  /** 今開いてるテーブルのページ数 */
  const [page, setPage] = useState(1);
  /** DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  /** 選択された機材のidのリスト */
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  /** 選ばれた機材ステータス */
  const [selectedSts, setSelectedSts] = useState<SelectTypes>();
  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');
  /** 保存されたあとのフラグ */
  const [saved, setSaved] = useState<boolean>(true);
  /* ダイアログ開く機材のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<string>(String(FAKE_NEW_ID));
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* methods ------------------------------------------- */
  /** 詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: string) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /** ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /** 情報が変わったときに更新される */
  const refetchRfids = async () => {
    setIsLoading(true);
    const updated = await getRfidsOfTheKizai(kizaiId);
    setTheRfids(updated);
    setCurrentRfids(updated);
    setIsLoading(false);
  };

  /** チェックボックス押下（選択時）の処理 */
  const handleSelectRfidTags = (event: React.MouseEvent<unknown>, id: string) => {
    const selectedIndex = selectedTags.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedTags, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedTags.slice(1));
    } else if (selectedIndex === selectedTags.length - 1) {
      newSelected = newSelected.concat(selectedTags.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selectedTags.slice(0, selectedIndex), selectedTags.slice(selectedIndex + 1));
    }
    setSelectedTags(newSelected);
  };
  /** 全選択チャックボックス押下時の処理 */
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && theRfids) {
      const newSelected = theRfids.map((r) => r.rfidTagId);
      setSelectedTags(newSelected);
      return;
    }
    setSelectedTags([]);
  };

  /* useMemo ------------------------------------------------- */
  /** 表示するRFIDタグリスト */
  const list = useMemo(
    () => (theRfids && rowsPerPage > 0 ? theRfids.slice((page - 1) * rowsPerPage, page * rowsPerPage) : theRfids),
    [page, rowsPerPage, theRfids]
  );
  /** テーブル最後のページ用の空データの長さ */
  const emptyRows = theRfids && page > 1 ? Math.max(0, page * rowsPerPage - theRfids.length) : 0;

  // /* 元のステータスと一致してるかどうか */
  //  const isAllSame = rfids?.every((original) => {
  //   const newItem = theRfids && theRfids.find((item) => item.rfidTagId === original.rfidTagId);
  //   if (!newItem) return false;
  //   return original.stsId === newItem.stsId && original.stsNam === newItem.stsNam;
  // });

  /* methods ------------------------------------------ */
  /**
   * 適用ボタン押下時の処理
   * @param {string[]} tagList 選ばれているRFID
   * @param {SelectTypes} selectedSts 選ばれている作業ステータス
   */
  const handleClickAdapt = (tagList: string[], selectedSts: SelectTypes) => {
    console.log('タグリスト', tagList, 'ステータス', selectedSts, '最初のリスト', theRfids);
    const newList = theRfids
      ? theRfids.map((r) => {
          if (tagList.includes(r.rfidTagId)) {
            return {
              ...r,
              stsId: Number(selectedSts.id),
              stsNam: selectedSts.label,
            };
          }
          return r;
        })
      : [];
    // 表示する配列を更新
    setTheRfids(newList);
    setSaved(false);
    // if (isAllSame) {
    //   setSnackBarMessage('保存済みの内容です。');
    //   setSnackBarOpen(true);
    // }
  };

  /**
   * 保存ボタン押下時の処理
   */
  const handleClickSave = async () => {
    if (!theRfids) return;
    // 更新される予定のRFIDマスタリスト
    const updateList = theRfids.filter((newItem) => {
      const currentItem = currentRfids?.find((current) => current.rfidTagId === newItem.rfidTagId);
      if (!currentItem) {
        return true;
      }
      return currentItem.stsId !== newItem.stsId || currentItem.stsNam !== newItem.stsNam;
    });
    console.log(updateList);
    if (updateList.length === 0) {
      setSnackBarMessage('保存済みの内容です。');
    }
    if (updateList.length > 0) {
      // 無効化フラグを変化させるタグ配列
      console.log('△△△△△△△', updateList, '←←←', currentRfids);
      const changeDelFlgList = updateList.reduce(
        (acc, l) => {
          const current = currentRfids?.find((c) => c.rfidTagId === l.rfidTagId);
          if (!current) {
            return acc;
          }
          if (current.stsId === null || current.stsId === undefined || l.stsId === null || l.stsId === undefined) {
            return acc;
          }

          // 無効化 : 元が101（NG） 以下 AND 新が101より大きい
          if (current.stsId <= 101 && l.stsId > 101) {
            acc.push({ rfidTagId: l.rfidTagId, delFlg: 1 });
          }
          // 有効化 : 元が101（NG）より大きい AND 新が101以下
          else if (current.stsId > 101 && l.stsId <= 101) {
            acc.push({ rfidTagId: l.rfidTagId, delFlg: 0 });
          }
          // 他は除外
          return acc;
        },
        [] as { rfidTagId: string; delFlg: number }[]
      );

      await updateRfidTagSts(
        updateList.map((d) => ({ tagId: d.rfidTagId, sts: d.stsId ?? 0, shozokuId: d.shozokuId })),
        user?.name ?? '',
        kizaiId,
        changeDelFlgList
      );
      setSnackBarMessage('保存しました');
      // 表更新
      refetchRfids();
    }
    setSnackBarOpen(true);
    setSaved(true);
  };

  /* useEffect -------------------------------------------------------------- */
  /** 初期表示 */
  useEffect(() => {
    const getList = async () => {
      setIsLoading(true);
      const rfids = await getRfidsOfTheKizai(Number(kizaiId));
      const sts = await getRfidKizaiStsSelection();
      const kizai = await getEqptNam(Number(kizaiId));
      setTheRfids(rfids);
      setCurrentRfids(rfids);
      setKizaiNam(kizai);
      setStsOption(sts);
      setIsLoading(false);
    };
    getList();
  }, [kizaiId]);

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>機材詳細</Typography>
          <Box>
            <Button
              onClick={() => handleClickSave()}
              sx={{ alignItems: 'center' }}
              disabled={
                !theRfids || JSON.stringify(currentRfids) === JSON.stringify(theRfids) || saved /*|| isAllSame*/
              }
            >
              <SaveAsIcon fontSize="small" sx={{ mr: 0.5 }} />
              保存
            </Button>
          </Box>
        </Box>
        <Divider />
        <Box width={'100%'} pb={1}>
          <Box sx={styles.container}>
            <Typography mr={3}>機材名</Typography>
            <TextField value={kizaiNam} disabled />
          </Box>
          <Box sx={styles.container}>
            <Typography mr={3}>機材ステータス一括変更</Typography>
            <Select
              value={selectedSts?.id ?? ''}
              onChange={(event) => {
                const selectedId = Number(event.target.value);
                const selectedObj = stsOption?.find((s) => Number(s.id) === selectedId);
                setSelectedSts(selectedObj ?? undefined);
              }}
              sx={{ width: 200 }}
            >
              {stsOption?.map((s) => (
                <MenuItem key={s.id} value={Number(s.id)}>
                  {s.label}
                </MenuItem>
              ))}
            </Select>
            <Button
              sx={{ ml: 1 }}
              onClick={() => handleClickAdapt(selectedTags, selectedSts!)}
              disabled={typeof selectedSts?.id !== 'number' || selectedTags.length === 0}
            >
              適用
            </Button>
          </Box>
        </Box>
      </Paper>
      <Box>
        <Typography pt={1} pl={2}>
          RFID一覧
        </Typography>
        <Divider />
        <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={theRfids ?? []} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={3}>
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
        ) : !theRfids || theRfids!.length === 0 ? (
          <Typography>該当するRFIDタグがありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '86vh', mt: 0.5 }}>
            {isLoading ? (
              <Loading />
            ) : !list || list.length === 0 ? (
              <Typography justifySelf={'center'}>該当する見積がありません</Typography>
            ) : (
              <Table stickyHeader size="small" padding="none">
                <TableHead>
                  <TableRow sx={{ whiteSpace: 'nowrap' }}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        onChange={handleSelectAllClick}
                        indeterminate={selectedTags.length > 0 && selectedTags.length < theRfids.length}
                        checked={theRfids.length > 0 && selectedTags.length === theRfids.length}
                        sx={{
                          '& .MuiSvgIcon-root': {
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            transition: 'background-color 0.3s',
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell padding="checkbox" />
                    <TableCell align="right">EL No.</TableCell>
                    <TableCell>RFIDタグID</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>メモ</TableCell>
                    <TableCell>最終在庫場所</TableCell>
                    <TableCell>更新日時</TableCell>
                    <TableCell>担当者</TableCell>
                    <TableCell>無効</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list!.map((row) => {
                    const isItemSelected = selectedTags.includes(row.rfidTagId);

                    return (
                      <TableRow key={row.rfidTagId} selected={isItemSelected}>
                        <TableCell
                          padding="checkbox"
                          onClick={(event) => handleSelectRfidTags(event, row.rfidTagId)}
                          tabIndex={-1}
                          sx={{ cursor: 'pointer', bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}
                        >
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            sx={{
                              '& .MuiSvgIcon-root': {
                                backgroundColor: '#fff',
                                borderRadius: '4px',
                                transition: 'background-color 0.3s',
                              },
                            }}
                          />
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}
                        >
                          {row.tblDspId}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap', width: 100 }}
                        >
                          {row.elNum}
                        </TableCell>
                        <TableCell
                          sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap', width: 250 }}
                        >
                          <Button
                            variant="text"
                            sx={{ p: 0, paddingLeft: 1, m: 0, minWidth: 1, justifyContent: 'left' }}
                            onClick={() => handleOpenDialog(row.rfidTagId)}
                          >
                            <Box minWidth={60}>{row.rfidTagId}</Box>
                          </Button>
                        </TableCell>
                        <TableCell
                          sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap', width: 250 }}
                        >
                          {row.stsNam}
                        </TableCell>
                        <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.mem}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.shozokuNam}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.updDat ? toJapanTimeString(row.updDat) : ''}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
                          <LightTooltipWithText variant={'body2'} maxWidth={400}>
                            {row.updUser}
                          </LightTooltipWithText>
                        </TableCell>
                        <TableCell
                          sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap', width: 50 }}
                        >
                          {row.delFlg ? '無効' : ''}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 30 * emptyRows }}>
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        )}

        <Dialog open={dialogOpen} fullScreen>
          <RfidMasterDialog
            handleClose={handleCloseDialog}
            rfidId={openId}
            refetchRfids={refetchRfids}
            kizaiId={kizaiId}
          />
        </Dialog>
      </Box>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </Container>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 2,
    marginTop: 1,
  },
};
