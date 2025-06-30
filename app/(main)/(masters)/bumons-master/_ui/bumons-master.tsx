'use client';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';

import { BackButton } from '../../../_ui/buttons';
import { BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterTable } from './bumons-master-table';

export const BumonsMaster = ({ bumons }: { bumons: BumonsMasterTableValues[] | undefined }) => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>部門マスタ</Typography>
          <BackButton sx={{ ml: '40%' }} label={'戻る'} />
        </Box>
      </Paper>
      <BumonsMasterTable bumons={bumons} />
    </Container>
  );
};
