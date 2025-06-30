'use client';

import { Box, Container, Paper, Typography } from '@mui/material';
import { JSX } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { shukeibumonsList, ShukeibumonsMasterDialogValues } from '../_lib/type';
import { ShukeibumonsMasterTable } from './shukeibumons-master-table';

/**
 *
 * @param param0
 * @returns {}
 */
export const ShukeibumonsMaster = ({ shukeibumons }: { shukeibumons: ShukeibumonsMasterDialogValues[] }) => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>集計部門マスタ</Typography>
        </Box>
      </Paper>
      <ShukeibumonsMasterTable shukeibumons={shukeibumons} />
    </Container>
  );
};
