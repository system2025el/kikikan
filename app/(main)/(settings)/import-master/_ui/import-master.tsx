'use client';

import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardHeader,
  Container,
  Divider,
  Grid2,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import { BackButton } from '@/app/(main)/_ui/buttons';

export const ImportMaster = () => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Stack direction={'column'} spacing={5} sx={{ minWidth: '100%' }}>
        <Paper variant="outlined" sx={{ minWidth: '100%' }}>
          <Box width={'100%'} display={'flex'} p={2}>
            <Typography>機材マスタインポート</Typography>
          </Box>
          <Divider sx={{ mx: 1 }} />
          <Grid2 container width={'100%'} display={'flex'} p={2} alignItems={'center'}>
            <Grid2 size={2}></Grid2>
            <Grid2 size={2} justifyItems={'center'}>
              <Box>
                <Button>ファイル選択</Button>
              </Box>
            </Grid2>
            <Grid2 size={4} justifyItems={'center'}>
              <Typography>exsample.xlsx</Typography>
            </Grid2>
            <Grid2 size={2} justifyItems={'center'}>
              <Box>
                <Button size="medium">登録</Button>
              </Box>
            </Grid2>
            <Grid2 size={2}></Grid2>
          </Grid2>
        </Paper>
        <Paper variant="outlined" sx={{ minWidth: '100%' }}>
          <Box width={'100%'} display={'flex'} p={2}>
            <Typography>RFIDマスタインポート</Typography>
          </Box>
          <Divider sx={{ mx: 1 }} />
          <Grid2 container width={'100%'} display={'flex'} p={2} alignItems={'center'}>
            <Grid2 size={2}></Grid2>
            <Grid2 size={2} justifyItems={'center'}>
              <Box>
                <Button>ファイル選択</Button>
              </Box>
            </Grid2>
            <Grid2 size={4} justifyItems={'center'}>
              <Typography></Typography>
            </Grid2>
            <Grid2 size={2} justifyItems={'center'}>
              <Box>
                <Button size="medium">登録</Button>
              </Box>
            </Grid2>
            <Grid2 size={2}></Grid2>
          </Grid2>
        </Paper>
      </Stack>
    </Container>
  );
};
