'use client';

import { alpha, DialogTitle, Stack, Typography, useTheme } from '@mui/material';

import {
  CloseMasterDialogButton,
  DeleteButton,
  MakeEditModeButton,
  RestoreButton,
  SubmitButton,
} from '../../_ui/buttons';

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
  isDeleted,
  handleClose,
  handleEditable,
  setAction,
}: {
  editable: boolean;
  isNew: boolean;
  isDirty: boolean;
  dialogTitle: string;
  isDeleted: boolean;
  handleEditable: () => void;
  handleClose: () => void;
  setAction: React.Dispatch<React.SetStateAction<'save' | 'delete' | 'restore' | undefined>>;
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
        {!isNew && <MakeEditModeButton handleEditable={handleEditable} disabled={editable ? true : false} />}
        {!isDeleted && !isNew && (
          <DeleteButton disabled={isNew ? true : false} type="submit" onClick={() => setAction('delete')} />
        )}
        {isDeleted && !isNew && (
          <RestoreButton type="submit" disabled={isNew ? true : false} onClick={() => setAction('restore')} />
        )}
        <CloseMasterDialogButton handleCloseDialog={handleCloseDialog} />
      </Stack>
    </DialogTitle>
  );
};
