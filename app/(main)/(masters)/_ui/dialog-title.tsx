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
  handleCloseDialog,
  handleEditable,
  dialogTitle,
}: {
  editable: boolean;
  isNew?: boolean;
  handleEditable: () => void;
  handleCloseDialog: () => void;
  dialogTitle: string;
}) => {
  /* useTheme */
  const theme = useTheme();
  const colorOfThis = alpha(theme.palette.primary.main, 0.5);
  return (
    <DialogTitle display={'flex'} justifyContent={'space-between'} alignItems={'center'} bgcolor={colorOfThis}>
      {dialogTitle}
      {editable && !isNew && <Typography>編集モード</Typography>}
      {isNew && <Typography>新規登録</Typography>}
      <Stack>
        <SubmitButton type="submit" />
        <MakeEditModeButton handleEditable={handleEditable} />
        <CloseMasterDialogButton handleCloseDialog={handleCloseDialog} />
      </Stack>
    </DialogTitle>
  );
};
