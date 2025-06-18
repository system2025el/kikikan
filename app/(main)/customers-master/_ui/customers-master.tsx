'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import Form from 'next/form';

import { BackButton } from '../../_ui/back-button';
import { CustomersMasterTable } from './customers-table';

export const CustomersMaster = () => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>顧客マスタ検索</Typography>
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
              <Stack>
                <Typography noWrap>顧客キーワード</Typography>
                <Box>
                  <TextField id="a" />
                  <Typography noWrap variant="body2">
                    社名、かな、住所、TEL、FAX、メモから部分一致検索
                  </Typography>
                </Box>
              </Stack>
              <Box>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
          <Typography></Typography>
        </Box>
      </Paper>
      <CustomersMasterTable />
    </Container>
  );
};
