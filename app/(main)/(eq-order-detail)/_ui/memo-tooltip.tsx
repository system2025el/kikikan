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
import { useEffect, useState } from 'react';
import { set } from 'zod';

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
  const [equipmentMemo, setEquipmentMemo] = useState('');

  useEffect(() => {
    setEquipmentMemo(memo);
  }, [memo]);

  const handleOpen = () => {
    setOpen(true);
    setIsSave(false);
  };
  const handleClose = () => {
    setEquipmentMemo(props.memo);
    setOpen(false);
  };

  const handleSave = () => {
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSave} variant="contained" disabled={disabled} loading={isSave}>
            保存
          </Button>
          <Button onClick={handleClose}>キャンセル</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
