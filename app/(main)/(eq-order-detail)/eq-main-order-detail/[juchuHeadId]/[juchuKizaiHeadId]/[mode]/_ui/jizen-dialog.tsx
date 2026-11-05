'use client';

import { Box, Button, DialogActions, DialogContent, DialogTitle, Paper, Typography } from '@mui/material';
import { useState } from 'react';

import { DateTime } from '@/app/(main)/_ui/date';

/**
 * 事前準備の一括設定ダイアログ
 * 選択した明細に、準備日時をまとめて設定または解除する
 * @param selectedLength 選択中の明細数
 * @param maxDate 選択できる最後の日（選択した明細の出庫場所の出庫日時のうち最も早いもの。明細のセルと同じ上限）
 * @param handleSet 設定（準備数が未入力の明細は合計数になる）
 * @param handleClear 解除
 * @param handleClose 閉じる
 */
export const JizenDialog = ({
  selectedLength,
  maxDate,
  handleSet,
  handleClear,
  handleClose,
}: {
  selectedLength: number;
  maxDate: Date | null;
  handleSet: (jizenDat: Date) => void;
  handleClear: () => void;
  handleClose: () => void;
}) => {
  const [jizenDat, setJizenDat] = useState<Date | null>(null);

  return (
    <Paper>
      <DialogTitle>事前準備</DialogTitle>
      <DialogContent dividers>
        <Typography fontSize="small" mb={2}>
          選択した{selectedLength}件の機材に事前日時を設定します。事前数が未入力の機材は合計数を事前数にします。
        </Typography>
        <Box display="flex" alignItems="center">
          <Typography mr={2}>事前日時</Typography>
          <DateTime value={jizenDat} maxDate={maxDate ?? undefined} onChange={setJizenDat} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={handleClear}>
          解除
        </Button>
        <Box flexGrow={1} />
        <Button variant="contained" disabled={!jizenDat} onClick={() => jizenDat && handleSet(jizenDat)}>
          設定
        </Button>
        <Button onClick={handleClose}>キャンセル</Button>
      </DialogActions>
    </Paper>
  );
};
