import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Grid2,
  Paper,
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

import { BillsListTableValues } from '../_lib/types';

export const BillListTable = ({
  bills,
  isLoading,
  page,
  setIsLoading,
  setPage,
}: {
  bills: BillsListTableValues[];
  isLoading: boolean;
  page: number;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const rowsPerPage = 50;

  const list = useMemo(
    () =>
      rowsPerPage > 0
        ? bills
            .map((l, index) => ({ /* ...l,*/ ordNum: index + 1 }))
            .slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : bills.map((l, index) => ({ /* ...l,:*/ ordNum: index + 1 })),
    [page, rowsPerPage, bills]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - bills.length) : 0;

  return (
    <Box>
      <Typography pt={1} pl={2}>
        請求一覧
      </Typography>
      <Divider />
      <Grid2 container mt={1} mx={0.5} justifyContent={'space-between'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={bills} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
        </Grid2>
        <Grid2 container spacing={1}>
          <Grid2 container spacing={1}>
            <Grid2>
              <Button /*onClick={() => clickCreateBill()}*/>
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
        <Typography justifySelf={'center'}>該当する請求がありません</Typography>
      ) : (
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
          <Table stickyHeader size="small" padding="none">
            <TableHead>
              <TableRow sx={{ whiteSpace: 'nowrap' }}>
                <TableCell />
                <TableCell padding="none" />
                <TableCell align="right">受注番号</TableCell>
                <TableCell>請求件名</TableCell>
                <TableCell>相手</TableCell>
                <TableCell>相手担当者</TableCell>
                <TableCell>公演名</TableCell>
                <TableCell>請求状況</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((bill, index) => (
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
                    {bill.ordNum}
                  </TableCell>
                  {/* <TableCell align="right">
                <Button
                  variant="text"
                  size="small"
                  sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
                  onClick={() => {
                    console.log('テーブルで請求番号', bill.mituHeadId, 'をクリック');
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
      {/* 請求作成方法確認ダイアログ */}
      {/* <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
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
                setDialogOpen(false);
                router.push('/Bill-list/create');
              }}
            >
              手動生成
            </Button>
          </DialogActions>
        </form>
      </Dialog> */}
    </Box>
  );
};
