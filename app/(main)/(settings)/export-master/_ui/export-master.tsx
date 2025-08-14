'use client';

import { Box, Button, Container, Divider, Grid2, Paper, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { read, utils, writeFileXLSX } from 'xlsx';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { getAllEqptAndRfid } from '../_lib/funcs';
import { EqptImportRowType, EqptImportType, eqptSchema, parseNumber } from '../_lib/types';

/**
 * マスタエクスポート画面
 * @returns {JSX.Element} マスタエクスポート画面のコンポーネント
 */
export const ExportMaster = () => {
  /* スナックバーの表示するかしないか */
  const [snackBarOpen, setSnackBarOpen] = useState(false);
  /* スナックバーのメッセージ */
  const [snackBarMessage, setSnackBarMessage] = useState('ファイルが選択されていません');

  /* エクスポートボタン押下時 */
  const exportFile = async () => {
    const data = await getAllEqptAndRfid();
    // ヘッダーの日本語名
    const header = [
      'RFIDタグID ※必須',
      'RFID機材ステータス ※必須',
      '無効化フラグ ※必須',
      '[0]所属無、[1]Ⅰ課、[2]Ⅱ課、[3]Ⅲ課、[4]Ⅳ課、[5]Ⅴ課',
      '機材名 ※必須',
      'EL No.',
      '機材所属ID ※必須',
      '棟フロアコード',
      '棚コード',
      '枝コード',
      '機材グループコード',
      '機材グループ内表示順',
      '機材マスタメモ',
      '大部門名',
      '部門名',
      '集計部門名',
      '表示フラグ',
      'コンテナフラグ',
      'デフォルト日数',
      '定価',
      'ランク価格１',
      'ランク価格２',
      'ランク価格３',
      'ランク価格４',
      'ランク価格５',
    ];
    //  AOA (Array of Arrays) 形式でワークシートを作成
    const worksheet = utils.aoa_to_sheet([header, ...data]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    // 現在の日付を東京タイムゾーンで取得
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 月は0から始まるため+1
    const day = now.getDate().toString().padStart(2, '0');
    const hour = now.getHours().toString().padStart(2, '0');
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    // 各部分を結合
    const date = `${year}${month}${day}${hour}${minute}${second}`;

    writeFileXLSX(workbook, `機材RFIDマスタ_${date}.xlsx`);
    setSnackBarMessage(`機材RFIDマスタ_${date}.xlsxをエクスポートしました`);
    setSnackBarOpen(true);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
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
      />
    </Container>
  );
};
