'use client';
import CloseIcon from '@mui/icons-material/Close';
import ModeEditIcon from '@mui/icons-material/ModeEdit';
import { Button, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';

export const BackButton = (props: { sx?: object; label: string }) => {
  const { sx, label } = props;
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  return (
    <Button sx={{ ...sx }} onClick={() => handleBack()}>
      {label}
    </Button>
  );
};

export const CloseMasterDialogButton = ({ handleCloseDialog }: { handleCloseDialog: () => void }) => {
  return (
    <IconButton sx={{ bgcolor: 'primary.main', color: 'white' }} onClick={() => handleCloseDialog()}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );
};

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

export const SubmitButton = ({ type }: { type: 'button' | 'submit' | 'reset' | undefined }) => {
  return <Button type={type}>保存</Button>;
};
