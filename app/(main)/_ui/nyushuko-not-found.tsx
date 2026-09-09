'use client';

import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import { Box, Button, Grid2, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * 入出庫明細が見つからない場合の表示
 *
 * 受注から削除された機材の実績をクリアしたり、入出庫日時が変更されたりすると伝票ごと
 * 消えるため、この画面が行き止まりになる。明細画面は一覧から別タブで開かれるので、
 * 通常画面と同じ「閉じる」ボタンを置く。
 *
 * @param message 表示するメッセージ
 */
export const NyushukoDetailNotFound = ({ message }: { message: string }) => {
  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <Button onClick={() => window.close()}>閉じる</Button>
      </Box>
      <Paper variant="outlined">
        <Typography p={2}>{message}</Typography>
      </Paper>
    </Box>
  );
};

/**
 * 入出庫詳細が見つからない場合の表示
 *
 * 通常画面と同じ「入出庫明細」ボタンを置いて明細画面へ戻れるようにする。
 * 行き止まりの画面を履歴に残さないよう replace で遷移する。
 *
 * @param message 表示するメッセージ
 * @param backLabel 戻るボタンのラベル（出庫明細／入庫明細）
 * @param backPath 戻り先の明細画面のパス
 */
export const NyushukoEqptDetailNotFound = ({
  message,
  backLabel,
  backPath,
}: {
  message: string;
  backLabel: string;
  backPath: string;
}) => {
  const router = useRouter();

  return (
    <Box>
      <Grid2 container justifyContent={'end'} alignItems={'center'} spacing={2} mb={1}>
        <Button onClick={() => router.replace(backPath)}>
          <Box display={'flex'} alignItems={'center'}>
            <ArrowLeftIcon fontSize="small" />
            {backLabel}
          </Box>
        </Button>
      </Grid2>
      <Paper variant="outlined">
        <Typography p={2}>{message}</Typography>
      </Paper>
    </Box>
  );
};
