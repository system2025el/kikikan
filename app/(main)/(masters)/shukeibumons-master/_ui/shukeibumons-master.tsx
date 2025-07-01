'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
import { JSX } from 'react';

import { BackButton } from '@/app/(main)/_ui/buttons';

import { shukeibumonsList, ShukeibumonsMasterDialogValues } from '../_lib/type';
import { ShukeibumonsMasterTable } from './shukeibumons-master-table';

/**
 * 集計部門マスタ
 * @param {shukeibumons} 集計部門リスト配列
 * @returns {JSX.Element} 集計部門マスタコンポーネント
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
        <Divider />
        <Box width={'100%'} p={2}>
          <Stack>
            <Typography variant="body2">検索</Typography>
          </Stack>
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
      <ShukeibumonsMasterTable shukeibumons={shukeibumons} />
    </Container>
  );
};
