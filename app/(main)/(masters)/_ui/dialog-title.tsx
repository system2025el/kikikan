'use client';

import { DialogTitle, lighten, Stack, Toolbar, Typography, useTheme } from '@mui/material';

import { User } from '@/app/_lib/stores/usestore';

import { permission } from '../../_lib/permission';
import { CloseMasterDialogButton, DeleteButton, MakeEditModeButton, SubmitButton } from '../../_ui/buttons';

/**
 * マスタ系統一の詳細ダイアログタイトル
 * @param
 * @returns {JSX.Element} マスタ系統一の詳細ダイアログタイトル
 */
export const MasterDialogTitle = ({
  user,
  editable,
  isNew,
  dialogTitle,
  isDirty,
  isDeleted,
  push,
  handleClose,
  handleEditable,
  setAction,
}: {
  user: User | null;
  editable: boolean;
  isNew: boolean;
  isDirty: boolean;
  dialogTitle: string;
  isDeleted: boolean;
  push: boolean;
  handleEditable: () => void;
  handleClose: () => void;
  setAction: React.Dispatch<React.SetStateAction<'save' | 'delete' | 'restore' | undefined>>;
}) => {
  /* useTheme */
  const theme = useTheme();
  const colorOfThis = lighten(theme.palette.primary.main, 0.5);
  /* 閉じるボタン押下 */
  const handleCloseDialog = () => {
    handleClose();
  };

  return (
    <>
      <DialogTitle
        display={'flex'}
        justifyContent={'space-between'}
        alignItems={'center'}
        bgcolor={colorOfThis}
        position={'fixed'}
        top={0}
        width={'100%'}
        zIndex={1200}
      >
        {dialogTitle}
        {editable && !isNew && <Typography>編集モード</Typography>}
        {isNew && <Typography>新規登録</Typography>}
        <Stack>
          <SubmitButton
            type="submit"
            disabled={isDirty ? false : true || !((user?.permission.masters ?? 0) & permission.mst_upd)}
            onClick={() => setAction('save')}
            push={push}
          />
          {!isNew && (
            <>
              <MakeEditModeButton
                handleEditable={handleEditable}
                disabled={editable ? true : false || !((user?.permission.masters ?? 0) & permission.mst_upd)}
              />
              <DeleteButton
                disabled={isNew ? true : false || !((user?.permission.masters ?? 0) & permission.mst_upd)}
                type="submit"
                onClick={isDeleted ? () => setAction('restore') : () => setAction('delete')}
                isDeleted={isDeleted}
                push={push}
              />
            </>
          )}
          <CloseMasterDialogButton handleCloseDialog={handleCloseDialog} />
        </Stack>
      </DialogTitle>
      <Toolbar sx={{ bgcolor: 'white', zIndex: 1150 }} />
    </>
  );
};
