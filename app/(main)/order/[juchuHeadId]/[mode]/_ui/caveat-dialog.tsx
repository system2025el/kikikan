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

export const SelectAlertDialog = ({
  open,
  message,
  onClick,
}: {
  open: boolean;
  message: string;
  onClick: () => void;
}) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>選択項目を確認してください</Box>
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

export const CopyConfirmDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>受注ヘッダー内容を確認してください</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        受注ヘッダーをコピーしますか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => onClick(true)}>コピー</Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

export const HeadDeleteConfirmDialog = ({ open, onClick }: { open: boolean; onClick: (result: boolean) => void }) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>伝票を削除します</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        伝票を削除してもよろしいでしょうか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => onClick(true)}>削除</Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};

export const KizaiHeadDeleteConfirmDialog = ({
  open,
  onClick,
}: {
  open: boolean;
  onClick: (result: boolean) => void;
}) => {
  return (
    <Dialog open={open}>
      <DialogTitle alignContent={'center'} display={'flex'} alignItems={'center'}>
        <WarningIcon color="error" />
        <Box>受注明細を削除します</Box>
      </DialogTitle>
      <DialogContentText m={2} p={2}>
        受注明細を削除してもよろしいでしょうか？
      </DialogContentText>
      <DialogActions>
        <Button onClick={() => onClick(true)}>削除</Button>
        <Button onClick={() => onClick(false)}>戻る</Button>
      </DialogActions>
    </Dialog>
  );
};
