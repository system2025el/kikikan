'use client';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloseIcon from '@mui/icons-material/Close';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import { Button, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';

/**
 * ブラウザバックするボタン
 * @param スタイルオブジェクトとボタンの表示文字
 * @returns 戻るボタン
 */
export const BackButton = ({ sx, label }: { sx?: object; label: string }) => {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  return (
    <Button sx={{ ...sx }} onClick={() => handleBack()}>
      <ArrowBackIosNewIcon fontSize="small" />
      {label}
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
    <IconButton sx={{ bgcolor: 'primary.main', color: 'white' }} onClick={() => handleCloseDialog()}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};
/**
 * ダイアログの編集モードを操作するボタン
 * @param param0 編集モードを操作する関数
 * @returns {JSXElement} 編集ボタン
 */
export const MakeEditModeButton = ({ handleEditable }: { handleEditable: () => void }) => {
  return (
    <Button
      onClick={() => {
        handleEditable();
        console.log('pushEdit');
      }}
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
export const SubmitButton = ({ type, disabled }: { type: 'submit' | undefined; disabled: boolean }) => {
  return (
    <Button type={type} disabled={disabled}>
      <SaveAsIcon fontSize="small" />
      保存終了
    </Button>
  );
};
