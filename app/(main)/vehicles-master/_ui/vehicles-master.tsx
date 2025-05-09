'use client';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import Form from 'next/form';
import { useRouter } from 'next/navigation';

import { VehiclesMasterTable } from './veicles-master-table';

export const VehiclesMaster = () => {
  return (
    <>
      <Title />
      <VehiclesMasterTable />
    </>
  );
};

const Title = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };
  return (
    <>
      <Box width={'100%'} bgcolor={grey[300]} py={2} alignItems={'center'} p={2} display={'flex'}>
        <Typography>車両マスタ</Typography>
        <Button sx={{ ml: '40%' }} onClick={() => handleBack()}>
          戻る
        </Button>
      </Box>
    </>
  );
};
