'use client';

import { alpha, DialogTitle, Stack, Typography, useTheme } from '@mui/material';

import { CloseMasterDialogButton, MakeEditModeButton, SubmitButton } from '../../_ui/buttons';

/**
 * マスタ系統一の詳細ダイアログタイトル
 * @param
 * @returns {JSX.Element} マスタ系統一の詳細ダイアログタイトル
 */
export const MasterDialogTitle = ({
  editable,
  isNew,
  handleClose,
  handleEditable,
  dialogTitle,
  isDirty,
}: {
  editable: boolean;
  isNew: boolean;
  handleEditable: () => void;
  handleClose: () => void;
  dialogTitle: string;
  isDirty: boolean;
}) => {
  /* useTheme */
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  /* 閉じるボタン押下 */
  const handleCloseDialog = () => {
    handleClose();
  };
  return (
    <DialogTitle display={'flex'} justifyContent={'space-between'} alignItems={'center'} bgcolor={colorOfThis}>
      {dialogTitle}
      {editable && !isNew && <Typography>編集モード</Typography>}
      {isNew && <Typography>新規登録</Typography>}
      <Stack>
        <SubmitButton type="submit" disabled={isDirty ? false : true} />
        <MakeEditModeButton handleEditable={handleEditable} disabled={editable ? true : false} />
        <CloseMasterDialogButton handleCloseDialog={handleCloseDialog} />
      </Stack>
    </DialogTitle>
  );
};
