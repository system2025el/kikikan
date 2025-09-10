import { Box, Button, Checkbox, DialogActions, DialogTitle, Stack } from '@mui/material';

import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';

export const FirstDialogPage = ({
  handleClose,
  addKizaiTbl,
  toSecondPage,
}: {
  handleClose: () => void;
  addKizaiTbl: () => void;
  toSecondPage: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'flex-end'}>
        <CloseMasterDialogButton handleCloseDialog={() => handleClose()} />
      </DialogTitle>
      <Stack p={4}> 機材明細から自動生成しますか？</Stack>
      <DialogActions>
        <Button onClick={() => toSecondPage(true)}>はい</Button>
        <Button
          onClick={() => {
            addKizaiTbl();
            handleClose();
          }}
        >
          いいえ
        </Button>
      </DialogActions>
    </>
  );
};

export const SecondDialogPage = ({
  handleClose,
  addKizaiTbl,
}: {
  handleClose: () => void;
  addKizaiTbl: () => void;
}) => {
  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'flex-end'}>
        <CloseMasterDialogButton
          handleCloseDialog={() => {
            handleClose();
          }}
        />
      </DialogTitle>
      <Box p={4}>
        <Stack>
          <Checkbox />
          機材をまとめて表示する
        </Stack>
      </Box>
      <DialogActions>
        <Button
          onClick={() => {
            addKizaiTbl();
            handleClose();
          }}
        >
          キャンセル
        </Button>
      </DialogActions>
    </>
  );
};
