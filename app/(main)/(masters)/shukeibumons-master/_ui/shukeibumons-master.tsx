'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { JSX, useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { ShukeibumonsMasterDialogValues, ShukeibumonsMasterTableValues } from '../_lib/type';
import { ShukeibumonsMasterTable } from './shukeibumons-master-table';

/**
 * 集計部門マスタ
 * @param {shukeibumons} 集計部門リスト配列
 * @returns {JSX.Element} 集計部門マスタコンポーネント
 */
export const ShukeibumonsMaster = ({ shukeibumons }: { shukeibumons: ShukeibumonsMasterTableValues[] }) => {
  /* useState ------------------ */
  const [theShukeibumons, setTheShukeibumons] = useState(shukeibumons);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>集計部門マスタ検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'center'}>
                <Typography noWrap width={100}>
                  集計部門名
                </Typography>
                <TextField />
              </Stack>
              <Box>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Paper>
      <ShukeibumonsMasterTable shukeibumons={theShukeibumons} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
