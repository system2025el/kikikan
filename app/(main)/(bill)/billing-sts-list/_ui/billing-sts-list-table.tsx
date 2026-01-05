'use client';

import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid2,
  IconButton,
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
import { useMemo, useState } from 'react';

import { useUserStore } from '@/app/_lib/stores/usestore';
import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';
import { MuiTablePagination } from '@/app/(main)/_ui/table-pagination';
import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '@/app/(main)/(masters)/_lib/constants';
import { LightTooltipWithText } from '@/app/(main)/(masters)/_ui/tables';

import { CreateBillDialog } from '../../bill-list/_ui/create-bill-dialog';
import { changeSeikyuDat } from '../_lib/funcs';
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
  isFirst,
  custs,
  setPage,
  refetch,
}: {
  isLoading: boolean;
  page: number;
  kokyakuId: number;
  tantouNam: string | null;
  billSts: BillingStsTableValues[];
  isFirst: boolean;
  custs: SelectTypes[];
  setPage: React.Dispatch<React.SetStateAction<number>>;
  refetch: () => Promise<void>;
}) => {
  /** テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;

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
      {isLoading && !isFirst ? (
        <Loading />
      ) : isFirst && (!list || list.length === 0) ? (
        <></>
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
                <BillingStsRow key={index} juchu={j} refetch={refetch} />
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

      <CreateBillDialog
        open={createOpen}
        kokyakuId={kokyakuId}
        tantouNam={tantouNam}
        setDialogOpen={setCreateOpen}
        custs={custs}
      />

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
const BillingStsRow = ({ juchu, refetch }: { juchu: BillingStsTableValues; refetch: () => Promise<void> }) => {
  /* ログインユーザー */
  const user = useUserStore((state) => state.user);

  /* 行の開閉 */
  const [open, setOpen] = useState(false);

  /* 請求完了日変更ダイアログ */
  const [changeDatOpen, setChangeDatOpen] = useState(false);
  /* 編集する明細のID */
  const [meisaiToUpd, setMeisaiToUpd] = useState<{
    juchuId: number;
    kziHeadId: number;
    shukoDat: Date;
    nyukoDat: Date;
    currentDat: Date | null;
  }>({
    juchuId: FAKE_NEW_ID,
    kziHeadId: FAKE_NEW_ID,
    shukoDat: new Date(),
    nyukoDat: new Date(),
    currentDat: null,
  });
  /* 新しい請求済み期間 */
  const [newDat, setNewDat] = useState<Date | null>(null);

  /* methods ------------------------------------------------------- */
  /* 請求完了日を変更する処理 */
  const handleChangeDat = async () => {
    console.log('current::::: ', meisaiToUpd.currentDat, ', new :::::::', newDat);
    const m = meisaiToUpd;
    const changeTo = {
      juchuId: m.juchuId,
      kziHeadId: m.kziHeadId,
      newDat: newDat! > m.nyukoDat ? m.nyukoDat : newDat! < m.shukoDat ? m.shukoDat : newDat!,
    };
    await changeSeikyuDat(changeTo, user?.name ?? '');
    refetch();
    setOpen(true);
    setChangeDatOpen(false);
  };

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
            sx={{ p: 0, m: 0, minWidth: 1, justifyContent: 'left' }}
            onClick={() => window.open(`/order/${juchu.juchuId}/view`)}
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
                      onClick={() => {
                        setNewDat(h.seikyuDat ? new Date(h.seikyuDat) : null);
                        setMeisaiToUpd({
                          juchuId: juchu.juchuId,
                          kziHeadId: h.kziHeadId,
                          nyukoDat: new Date(h.nyukoDat),
                          shukoDat: new Date(h.shukoDat),
                          currentDat: h.seikyuDat ? new Date(h.seikyuDat) : null,
                        });
                        setChangeDatOpen(true);
                      }}
                    >
                      {h.seikyuDat ? ` ～ ${h.seikyuDat}` : ''}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* 請求済み期間変更ダイアログ */}
            <Dialog
              open={changeDatOpen}
              onClose={() => {
                setChangeDatOpen(false);
                setNewDat(null);
              }}
            >
              <DialogTitle alignContent={'center'} display={'flex'} justifyContent={'space-between'} ml={5} mt={1}>
                請求済み期間を変更します。
                <CloseMasterDialogButton
                  handleCloseDialog={() => {
                    setNewDat(null);
                    setChangeDatOpen(false);
                  }}
                />
              </DialogTitle>

              <DialogContent sx={{ m: 5 }}>
                <Typography mb={2}>
                  {toJapanYMDString(meisaiToUpd.shukoDat)}～{toJapanYMDString(meisaiToUpd.nyukoDat)}で選択してください
                </Typography>
                <Stack sx={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
                  <Typography mr={3}>請求済み期間</Typography>
                  <FormDateX
                    value={newDat}
                    onChange={(date) => {
                      const m = meisaiToUpd;
                      const theDate = date! > m.nyukoDat ? m.nyukoDat : date! < m.shukoDat ? null : date!;
                      setNewDat(theDate);
                    }}
                    maxDate={meisaiToUpd.nyukoDat}
                    minDate={meisaiToUpd.shukoDat}
                  />
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button
                  onClick={() => handleChangeDat()}
                  disabled={
                    !newDat ||
                    (meisaiToUpd.currentDat
                      ? toJapanYMDString(meisaiToUpd.currentDat) === toJapanYMDString(newDat)
                      : false)
                  }
                >
                  変更
                </Button>
                <Button
                  onClick={() => {
                    setChangeDatOpen(false);
                    setNewDat(null);
                  }}
                >
                  戻る
                </Button>
              </DialogActions>
            </Dialog>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};
