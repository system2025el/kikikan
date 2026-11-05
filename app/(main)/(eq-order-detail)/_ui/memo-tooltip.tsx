'use client';

import EditNoteIcon from '@mui/icons-material/EditNote';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';

import { MEMO_MAX_LENGTH } from '@/app/_lib/constants';
import { validationMessages } from '@/app/(main)/_lib/validation-messages';

export const MemoTooltip = (props: {
  name: string;
  memo: string;
  rowIndex: number;
  disabled: boolean;
  handleMemoChange: (rowIndex: number, memo: string) => void;
}) => {
  const { name, memo, rowIndex, disabled, handleMemoChange } = props;
  const [open, setOpen] = useState(false);
  const [isSave, setIsSave] = useState(false);
  const [equipmentMemo, setEquipmentMemo] = useState(memo);
  // 外からメモが変わったら（保存後の再取得・取消など）入力中の値も合わせる。
  // useEffect で合わせると表示直後に全行がもう一度描画されるので、描画中に前回の値と比べる
  const [prevMemo, setPrevMemo] = useState(memo);
  if (memo !== prevMemo) {
    setPrevMemo(memo);
    setEquipmentMemo(memo);
  }
  const isOverMaxLength = equipmentMemo.length > MEMO_MAX_LENGTH;

  const handleOpen = () => {
    setOpen(true);
    setIsSave(false);
  };
  const handleClose = () => {
    setEquipmentMemo(props.memo);
    setOpen(false);
  };

  const handleSave = () => {
    if (isOverMaxLength) return;
    setIsSave(true);
    handleMemoChange(rowIndex, equipmentMemo);
    setOpen(false);
  };

  return (
    <>
      <Tooltip title={equipmentMemo} arrow sx={{ p: 0 }}>
        <IconButton onClick={handleOpen} sx={{ padding: 0 }} color={memo ? 'primary' : 'default'}>
          <EditNoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle fontSize="medium">{name}</DialogTitle>
        <DialogContent>
          <TextField
            value={equipmentMemo}
            onChange={(e) => setEquipmentMemo(e.target.value)}
            fullWidth
            multiline
            minRows={3}
            disabled={disabled}
            error={isOverMaxLength}
            helperText={isOverMaxLength ? validationMessages.maxStringLength(MEMO_MAX_LENGTH) : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave} variant="contained" disabled={disabled || isOverMaxLength} loading={isSave}>
            保存
          </Button>
          <Button onClick={handleClose}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
