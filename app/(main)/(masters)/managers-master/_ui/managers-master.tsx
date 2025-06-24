'use client';

import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';

import { BackButton } from '../../../_ui/buttons';
import { ManagerssMasterTable } from './managers-table';

export const ManagersMaster = () => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>担当者マスタ検索</Typography>
          <BackButton sx={{ ml: '40%' }} label={'戻る'} />
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <Stack>
            <Typography variant="body2">検索</Typography>
          </Stack>
          <form>
            <Grid2 container direction={'row'} spacing={3}>
              <Grid2>
                <Button>あ</Button>
              </Grid2>
              <Grid2>
                <Button>か</Button>
              </Grid2>
              <Grid2>
                <Button>さ</Button>
              </Grid2>
              <Grid2>
                <Button>た</Button>
              </Grid2>
              <Grid2>
                <Button>な</Button>
              </Grid2>
              <Grid2>
                <Button>は</Button>
              </Grid2>
              <Grid2>
                <Button>ま</Button>
              </Grid2>
              <Grid2>
                <Button>や</Button>
              </Grid2>
              <Grid2>
                <Button>ら</Button>
              </Grid2>
              <Grid2>
                <Button>わ</Button>
              </Grid2>
              <Grid2>
                <Button>英数</Button>
              </Grid2>
              <Grid2>
                <Button>全て</Button>
              </Grid2>
            </Grid2>
            <Divider sx={{ mt: 1 }} />
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack alignItems={'baseline'}>
                <Typography>担当者キーワード</Typography>
                <TextField id="a" helperText={'～から部分一致検索'} />
              </Stack>
              <Box>
                <Button /*type="submit"*/>
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Paper>
      <ManagerssMasterTable />
    </Container>
  );
};
