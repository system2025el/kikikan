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
import { useMemo, useState } from 'react';
import { CheckboxElement, Controller, SelectElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormMonthX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { BillsListTableValues } from '../_lib/types';

export const BillListTable = ({
  bills,
  isLoading,
  page,
  custs,
  setIsLoading,
  setPage,
}: {
  bills: BillsListTableValues[];
  isLoading: boolean;
  page: number;
  custs: SelectTypes[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const rowsPerPage = 50;
  const router = useRouter();

  const list = useMemo(
    () =>
      rowsPerPage > 0
        ? bills.map((l, index) => ({ ...l, ordNum: index + 1 })).slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : bills.map((l, index) => ({ ...l, ordNum: index + 1 })),
    [page, rowsPerPage, bills]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - bills.length) : 0;

  /* useState ----------------------------------------------------------- */
  const [dialogOpen, setDialogOpen] = useState(false);

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
  const onSubmit = async (data: { kokyaku: number | null; dat: Date | null; showDetailFlg: boolean }) => {
    console.log(data);
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
            <Button color="error">
              <DeleteIcon fontSize="small" />
              削除
            </Button>
          </Grid2>
          <Grid2 container spacing={1}>
            <Button>
              <ContentCopyIcon fontSize="small" />
              コピー
            </Button>
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
                <TableCell align="right">請求番号</TableCell>
                <TableCell>請求ステータス</TableCell>
                <TableCell>請求書名</TableCell>
                <TableCell>請求相手</TableCell>
                <TableCell>請求発行日</TableCell>
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
                  <TableCell align="right">
                    <Button
                      variant="text"
                      size="small"
                      sx={{ py: 0.2, px: 0, m: 0, minWidth: 0 }}
                      onClick={() => {
                        console.log('テーブルで請求番号', bill.billHeadId, 'をクリック');
                        router.push(`/bill-list/edit/${bill.billHeadId}`);
                      }}
                    >
                      <Box minWidth={60}>{bill.billHeadId}</Box>
                    </Button>
                  </TableCell>
                  <TableCell align="right">{bill.billingSts}</TableCell>

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
                      {bill.seikyuDat}
                    </LightTooltipWithText>
                  </TableCell>
                </TableRow>
              ))}
              {emptyRows > 0 && (
                <TableRow style={{ height: 30 * emptyRows }}>
                  <TableCell colSpan={Object.keys(list).length + 1} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
