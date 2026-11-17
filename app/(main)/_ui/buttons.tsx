'use client';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Button, IconButton } from '@mui/material';

/**
 * ダイアログを閉じるボタン
 * @param param0 ダイアログを閉じる関数
 * @returns 閉じるボタン（×ボタン）
 */
export const CloseMasterDialogButton = ({ handleCloseDialog }: { handleCloseDialog: () => void }) => {
  return (
    <IconButton
      sx={{
        bgcolor: 'primary.main',
        color: 'white',
        '&:hover': {
          backgroundColor: 'primary.dark',
        },
      }}
      onClick={() => handleCloseDialog()}
    >
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};
/**
 * ダイアログの編集モードを操作するボタン
 * @param param0 編集モードを操作する関数
 * @returns {JSXElement} 編集ボタン
 */
export const MakeEditModeButton = ({ disabled, handleEditable }: { disabled: boolean; handleEditable: () => void }) => {
  return (
    <Button
      disabled={disabled}
      onClick={() => {
        handleEditable();
      }}
      sx={{ alignItems: 'center' }}
    >
      <ModeEditIcon fontSize="small" />
      編集
    </Button>
  );
};

/**
 * フォームの内容をサブミットする保存ボタン
 * @param param0 フォームのボタン押下されたときの種類
 * @returns 保存ボタン
 */
export const SubmitButton = ({
  type,
  disabled,
  push,
  onClick,
}: {
  type: 'submit' | undefined;
  disabled: boolean;
  push: boolean;
  onClick: () => void;
}) => {
  return (
    <Button type={type} disabled={disabled} onClick={onClick} sx={{ alignItems: 'center' }} loading={push}>
      <SaveAsIcon fontSize="small" />
      保存終了
    </Button>
  );
};

export const DeleteButton = ({
  type,
  disabled,
  isDeleted,
  push,
  onClick,
}: {
  type: 'submit' | undefined;
  disabled: boolean;
  isDeleted: boolean;
  push: boolean;

  onClick: () => void;
}) => {
  return (
    <>
      <Button
        type={type}
        disabled={disabled}
        color="error"
        onClick={onClick}
        sx={{ alignItems: 'center' }}
        loading={push}
      >
        {isDeleted ? (
          <>
            <CheckIcon fontSize="small" />
            有効化
          </>
        ) : (
          <>
            <BlockIcon fontSize="small" />
            無効化
          </>
        )}
      </Button>
    </>
  );
};
