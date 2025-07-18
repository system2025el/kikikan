import WarningIcon from '@mui/icons-material/Warning';
import { Box, Button, Dialog, DialogActions, DialogContentText, DialogTitle } from '@mui/material';

export const PreservationAlertDialog = ({ open, onClick }: { open: boolean; onClick: () => void }) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>保存されていません</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        受注ヘッダーを保存してください
      </DialogContentText>
      <DialogActions>
        <Button onClick={onClick}>はい</Button>
      </DialogActions>
    </Dialog>
  );
};
