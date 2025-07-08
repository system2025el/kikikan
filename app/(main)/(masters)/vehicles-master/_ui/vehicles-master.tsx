'use client';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { JSX, useState } from 'react';

import { BackButton } from '../../../_ui/buttons';
import {} from '../_lib/datas';
import { VehsMasterDialogValues, VehsMasterTableValues } from '../_lib/types';
import { VehiclesMasterTable } from './vehicles-master-table';
/**
 * 車両マスタ画面
 * @param vehs DBからとってきた車両リスト
 * @returns {JSX.Element} 車両マスタ画面コンポーネント
 */
export const VehiclesMaster = ({ vehs }: { vehs: VehsMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theVehs, setTheVehs] = useState(vehs);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>車両マスタ</Typography>
        </Box>
      </Paper>
      <VehiclesMasterTable vehs={theVehs} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
