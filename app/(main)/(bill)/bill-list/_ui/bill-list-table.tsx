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
import { useForm } from 'react-hook-form-mui';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';
import { ROWS_PER_MASTER_TABLE_PAGE } from '@/app/(main)/(masters)/_lib/constants';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { getFilteredBills, updBillDelFlg } from '../_lib/funcs';
import { BillSearchValues, BillsListTableValues } from '../_lib/types';

export const BillListTable = ({
  bills,
  isLoading,
  page,
  isFirst,
  searchParams,
  setBillList,
  setIsLoading,
  setIsFirst,
  setPage,
}: {
  bills: BillsListTableValues[];
  isLoading: boolean;
  isFirst: boolean;
  page: number;
  custs: SelectTypes[];
  searchParams: BillSearchValues;
  setBillList: React.Dispatch<React.SetStateAction<BillsListTableValues[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFirst: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  /** テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

  /* useState -------------------------------------------------- */
  /** 削除ダイアログの開閉 */
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  /** 選択された請求Idの配列 */
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('');

  /* useMemo -------------------------------------------------- */
  const list = useMemo(
    () =>
      rowsPerPage > 0
        ? bills.map((l, index) => ({ ...l, ordNum: index + 1 })).slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : bills.map((l, index) => ({ ...l, ordNum: index + 1 })),
    [page, rowsPerPage, bills]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - bills.length) : 0;

  /* useForm ------------------------------------------------------------ */
  const { control, handleSubmit, reset } = useForm<{
    kokyaku: number | null;
    dat: Date | null;
    showDetailFlg: boolean;
  }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { showDetailFlg: false },
  });

  /* methods ------------------------------------------------------------- */
  /** 削除ボタン押下時処理 */
  const handleClickDelete = async (billIds: number[]) => {
    await updBillDelFlg(billIds);
    setSelectedIds([]);
    setDeleteDialogOpen(false);
    setSnackBarMessage(`請求を${billIds.length}件削除しました`);
    setSnackBarOpen(true);
    setIsLoading(true);
    const b = await getFilteredBills(searchParams);
    console.log(b);
    setBillList(b);
    setIsLoading(false);
  };

  /** チェックボックス押下（選択時）の処理 */
  const handleSelectBillIds = (event: React.MouseEvent<unknown>, id: number) => {
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
    if (event.target.checked && bills) {
      const newSelected = bills.map((r) => r.billHeadId);
      setSelectedIds(newSelected);
      return;
    }
    setSelectedIds([]);
  };

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
            <Button color="error" onClick={() => setDeleteDialogOpen(true)} disabled={selectedIds.length === 0}>
              <DeleteIcon fontSize="small" />
              削除
            </Button>
          </Grid2>
          <Grid2 container spacing={1}>
            <Button
              onClick={() => {
                window.open(`bill-list/copy?seikyuId=${selectedIds[0]}`);
              }}
              disabled={selectedIds.length !== 1}
            >
              <ContentCopyIcon fontSize="small" />
              コピー
            </Button>
          </Grid2>
        </Grid2>
      </Grid2>
      {isLoading && !isFirst ? (
        <Loading />
      ) : isFirst && (!list || list.length === 0) ? (
        <></>
      ) : !list || list.length === 0 ? (
        <Typography justifySelf={'center'}>該当する請求がありません</Typography>
      ) : (
        <TableContainer component={Paper} square sx={{ maxHeight: '90vh', mt: 0.5 }}>
          <Table stickyHeader size="small" padding="none">
            <TableHead>
              <TableRow sx={{ whiteSpace: 'nowrap' }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    onChange={handleSelectAllClick}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < bills.length}
                    checked={bills.length > 0 && selectedIds.length === bills.length}
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
                <TableCell align="right">請求番号</TableCell>
                <TableCell>請求ステータス</TableCell>
                <TableCell>請求書名</TableCell>
                <TableCell>請求相手</TableCell>
                <TableCell>請求発行日</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((bill, index) => {
                const isItemSelected = selectedIds.includes(bill.billHeadId);
                return (
                  <TableRow key={index}>
                    <TableCell
                      padding="checkbox"
                      onClick={(event) => handleSelectBillIds(event, bill.billHeadId)}
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
                      {bill.ordNum}
                    </TableCell>
                    <TableCell align="right" padding="none" width={60}>
                      <Button
                        variant="text"
                        disabled={isLoading}
                        sx={{ p: 0, m: 0, minWidth: 1, justifyContent: 'left' }}
                        onClick={() => {
                          console.log('テーブルで請求番号', bill.billHeadId, 'をクリック');
                          window.open(`/bill-list/edit/${bill.billHeadId}`);
                        }}
                      >
                        <Box minWidth={60}>{bill.billHeadId}</Box>
                      </Button>
                    </TableCell>
                    <TableCell>{bill.billingSts}</TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={300}>
                        {bill.billHeadNam}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={300}>
                        {bill.kokyaku}
                      </LightTooltipWithText>
                    </TableCell>
                    <TableCell>
                      <LightTooltipWithText variant={'body2'} maxWidth={200}>
                        {bill.seikyuDat ? toJapanYMDString(bill.seikyuDat) : ''}
                      </LightTooltipWithText>
                    </TableCell>
                  </TableRow>
                );
              })}
              {emptyRows > 0 && (
                <TableRow style={{ height: 30 * emptyRows }}>
                  <TableCell colSpan={Object.keys(list).length + 1} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {/* 見積削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>削除</Box>
        </DialogTitle>
        <DialogContentText m={2}>{selectedIds.length}件の請求が削除されます。</DialogContentText>
        <DialogActions>
          <Button color="error" onClick={() => handleClickDelete(selectedIds)}>
            削除
          </Button>
          <Button onClick={() => setDeleteDialogOpen(false)}>戻る</Button>
        </DialogActions>
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
