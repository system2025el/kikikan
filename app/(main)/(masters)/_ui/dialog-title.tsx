'use client';

import { DialogTitle, Stack, Typography } from '@mui/material';

import { CloseMasterDialogButton, MakeEditModeButton, SubmitButton } from '../../_ui/buttons';

/**
 * マスタ系統一の詳細ダイアログタイトル
 * @param
 * @returns {JSX.Element} マスタ系統一の詳細ダイアログタイトル
 */
export const MasterDialogTitle = ({
  colorOfThis,
  editable,
  handleCloseDialog,
  handleEditable,
  dialogTitle,
}: {
  colorOfThis: string;
  editable: boolean;
  handleEditable: () => void;
  handleCloseDialog: () => void;
  dialogTitle: string;
}) => {
  return (
    <DialogTitle display={'flex'} justifyContent={'space-between'} alignItems={'center'} bgcolor={colorOfThis}>
      {dialogTitle}
      {editable && <Typography>編集モード</Typography>}
      <Stack>
        <SubmitButton type="submit" />
        <MakeEditModeButton handleEditable={handleEditable} />
        <CloseMasterDialogButton handleCloseDialog={handleCloseDialog} />
      </Stack>
    </DialogTitle>
  );
};
