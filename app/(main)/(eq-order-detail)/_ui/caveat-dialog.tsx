'use client';

import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle } from '@mui/material';
import { useEffect, useState } from 'react';
import { set } from 'zod';

export const AlertDialog = ({
  open,
  title,
  message,
  onClick,
}: {
  open: boolean;
  title: string;
  message: string;
  onClick: () => void;
}) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>{title}</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        {message}
      </DialogContentText>
      <DialogActions>
        <Button onClick={onClick}>確認</Button>
      </DialogActions>
    </Dialog>
  );
};

export const MoveAlertDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (result: boolean) => {
    setIsLoading(true);
    onClick(result);
  };

  useEffect(() => {
    if (open) {
      setIsLoading(false);
    }
  }, [open]);

  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>出庫日時が更新されました</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        移動日を更新しますか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isLoading}>
          更新
        </Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteAlertDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (result: boolean) => {
    setIsLoading(true);
    onClick(result);
  };

  useEffect(() => {
    if (open) {
      setIsLoading(false);
    }
  }, [open]);
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>削除</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        削除してもよろしいでしょうか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isLoading}>
          削除
        </Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
