'use client';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import BlockIcon from '@mui/icons-material/Block';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Box, Button, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useDirty } from './dirty-context';

/**
 * ブラウザバックするボタン
 * @param スタイルオブジェクトとボタンの表示文字
 * @returns 戻るボタン
 */
export const BackButton = ({ sx, label }: { sx?: object; label: string }) => {
  //const router = useRouter();
  const { requestBack } = useDirty();

  const [back, setBack] = useState(false);

  const handleBack = () => {
    if (back) return;
    setBack(true);
    requestBack();
  };

  return (
    <Button sx={{ ...sx }} onClick={() => handleBack()}>
      <Box display={'flex'} alignItems={'center'}>
        <ArrowLeftIcon fontSize="small" />
        {label}
      </Box>
    </Button>
  );
};

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
        console.log('pushEdit');
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
  onClick,
}: {
  type: 'submit' | undefined;
  disabled: boolean;
  onClick: () => void;
}) => {
  return (
    <Button type={type} disabled={disabled} onClick={onClick} sx={{ alignItems: 'center' }}>
      <SaveAsIcon fontSize="small" />
      保存終了
    </Button>
  );
};

export const DeleteButton = ({
  type,
  disabled,
  isDeleted,
  onClick,
}: {
  type: 'submit' | undefined;
  disabled: boolean;
  isDeleted: boolean;
  onClick: () => void;
}) => {
  return (
    <>
      <Button type={type} disabled={disabled} color="error" onClick={onClick} sx={{ alignItems: 'center' }}>
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
