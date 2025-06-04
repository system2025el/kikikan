'use client';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { BackButton } from '../../_ui/back-button';
import { VehiclesMasterTable } from './veicles-master-table';

export const VehiclesMaster = () => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>車両マスタ</Typography>
          <BackButton sx={{ ml: '40%' }} label={'戻る'} />
        </Box>
        <Divider />
      </Paper>
      <VehiclesMasterTable />
    </Container>
  );
};
