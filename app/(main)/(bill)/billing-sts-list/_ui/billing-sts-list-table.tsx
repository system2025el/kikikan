'use client';

import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Dialog,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';

import { CreateBillDialog } from '../../bill-list/_ui/create-bill-dialog';

export const BillingStsListTable = ({
  isLoading,
  page,
  kokyakuId,
  setIsLoading,
  setPage,
}: {
  isLoading: boolean;
  page: number;
  kokyakuId: number;

  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const rowsPerPage = 50;
  const router = useRouter();
  // モック仮
  const billSts: [] = [];

  const list = useMemo(
    () =>
      rowsPerPage > 0
        ? billSts
            .map((l, index) => ({ /* ...l,*/ ordNum: index + 1 }))
            .slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : billSts.map((l, index) => ({ /* ...l,:*/ ordNum: index + 1 })),
    [page, rowsPerPage, billSts]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - billSts.length) : 0;

  /* useState --------------------------------------------------------- */
  /* 請求新規作成ダイアログ開閉 */
  const [createOpen, setCreateOpen] = useState(false);
  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  return (
    <Box>
      <Typography pt={1} pl={2}>
        受注請求状況一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={billSts} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button
                onClick={() => {
                  if (!kokyakuId || kokyakuId === 0) {
                    setSnackBarMessage('検索で請求相手を選択してください');
                    setSnackBarOpen(true);
                  } else {
                    setCreateOpen(true);
                  }
                }}
              >
                <AddIcon fontSize="small" />
                新規
              </Button>
            </Grid2>
            <Grid2>
              <Button color="error">
                <DeleteIcon fontSize="small" />
                削除
              </Button>
            </Grid2>
          </Grid2>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button>
                <ContentCopyIcon fontSize="small" />
                コピー
              </Button>
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>
      {isLoading ? (
        <Loading />
      ) : !list || list.length === 0 ? (
        <Typography justifySelf={'center'}>該当する受注請求状況がありません</Typography>
      ) : (
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
          <Table stickyHeader size="small" padding="none">
            <TableHead>
              <TableRow sx={{ whiteSpace: 'nowrap' }}>
                <TableCell padding="none" />
                <TableCell align="right">受注番号</TableCell>
                <TableCell>受注請求状況件名</TableCell>
                <TableCell>相手</TableCell>
                <TableCell>相手担当者</TableCell>
                <TableCell>公演名</TableCell>
                <TableCell>請求状況</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((bill, index) => (
                <TableRow key={index}>
                  <TableCell
                    width={50}
                    sx={{
                      paddingLeft: 1,
                      paddingRight: 1,
                      textAlign: 'end',
                    }}
                  >
                    {bill.ordNum}
                  </TableCell>
                  {/* <TableCell align="right">
                    <Button
                      variant="text"
                      size="small"
                      sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
                      onClick={() => {
                        console.log('テーブルで受注請求状況番号', bill.mituHeadId, 'をクリック');
                        router.push(`/Bill-list/edit/${bill.mituHeadId}`);
                      }}
                    >
                      <Box minWidth={60}>{bill.mituHeadId}</Box>
                    </Button>
                  </TableCell>
                  <TableCell align="right">{bill.juchuHeadId}</TableCell>
                  <TableCell>{bill.mituStsNam}</TableCell>
                  <TableCell>
                    <LightTooltipWithText variant={'body2'} maxWidth={200}>
                      {bill.mituHeadNam}
                    </LightTooltipWithText>
                  </TableCell>
                  <TableCell>
                    <LightTooltipWithText variant={'body2'} maxWidth={300}>
                      {bill.kokyakuNam}
                    </LightTooltipWithText>
                  </TableCell>
                  <TableCell>
                    <LightTooltipWithText variant={'body2'} maxWidth={200}>
                      {bill.koenNam}
                    </LightTooltipWithText>
                  </TableCell>
                  <TableCell>{bill.mituDat}</TableCell>
                  <TableCell>{bill.nyuryokuUser}</TableCell> */}
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 30 * emptyRows }}>
                  <TableCell colSpan={10} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={createOpen}>
        <CreateBillDialog kokyakuId={kokyakuId} setDialogOpen={setCreateOpen} />
      </Dialog>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackBarOpen(false)}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ marginTop: '65px' }}
      />
    </Box>
  );
};
