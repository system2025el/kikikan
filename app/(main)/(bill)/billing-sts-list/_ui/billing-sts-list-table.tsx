'use client';

import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  Divider,
  Grid2,
  IconButton,
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
import { useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { CreateBillDialog } from '../../bill-list/_ui/create-bill-dialog';
import { BillingStsTableValues } from '../_lib/types';

/**
 * 受注請求助教一覧テーブル
 * @param param0
 * @returns {JSX.Element} 受注請求助教一覧テーブルコンポーネント
 */
export const BillingStsListTable = ({
  isLoading,
  page,
  kokyakuId,
  tantouNam,
  billSts,
  setIsLoading,
  setPage,
}: {
  isLoading: boolean;
  page: number;
  kokyakuId: number;
  tantouNam: string | null;
  billSts: BillingStsTableValues[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const rowsPerPage = 50;

  const list = useMemo(
    () => (rowsPerPage > 0 ? billSts.slice((page - 1) * rowsPerPage, page * rowsPerPage) : billSts),
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
                <TableCell padding="none" />
                <TableCell padding="none" />
                <TableCell align="right">受注番号</TableCell>
                <TableCell>相手</TableCell>
                <TableCell>相手担当者</TableCell>
                <TableCell>公演名</TableCell>
                <TableCell>請求状況</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((j, index) => (
                <BillingStsRow key={index} juchu={j} />
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
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
        <CreateBillDialog kokyakuId={kokyakuId} tantouNam={tantouNam} setDialogOpen={setCreateOpen} />
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

/**
 * 開閉するテーブルの行
 * @param param0 受注請求状況の一覧
 * @returns {JSX.Element} 開閉するテーブルの行のコンポーネント
 */
const BillingStsRow = ({ juchu }: { juchu: BillingStsTableValues }) => {
  /* 行の開閉 */
  const [open, setOpen] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell padding="checkbox" width={48}>
          <Checkbox color="primary" />
        </TableCell>
        <TableCell padding="none" width={48} align="center">
          <IconButton onClick={() => setOpen(!open)} sx={{ padding: 0 }}>
            {open ? <KeyboardArrowUp fontSize="small" /> : <KeyboardArrowDown fontSize="small" />}
          </IconButton>
        </TableCell>
        <TableCell
          width={50}
          sx={{
            textAlign: 'end',
          }}
          padding="none"
        >
          {juchu.ordNum}
        </TableCell>
        <TableCell align="right" padding="none" width={60}>
          <Button
            variant="text"
            size="small"
            sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
            onClick={() => {
              console.log('テーブルで受注請求状況番号', juchu.juchuId, 'をクリック');
              //         router.push(`/bill-list/edit/${bill.mituHeadId}`);
            }}
          >
            <Box width={60}>{juchu.juchuId}</Box>
          </Button>
        </TableCell>

        <TableCell>
          <LightTooltipWithText variant={'body2'} maxWidth={400}>
            {juchu.kokyakuNam}
          </LightTooltipWithText>
        </TableCell>
        <TableCell>
          <LightTooltipWithText variant={'body2'} maxWidth={300}>
            {juchu.kokyakuTantoNam}
          </LightTooltipWithText>
        </TableCell>
        <TableCell>
          <LightTooltipWithText variant={'body2'} maxWidth={500}>
            {juchu.koenNam}
          </LightTooltipWithText>
        </TableCell>
        <TableCell>{juchu.sts}</TableCell>
        <TableCell />
      </TableRow>
      <TableRow sx={{ whiteSpace: 'nowrap' }}>
        <TableCell colSpan={4} />
        <TableCell colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Table stickyHeader size="small" padding="none">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={(theme) => ({
                      bgcolor: theme.palette.primary.dark,
                    })}
                    colSpan={2}
                  />
                  <TableCell
                    sx={(theme) => ({
                      bgcolor: theme.palette.primary.dark,
                    })}
                  >
                    機材明細名
                  </TableCell>
                  <TableCell
                    sx={(theme) => ({
                      bgcolor: theme.palette.primary.dark,
                    })}
                  >
                    出庫
                  </TableCell>
                  <TableCell
                    sx={(theme) => ({
                      bgcolor: theme.palette.primary.dark,
                    })}
                  >
                    入庫
                  </TableCell>
                  <TableCell
                    sx={(theme) => ({
                      bgcolor: theme.palette.primary.dark,
                    })}
                  >
                    請求済み期間
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {juchu.heads.map((h, index) => (
                  <TableRow key={index}>
                    <TableCell
                      sx={{
                        borderBottom: index + 1 === juchu.heads.length ? 'none' : undefined,
                        py: 0.5,
                      }}
                    />
                    <TableCell
                      sx={{
                        borderBottom: index + 1 === juchu.heads.length ? 'none' : undefined,
                        py: 0.5,
                      }}
                    >
                      {h.ordNum}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: index + 1 === juchu.heads.length ? 'none' : undefined,
                        py: 0.5,
                      }}
                    >
                      {h.headNam}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: index + 1 === juchu.heads.length ? 'none' : undefined,
                        py: 0.5,
                      }}
                    >
                      {h.shukoDat}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: index + 1 === juchu.heads.length ? 'none' : undefined,
                        py: 0.5,
                      }}
                    >
                      {h.nyukoDat}
                    </TableCell>
                    <TableCell
                      sx={{
                        borderBottom: index + 1 === juchu.heads.length ? 'none' : undefined,
                        py: 0.5,
                      }}
                    >
                      {h.seikyuDat ? ` ～ ${h.seikyuDat}` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};
