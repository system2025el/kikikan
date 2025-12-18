import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle, Typography } from '@mui/material';

export const IsDirtyAlertDialog = ({
  open,
  handleCloseDirty,
  handleCloseAll,
}: {
  open: boolean;
  handleCloseDirty: () => void;
  handleCloseAll: () => void;
}) => {
  return (
    <>
      <Dialog open={open}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>保存されていません</Box>
        </DialogTitle>
        <DialogContentText m={2}>入力内容を破棄しますか？</DialogContentText>
        <DialogActions>
          <Button color="error" onClick={() => handleCloseAll()}>
            破棄
          </Button>
          <Button onClick={() => handleCloseDirty()}>戻る</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

/**
 * 削除警告ダイアログ
 * @param param0
 * @returns {JSX.Element}
 */
export const WillDeleteAlertDialog = ({
  open,
  data,
  title,
  push,
  handleCloseDelete,
  handleConfirmDelete,
}: {
  open: boolean;
  data: string;
  title?: string;
  push?: boolean;
  handleCloseDelete: () => void;
  handleConfirmDelete: () => void;
}) => {
  /** 表示するタイトル文言 */
  const dispTitle = title ?? '無効化';
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>{dispTitle}</Box>
      </DialogTitle>
      <DialogContentText m={2}>
        {data}が{dispTitle}されます。
      </DialogContentText>
      <DialogActions>
        <Button color="error" onClick={() => handleConfirmDelete()} loading={push ?? false}>
          {dispTitle}
        </Button>
        <Button onClick={() => handleCloseDelete()}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
