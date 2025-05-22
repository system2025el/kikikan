'use client';

import { Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export const BackButton = (props: { sx: object; label: string }) => {
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
