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
  handleCloseDelete,
  handleCloseAll,
}: {
  open: boolean;
  data: string;
  handleCloseDelete: () => void;
  handleCloseAll: () => void;
}) => {
  return (
    <>
      <Dialog open={open}>
        <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
          <WarningIcon color="error" />
          <Box>無効化</Box>
        </DialogTitle>
        <DialogContentText m={2}>{data}が無効化されます。</DialogContentText>
        <DialogActions>
          <Button color="error" onClick={() => handleCloseAll()}>
            無効化
          </Button>
          <Button onClick={() => handleCloseDelete()}>戻る</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
