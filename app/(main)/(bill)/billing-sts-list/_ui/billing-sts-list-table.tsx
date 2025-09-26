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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import router from 'next/router';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CheckboxElement, SelectElement } from 'react-hook-form-mui';

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormMonthX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

export const BillingStsListTable = ({
  isLoading,
  page,
  custs,
  setIsLoading,
  setPage,
}: {
  isLoading: boolean;
  page: number;
  custs: SelectTypes[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const rowsPerPage = 50;

  // モック仮
  const billSts: [] = [];

  const list = useMemo(
    () =>
      rowsPerPage > 0
        ? billSts
            .map((l, index) => ({ /* ...l,*/ ordNum: index + 1 }))
            .slice((page - 1) * rowsPerPage, page * rowsPerPage)
        : billSts.map((l, index) => ({ /* ...l,:*/ ordNum: index + 1 })),
    [page, rowsPerPage /* billSts*/]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = page > 1 ? Math.max(0, page * rowsPerPage - billSts.length) : 0;
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
              <Button onClick={() => setDialogOpen(true)}>
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
                <TableCell />
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
      {/* 請求作成方法確認ダイアログ */}
      <Dialog
        open={dialogOpen}
        onClose={() => {
          reset();
          setDialogOpen(false);
        }}
      >
        <DialogTitle display={'flex'} justifyContent={'end'}>
          <CloseMasterDialogButton
            handleCloseDialog={() => {
              reset();
              setDialogOpen(false);
            }}
          />
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container direction={'column'} px={4} pt={4} spacing={2}>
            <Grid2 display={'flex'} alignItems={'baseline'}>
              <Typography mr={9}>相手</Typography>
              <SelectElement
                name="kokyaku"
                control={control}
                options={custs}
                sx={{ width: 400 }}
                rules={{ required: '選択してください' }}
              />
            </Grid2>
            <Grid2 display={'flex'} alignItems={'baseline'}>
              <Typography mr={9}>年月</Typography>
              <Controller
                control={control}
                name="dat"
                rules={{ required: '選択してください' }}
                render={({ field, fieldState }) => (
                  <FormMonthX
                    value={field.value}
                    onChange={field.onChange}
                    sx={{
                      mr: 1,
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid2>
            <Grid2 display={'flex'} alignItems={'center'}>
              <Typography mr={5}>詳細表示</Typography>
              <CheckboxElement size="medium" name={'showDetailFlg'} control={control} />
            </Grid2>
          </Grid2>
          <DialogActions>
            <Button type="submit">自動生成</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};
