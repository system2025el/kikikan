'use client';

import { Box, Container, Paper, Typography } from '@mui/material';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { DaibumonsMasterDialogValues } from '../_lib/types';
import { DaibumonsMasterTable } from './daibumons-master-table';

export const DaibumonsMaster = ({ daibumons }: { daibumons: DaibumonsMasterDialogValues[] }) => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>大部門マスタ</Typography>
        </Box>
      </Paper>
      <DaibumonsMasterTable daibumons={daibumons} />
    </Container>
  );
};
