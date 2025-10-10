'use client';

import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
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
import { grey } from '@mui/material/colors';
import { useEffect, useMemo, useState } from 'react';

import { Loading } from '@/app/(main)/_ui/loading';

import { MuiTablePagination } from '../../../../_ui/table-pagination';
import { FAKE_NEW_ID, ROWS_PER_MASTER_TABLE_PAGE } from '../../../_lib/constants';
import { getRfidsOfTheKizai } from '../_lib/funcs';
import { RfidsMasterTableValues } from '../_lib/types';

/** 機材マスタのテーブルコンポーネント */
export const RfidMasterTable = ({
  rfids,
  kizaiId,
  isLoading,
  page,
  selectedTags,
  setIsLoading,
  setPage,
  setSelectedTags,
}: {
  rfids: RfidsMasterTableValues[] | undefined;
  kizaiId: number;
  isLoading: boolean;
  page: number;
  selectedTags: string[];
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  /* テーブル1ページの行数 */
  const rowsPerPage = ROWS_PER_MASTER_TABLE_PAGE;
  /* useState ------------------------------------------------ */
  /* ダイアログ開く機材のID、閉じるとき、未選択でFAKE_NEW_IDとする */
  const [openId, setOpenID] = useState<string>(String(FAKE_NEW_ID));
  /* 詳細ダイアログの開閉状態 */
  const [dialogOpen, setDialogOpen] = useState(false);
  /* 場所リスト */
  const [theRfids, setTheRfids] = useState<RfidsMasterTableValues[] | undefined>(rfids);

  /* methods ------------------------------------------- */
  /* 詳細ダイアログを開く関数 */
  const handleOpenDialog = (id: string) => {
    setOpenID(id);
    setDialogOpen(true);
  };
  /* ダイアログを閉じる関数 */
  const handleCloseDialog = () => {
    setDialogOpen(false);
  };
  /* 情報が変わったときに更新される */
  const refetchRfids = async () => {
    setIsLoading(true);
    const updated = await getRfidsOfTheKizai(kizaiId);
    setTheRfids(updated);
    setIsLoading(false);
  };

  /* チェックボックス押下（選択時）の処理 */
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
  /* 全選択チャックボックス押下時の処理 */
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked && theRfids) {
      const newSelected = theRfids.map((r) => r.rfidTagId);
      setSelectedTags(newSelected);
      return;
    }
    setSelectedTags([]);
  };

  /* useMemo ------------------------------------------------- */
  /* 表示するリスト */
  const list = useMemo(
    () => (theRfids && rowsPerPage > 0 ? theRfids.slice((page - 1) * rowsPerPage, page * rowsPerPage) : theRfids),
    [page, rowsPerPage, theRfids]
  );
  // テーブル最後のページ用の空データの長さ
  const emptyRows = theRfids && page > 1 ? Math.max(0, page * rowsPerPage - theRfids.length) : 0;

  /* useEffect ----------------------------------------------- */
  useEffect(() => {
    setTheRfids(rfids); // 親からのRfidsが更新された場合に同期
  }, [rfids]);

  useEffect(() => {
    setIsLoading(false); //theRfidsが変わったらローディング終わり
  }, [theRfids, setIsLoading]);

  return (
    <Box>
      <Typography pt={1} pl={2}>
        RFID一覧
      </Typography>
      <Divider />
      <Grid2 container mt={0.5} mx={0.5} justifyContent={'space-between'} alignItems={'center'}>
        <Grid2 spacing={1}>
          <MuiTablePagination arrayList={theRfids!} rowsPerPage={rowsPerPage} page={page} setPage={setPage} />
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
                  <TableCell padding="checkbox" sx={{ alignContent: 'center' }}>
                    <Checkbox
                      color="primary"
                      onChange={handleSelectAllClick}
                      sx={{
                        '& .MuiSvgIcon-root': {
                          backgroundColor: '#fff',
                          borderRadius: '4px',
                        },
                        padding: 0,
                      }}
                    />
                  </TableCell>
                  <TableCell padding="checkbox" />
                  <TableCell>RFIDタグID</TableCell>
                  <TableCell>機材ステータス</TableCell>
                  <TableCell>EL No.</TableCell>
                  <TableCell>メモ</TableCell>
                  <TableCell>無効</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {theRfids!.map((row, index) => {
                  const isItemSelected = selectedTags.includes(row.rfidTagId);

                  return (
                    <TableRow
                      hover
                      onClick={(event) => handleSelectRfidTags(event, row.rfidTagId)}
                      role="checkbox"
                      aria-checked={isItemSelected}
                      tabIndex={-1}
                      key={row.rfidTagId}
                      selected={isItemSelected}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox color="primary" checked={isItemSelected} />
                      </TableCell>
                      <TableCell align="right">{row.tblDspId}</TableCell>
                      <TableCell>{row.rfidTagId}</TableCell>
                      <TableCell>{row.stsNam}</TableCell>
                      <TableCell>{row.elNum}</TableCell>
                      <TableCell>{row.mem}</TableCell>
                      <TableCell sx={{ bgcolor: row.delFlg ? grey[300] : undefined, whiteSpace: 'nowrap' }}>
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
        {/* <RfidMasterDialog handleClose={handleCloseDialog} rfidId={openId} refetchRfids={refetchRfids} /> */}
      </Dialog>
    </Box>
  );
};
