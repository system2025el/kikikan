'use client';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContentText,
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
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import { Loading } from '../../_ui/loading';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { ROWS_PER_MASTER_TABLE_PAGE } from '../../(masters)/_lib/constants';
import { LightTooltipWithText } from '../../(masters)/_ui/tables';
import { getFilteredQuotList, updQuotDelFlg } from '../_lib/funcs';
import { QuotSearchValues, QuotTableValues } from '../_lib/types';
import { CreateQuotDialog } from './create-quot-dialog';

/**
 * 見積一覧テーブル
 * @returns 見積一覧テーブルのコンポーネント
 */
export const QuotationListTable = ({
  quots,
  isLoading,
  page,
  queries,
  isFirst,
  searchParams,
  setIsLoading,
  setQuotList,
  setIsFirst,
  setPage,
}: {
  quots: QuotTableValues[];
  isLoading: boolean;
  page: number;
  queries: QuotSearchValues;
  isFirst: boolean;
  searchParams: QuotSearchValues;
  setQuotList: React.Dispatch<React.SetStateAction<QuotTableValues[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFirst: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /** テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /** ページ遷移用router */
  const router = useRouter();
  /** ダイアログ開いたときにフォーカス管理するRef */
  const inputRef = useRef<HTMLInputElement>(null);

  /* useState ------------------------------------- */
  /** ダイアログの開閉 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /** ダイアログの開閉 */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  /** 選択された見積Idの配列 */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /** 表示するデータ */
  const list = useMemo(() => {
    return rowsPerPage > 0
      ? quots.map((l, index) => ({ ...l, ordNum: index + 1 })).slice((page - 1) * rowsPerPage, page * rowsPerPage)
      : quots.map((l, index) => ({ ...l, ordNum: index + 1 }));
  }, [page, rowsPerPage, quots]);
  /** テーブル最後のページ用の空データの長さ */
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - quots.length) : 0;

  /* methods -------------------------------------------- */
  /** 削除ボタン押下時処理 */
  const handleClickDelete = async (mituIds: number[]) => {
    await updQuotDelFlg(mituIds);
    setSelectedIds([]);
    setDeleteDialogOpen(false);
    setSnackBarMessage(`見積を${mituIds.length}件削除しました`);
    setSnackBarOpen(true);
    setIsLoading(true);
    const q = await getFilteredQuotList(queries);
    console.log(q);
    setQuotList(q);
  };

  /** チェックボックス押下（選択時）の処理 */
  const handleSelectQuotIds = (event: React.MouseEvent<unknown>, id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selectedIds.slice(0, selectedIndex), selectedIds.slice(selectedIndex + 1));
    }
    setSelectedIds(newSelected);
  };

  /** 全選択チャックボックス押下時の処理 */
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && quots) {
      const newSelected = quots.map((r) => r.mituHeadId);
      setSelectedIds(newSelected);
      return;
    }
    setSelectedIds([]);
  };

  /* useEffect -------------------------------------------- */
  useEffect(() => {
    if (dialogOpen) {
      // Dialogが開いた後にフォーカスを当てる（非同期マウント対策）
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // 50〜150msくらいが安定しやすい
      return () => clearTimeout(timer);
    }
  }, [dialogOpen]);

  return (
    <>
      <Box>
        <Typography pt={1} pl={2}>
          見積一覧
        </Typography>
        <Divider />
        <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
          <Grid2 spacing={1}>
            <MuiTablePagination arrayList={quots} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button onClick={() => setDialogOpen(true)}>
                  <AddIcon fontSize="small" />
                  新規見積
                </Button>
              </Grid2>
              <Grid2>
                <Button color="error" onClick={() => setDeleteDialogOpen(true)} disabled={selectedIds.length === 0}>
                  <DeleteIcon fontSize="small" />
                  見積削除
                </Button>
              </Grid2>
            </Grid2>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button
                  onClick={() => {
                    sessionStorage.setItem('quotListSearchParams', JSON.stringify(searchParams));
                    router.push(`quotation-list/copy?mituId=${selectedIds[0]}`);
                  }}
                  disabled={selectedIds.length !== 1}
                >
                  <ContentCopyIcon fontSize="small" />
                  見積コピー
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>
        {isLoading && !isFirst ? (
          <Loading />
        ) : isFirst && (!list || list.length === 0) ? (
          <></>
        ) : !list || list.length === 0 ? (
          <Typography justifySelf={'center'}>該当する見積がありません</Typography>
        ) : (
          <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
            <Table stickyHeader size="small" padding="none">
              <TableHead>
                <TableRow sx={{ whiteSpace: 'nowrap' }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      onChange={handleSelectAllClick}
                      indeterminate={selectedIds.length > 0 && selectedIds.length < quots.length}
                      checked={quots.length > 0 && selectedIds.length === quots.length}
                      sx={{
                        '& .MuiSvgIcon-root': {
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                          transition: 'background-color 0.3s',
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell padding="none" />
                  <TableCell align="right">見積番号</TableCell>
                  <TableCell align="right">受注番号</TableCell>
                  <TableCell>
                    <Typography noWrap variant={'body2'} fontWeight={500}>
                      見積ステータス
                    </Typography>
                  </TableCell>
                  <TableCell>見積件名</TableCell>
                  <TableCell>見積相手</TableCell>
                  <TableCell>公演名</TableCell>
                  <TableCell>見積日</TableCell>
                  <TableCell>入力者</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {list.map((quotation, index) => {
                  const isItemSelected = selectedIds.includes(quotation.mituHeadId);
                  return (
                    <TableRow key={index}>
                      <TableCell
                        padding="checkbox"
                        onClick={(event) => handleSelectQuotIds(event, quotation.mituHeadId)}
                        tabIndex={-1}
                        sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
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
                        width={50}
                        sx={{
                          paddingLeft: 1,
                          paddingRight: 1,
                          textAlign: 'end',
                        }}
                      >
                        {quotation.ordNum}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="text"
                          size="small"
                          sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
                          onClick={() => {
                            console.log('テーブルで見積番号', quotation.mituHeadId, 'をクリック');
                            sessionStorage.setItem('quotListSearchParams', JSON.stringify(searchParams));
                            setIsLoading(true);
                            setIsFirst(true);
                            router.push(`/quotation-list/edit/${quotation.mituHeadId}`);
                          }}
                        >
                          <Box minWidth={60}>{quotation.mituHeadId}</Box>
                        </Button>
                      </TableCell>
                      <TableCell align="right">{quotation.juchuHeadId > 0 ? quotation.juchuHeadId : '-'}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{quotation.mituStsNam}</TableCell>
                      <TableCell>
                        <LightTooltipWithText variant={'body2'} maxWidth={200}>
                          {quotation.mituHeadNam}
                        </LightTooltipWithText>
                      </TableCell>
                      <TableCell>
                        <LightTooltipWithText variant={'body2'} maxWidth={300}>
                          {quotation.kokyakuNam}
                        </LightTooltipWithText>
                      </TableCell>
                      <TableCell>
                        <LightTooltipWithText variant={'body2'} maxWidth={200}>
                          {quotation.koenNam}
                        </LightTooltipWithText>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{quotation.mituDat}</TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{quotation.nyuryokuUser}</TableCell>
                    </TableRow>
                  );
                })}
                {emptyRows > 0 && (
                  <TableRow style={{ height: 30 * emptyRows }}>
                    <TableCell colSpan={10} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        {/* 見積作成方法確認ダイアログ */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <CreateQuotDialog inputRef={inputRef} searchParams={searchParams} setDialogOpen={setDialogOpen} />
        </Dialog>
        {/* 見積削除確認ダイアログ */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
            <WarningIcon color="error" />
            <Box>削除</Box>
          </DialogTitle>
          <DialogContentText m={2}>{selectedIds.length}件の見積が削除されます。</DialogContentText>
          <DialogActions>
            <Button color="error" onClick={() => handleClickDelete(selectedIds)}>
              削除
            </Button>
            <Button onClick={() => setDeleteDialogOpen(false)}>戻る</Button>
          </DialogActions>
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
    </>
  );
};
