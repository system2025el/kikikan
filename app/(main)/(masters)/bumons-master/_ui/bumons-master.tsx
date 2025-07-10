'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';

import { BackButton } from '../../../_ui/buttons';
import { BumonsMasterDialogValues, BumonsMasterTableValues } from '../_lib/types';
import { BumonsMasterTable } from './bumons-master-table';
/**
 * 部門マスタ画面
 * @param {bumons} 部門リスト
 * @returns {JSX.Element} 部門マスタコンポーネント
 */

export const BumonsMaster = ({ bumons }: { bumons: BumonsMasterTableValues[] | undefined }) => {
  /* useState ------------------ */
  const [theBumons, setTheBumons] = useState(bumons);
  /* DBのローディング */
  const [isLoading, setIsLoading] = useState(true);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>部門マスタ検索</Typography>
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
                  部門名
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
            <Stack mt={1} spacing={1}>
              <Typography noWrap width={100}>
                大部門名
              </Typography>
              <Select sx={{ width: 250 }} />
              <Box width={50}></Box>
              <Typography noWrap width={100}>
                集計部門名
              </Typography>
              <Select sx={{ width: 250 }} />
            </Stack>
          </form>
        </Box>
      </Paper>
      <BumonsMasterTable bumons={theBumons} isLoading={isLoading} setIsLoading={setIsLoading} />
    </Container>
  );
};
