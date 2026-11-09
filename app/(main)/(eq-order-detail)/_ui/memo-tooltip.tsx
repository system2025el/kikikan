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
  // 明細の行数×2つ並ぶので、ツールチップは初めてマウスを乗せたとき、ダイアログは初めて開いたときに作る
  // （どちらも閉じていても部品の処理は走り、行数が多いと表示が遅くなるため）
  const [tooltipActive, setTooltipActive] = useState(false);
  const [dialogMounted, setDialogMounted] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    setDialogMounted(true);
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

  // 初めてマウスが乗ったときにツールチップを作る。開閉は Tooltip に任せる
  // （作り直したボタンの上でマウスが少しでも動けば、Tooltip が普段どおり開く。こちらで開閉を持つと、
  //  ボタンを作り直した直後にマウスが離れたときに閉じる合図が届かず、開いたまま残ることがある）
  const iconButton = (
    <IconButton
      onClick={handleOpen}
      onMouseEnter={tooltipActive ? undefined : () => setTooltipActive(true)}
      sx={{ padding: 0 }}
      color={memo ? 'primary' : 'default'}
    >
      <EditNoteIcon fontSize="small" />
    </IconButton>
  );

  return (
    <>
      {tooltipActive ? (
        <Tooltip title={equipmentMemo} arrow sx={{ p: 0 }}>
          {iconButton}
        </Tooltip>
      ) : (
        iconButton
      )}

      {dialogMounted && (
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
      )}
    </>
  );
};
