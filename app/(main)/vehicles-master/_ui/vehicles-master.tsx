'use client';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { BackButton } from '../../_ui/back-button';
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
  return (
    <>
      <Box width={'100%'} bgcolor={grey[300]} py={2} alignItems={'center'} p={2} display={'flex'}>
        <Typography>車両マスタ</Typography>
        <BackButton sx={{ ml: '40%' }} label={'戻る'} />
      </Box>
    </>
  );
};
