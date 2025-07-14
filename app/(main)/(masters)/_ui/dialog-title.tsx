'use client';

import { Delete } from '@mui/icons-material';
import { alpha, DialogTitle, Stack, Typography, useTheme } from '@mui/material';

import { CloseMasterDialogButton, DeleteFlgButton, MakeEditModeButton, SubmitButton } from '../../_ui/buttons';

/**
 * マスタ系統一の詳細ダイアログタイトル
 * @param
 * @returns {JSX.Element} マスタ系統一の詳細ダイアログタイトル
 */
export const MasterDialogTitle = ({
  editable,
  isNew,
  dialogTitle,
  isDirty,
  handleClose,
  handleEditable,
  setAction,
}: {
  editable: boolean;
  isNew: boolean;
  dialogTitle: string;
  isDirty: boolean;
  handleEditable: () => void;
  handleClose: () => void;
  setAction: React.Dispatch<React.SetStateAction<'save' | 'delete' | undefined>>;
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
        <SubmitButton type="submit" disabled={isDirty ? false : true} onClick={() => setAction('save')} />
        <MakeEditModeButton handleEditable={handleEditable} disabled={editable ? true : false} />
        <DeleteFlgButton disabled={isNew ? true : false} type="submit" onClick={() => setAction('delete')} />
        <CloseMasterDialogButton handleCloseDialog={handleCloseDialog} />
      </Stack>
    </DialogTitle>
  );
};
