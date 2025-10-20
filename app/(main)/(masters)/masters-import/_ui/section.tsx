'use client';
import { Box, Button, Divider, Grid2, Paper, Typography } from '@mui/material';

/**
 * マスタインポートで使う画面部品
 * @param param0
 * @returns マスタインポートで使う画面部品コンポーネント
 */
export const Section = ({
  masterName,
  fileName,
  fileInputId,
  handleFileUpload,
  handleImport,
}: {
  masterName: string;
  fileName: string;
  fileInputId: string;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>, type: 'eqpt' | 'customer' | '') => void;
  handleImport: () => void;
}) => {
  return (
    <Paper variant="outlined" sx={{ minWidth: '100%' }}>
      <Box width={'100%'} display={'flex'} p={2}>
        <Typography>{masterName}マスタインポート</Typography>
      </Box>
      <Divider sx={{ mx: 1 }} />
      <Grid2 container width={'100%'} display={'flex'} p={2} alignItems={'center'}>
        <Grid2 size={2}></Grid2>
        <Grid2 size={2} justifyItems={'center'}>
          <Box>
            <input
              accept=".xlsx, .xls, .xlsm"
              id={fileInputId}
              type="file"
              style={{ display: 'none' }}
              onChange={(e) =>
                handleFileUpload(e, masterName === '機材RFID' ? 'eqpt' : masterName === '顧客' ? 'customer' : '')
              }
            />
            <label htmlFor={fileInputId}>
              <Button component="span">Excelファイルを選択</Button>
            </label>
          </Box>
        </Grid2>
        <Grid2 size={4} justifyItems={'center'}>
          <Typography>{fileName}</Typography>
        </Grid2>
        <Grid2 size={2} justifyItems={'center'}>
          <Box>
            <Button size="medium" onClick={() => handleImport()}>
              登録
            </Button>
          </Box>
        </Grid2>
        <Grid2 size={2}></Grid2>
      </Grid2>
    </Paper>
  );
};
