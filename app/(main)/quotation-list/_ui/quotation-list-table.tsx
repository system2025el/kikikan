'use client';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
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
import { useRouter } from 'next/navigation';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { CloseMasterDialogButton } from '../../_ui/buttons';
import { MuiTablePagination } from '../../_ui/table-pagination';
import { QuotTableValues } from '../_lib/type';

/**
 * 見積一覧テーブル
 * @returns 見積一覧テーブルのコンポーネント
 */
export const QuotationListTable = ({ quots }: { quots: QuotTableValues[] }) => {
  const rowsPerPage = 50;
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  /* useState ------------------------------------- */
  /* テーブルのページ数 */
  const [page, setPage] = useState(1);
  /* ダイアログの開閉 */
  const [dialogOpen, setDialogOpen] = useState(false);

  /* methods ------------------------------------- */
  /* 新規見積ボタン押下 */
  const clickCreateQuotation = () => {
    setDialogOpen(true);
  };
  /* 自動生成ボタン押下 */
  const onSubmit = (data: { juchuHeadId: number | null }) => {
    console.log(data.juchuHeadId, 'の見積もりを自動生成');
    initJuchuMitsu();
    sessionStorage.setItem(
      'juchuHeadId',
      String(data.juchuHeadId ?? '').replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    );
    router.push('/quotation-list/quotation');
  };
  /* 見積系に使っているストレージを開放 */
  const initJuchuMitsu = () => {
    sessionStorage.removeItem('currentOrder');
    sessionStorage.removeItem('juchuHeadId');
    sessionStorage.removeItem('mitsumoriId');
  };

  /* useForm ------------------------------------- */
  const { control, handleSubmit } = useForm<{ juchuHeadId: number | null }>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { juchuHeadId: null },
  });

  useEffect(() => {
    if (dialogOpen) {
      // Dialogが開いた後にフォーカスを当てる（非同期マウント対策）
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100); // 50〜150msくらいが安定しやすい
      return () => clearTimeout(timer);
    }
  }, [dialogOpen]);

  // 表示するデータ
  const list = useMemo(
    () =>
      rowsPerPage > 0
        ? quots.map((l, index) => ({ ...l, ordNum: index + 1 })).slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : quots.map((l, index) => ({ ...l, ordNum: index + 1 })),
    [page, rowsPerPage, quots]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - quots.length) : 0;

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
                <Button onClick={() => clickCreateQuotation()}>
                  <AddIcon fontSize="small" />
                  新規見積
                </Button>
              </Grid2>
              <Grid2>
                <Button color="error">
                  <DeleteIcon fontSize="small" />
                  見積削除
                </Button>
              </Grid2>
            </Grid2>
            <Grid2 container spacing={1}>
              <Grid2>
                <Button>
                  <ContentCopyIcon fontSize="small" />
                  見積コピー
                </Button>
              </Grid2>
            </Grid2>
          </Grid2>
        </Grid2>

        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 1 }}>
          <Table stickyHeader padding="none">
            <TableHead>
              <TableRow sx={{ whiteSpace: 'nowrap' }}>
                <TableCell />
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
                <TableCell>見積日</TableCell>
                <TableCell>請求番号</TableCell>
                <TableCell>見積メモ</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((quotation, index) => (
                <TableRow key={index}>
                  <TableCell padding="checkbox">
                    <Checkbox color="primary" />
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
                  <TableCell>
                    <Button
                      variant="text"
                      size="small"
                      sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
                      onClick={() => {
                        console.log('テーブルで見積番号', quotation.mituHeadId, 'をクリック');
                        initJuchuMitsu();
                        sessionStorage.setItem('mitsumoriId', String(quotation.mituHeadId ?? ''));
                        router.push('/quotation-list/quotation');
                      }}
                    >
                      {quotation.mituHeadId}
                    </Button>
                  </TableCell>
                  <TableCell>{quotation.juchuHeadId}</TableCell>
                  <TableCell>{quotation.mituStsNam}</TableCell>
                  <TableCell>{quotation.mituHeadNam}</TableCell>
                  <TableCell>{quotation.kokyakuNam}</TableCell>
                  <TableCell>{quotation.koenNam}</TableCell>
                  <TableCell>{quotation.mituDat}</TableCell>
                  <TableCell>{quotation.nyuryokuUser}</TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 30 * emptyRows }}>
                  <TableCell colSpan={8} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* 見積作成方法確認ダイアログ */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle display={'flex'} justifyContent={'space-between'}>
            受注番号から自動生成
            <CloseMasterDialogButton handleCloseDialog={() => setDialogOpen(false)} />
          </DialogTitle>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack p={4}>
              <Typography>受注番号</Typography>
              <TextFieldElement
                name={'juchuHeadId'}
                control={control}
                inputRef={inputRef}
                rules={{
                  required: '数字を入力してください',
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
                type="number"
              />
            </Stack>
            <DialogActions>
              <Button type="submit">自動生成</Button>
              <Button
                onClick={() => {
                  initJuchuMitsu();
                  setDialogOpen(false);
                  router.push('/quotation-list/quotation');
                }}
              >
                手動生成
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </>
  );
};
