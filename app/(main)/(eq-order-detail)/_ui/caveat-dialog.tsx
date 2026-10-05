'use client';

import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';

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

export const DeleteAlertDialog = ({
  selectedLength,
  shukoResultCount = 0,
  open,
  onClick,
}: {
  selectedLength: number;
  /** 削除対象のうち出庫実績・補正数がある機材の件数（ピッキング・最終確認の両方を含む） */
  shukoResultCount?: number;
  open: boolean;
  onClick: (result: boolean) => void;
}) => {
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
        {selectedLength}件の機材を削除してもよろしいでしょうか？
        {shukoResultCount > 0 && (
          <Box component="span" display="block" mt={2} color="error.main">
            うち{shukoResultCount}件は既に実績があります。
            <br />
            出庫明細に「受注削除」として残るので、現物を取り除いてください。
          </Box>
        )}
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => handleClick(true)} loading={isLoading} color="error">
          削除
        </Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

/** 出庫作業中に日時を変えたとき、削除される実績の説明（キープ明細） */
const WORKING_DELETE_ITEMS_DEFAULT = ['入庫実績', 'コンテナ実績', '出庫場所が変更された実績'];

/**
 * 出庫作業中に日時を変えたとき、削除される実績の説明（メイン受注機材明細）
 * コンテナの出庫実績は出庫日時を変えても日時だけ更新し、出庫場所をなくした場合だけその場所の分を削除する
 */
export const WORKING_DELETE_ITEMS_MAIN = [
  '入庫実績',
  '出庫場所が変更された機材の実績',
  '出庫場所をなくした場合の、その場所のコンテナ実績',
];

export const WorkingConfirmDialog = ({
  open,
  onClose,
  deleteItems = WORKING_DELETE_ITEMS_DEFAULT,
}: {
  open: boolean;
  onClose: (isConfirmed: boolean) => void;
  /** 削除される実績の説明（画面によって違うため） */
  deleteItems?: string[];
}) => {
  return (
    <Dialog open={open} onClose={() => onClose(false)}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>作業中</Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          出庫作業が開始されています。
          <br />
          {deleteItems.map((item) => (
            <Fragment key={item}>
              ・{item}
              <br />
            </Fragment>
          ))}
          日時を変更するとこれらの実績は削除されますがよろしいですか？
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(true)} color="error" variant="contained" autoFocus>
          実績を削除して保存
        </Button>
        <Button onClick={() => onClose(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
