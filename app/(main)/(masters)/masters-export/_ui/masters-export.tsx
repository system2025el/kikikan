'use client';

import { Box, Button, Container, Divider, Grid2, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { writeFileXLSX } from 'xlsx';

import { BackButton } from '@/app/(main)/_ui/buttons';

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

  /* methods ---------------------------------------------- */
  /** エクスポートボタン押下時 */
  const exportFile = async () => {
    const data = await getAllEqptAndRfid();
    if (data) {
      writeFileXLSX(data.workbook, `RFID機材表_${data.date}.xlsx`);
      setSnackBarMessage(`RFID機材表_${data.date}.xlsxをエクスポートしました`);
      setSnackBarOpen(true);
    } else {
      setSnackBarMessage(`エクスポートエラー: データがありません`);
      setSnackBarOpen(true);
    }
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Stack direction={'column'} spacing={5} sx={{ minWidth: '100%' }}>
        <Paper variant="outlined" sx={{ minWidth: '100%' }}>
          <Box width={'100%'} display={'flex'} p={2}>
            <Typography>機材RFIDマスタエクスポート</Typography>
          </Box>
          <Divider sx={{ mx: 1 }} />
          <Grid2 container width={'100%'} display={'flex'} p={2} alignItems={'center'}>
            <Box>
              <Button size="medium" onClick={() => exportFile()}>
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
  );
};
