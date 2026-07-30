'use client';

import { Box, Button, Container, Divider, Grid2, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { writeFileXLSX } from 'xlsx';

import { permission } from '@/app/(main)/_lib/permission';
import { BackButton } from '@/app/(main)/_ui/buttons';
import { PermissionGuard } from '@/app/(main)/_ui/permission-guard';

import { getAllEqptAndRfid } from '../_lib/funcs';

/**
 * マスタエクスポート画面
 * @returns {JSX.Element} マスタエクスポート画面のコンポーネント
 */
export const ExportMaster = () => {
  /** スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /** スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('ファイルが選択されていません');
  /** 連打制御 */
  const [push, setPush] = useState<boolean>(false);

  /* methods ---------------------------------------------- */
  /** エクスポートボタン押下時 */
  const exportFile = async () => {
    setPush(true);
    try {
      const data = await getAllEqptAndRfid();
      if (data) {
        writeFileXLSX(data.workbook, `RFID機材表_${data.date}.xlsx`);
        setSnackBarMessage(`RFID機材表_${data.date}.xlsxをエクスポートしました`);
      } else {
        setSnackBarMessage(`エクスポートエラー: データがありません`);
      }
    } catch (e) {
      setSnackBarMessage(`エクスポートエラー: エクスポートに失敗しました`);
    } finally {
      setSnackBarOpen(true);
      setPush(false);
    }
  };

  return (
    <PermissionGuard category={'masters'} required={permission.mst_upd}>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        <Stack direction={'column'} spacing={5} sx={{ minWidth: '100%' }}>
          <Paper variant="outlined" sx={{ minWidth: '100%' }}>
            <Box width={'100%'} display={'flex'} p={2}>
              <Typography>機材RFIDマスタエクスポート</Typography>
            </Box>
            <Divider sx={{ mx: 1 }} />
            <Grid2 container width={'100%'} display={'flex'} p={2} alignItems={'center'}>
              <Box>
                <Button size="medium" onClick={() => exportFile()} loading={push}>
                  エクセルエクスポート
                </Button>
              </Box>
            </Grid2>
          </Paper>
        </Stack>
        <Snackbar
          open={snackBarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackBarOpen(false)}
          message={snackBarMessage}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ marginTop: '65px' }}
        />
      </Container>
    </PermissionGuard>
  );
};
