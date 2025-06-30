'use client';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';

import { BackButton } from '../../../_ui/buttons';
import { BasesMasterTableValues } from '../_lib/types';
import { BasesMasterTable } from './bases-master-table';

export const BasesMaster = ({ bases }: { bases: BasesMasterTableValues[] | undefined }) => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>拠点マスタ</Typography>
        </Box>
      </Paper>
      <BasesMasterTable bases={bases} />
    </Container>
  );
};
