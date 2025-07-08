'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { DaibumonsMasterDialogValues } from '../_lib/types';
import { DaibumonsMasterTable } from './daibumons-master-table';

/**
 * 大部門マスタ画面
 * @param {daibumons} 大部門リスト
 * @returns {JSX.Element} 大部門マスタコンポーネント
 */
export const DaibumonsMaster = ({ daibumons }: { daibumons: DaibumonsMasterDialogValues[] }) => {
  /* useState ------------------ */
  const [theDaibumons, setTheDaibumons] = useState(daibumons);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>大部門マスタ</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <Stack>
            <Typography variant="body2">検索</Typography>
          </Stack>
          <form>
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'center'}>
                <Typography noWrap width={100}>
                  大部門名
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
      <DaibumonsMasterTable daibumons={daibumons} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
