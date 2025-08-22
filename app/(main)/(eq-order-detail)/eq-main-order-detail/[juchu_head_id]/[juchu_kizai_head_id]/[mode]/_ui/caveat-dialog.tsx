import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle } from '@mui/material';

export const SaveAlertDialog = ({ open, onClick }: { open: boolean; onClick: () => void }) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>保存されていません</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        1度保存をしてください
      </DialogContentText>
      <DialogActions>
        <Button onClick={onClick}>確認</Button>
      </DialogActions>
    </Dialog>
  );
};

export const MoveAlertDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
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
        <Button onClick={() => onClick(true)}>更新</Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
