import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle, Typography } from '@mui/material';

export const IsDirtyDialog = ({
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
