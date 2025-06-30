'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';

import { BackButton } from '../../../_ui/buttons';
import { CustomerMasterTableValues } from '../_lib/types';
import { CustomersMasterTable } from './customers-master-table';

export const CustomersMaster = (/*{ customers }: { customers: CustomerMasterTableValues[] | undefined }*/) => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Box justifySelf={'end'} mb={0.5}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography>顧客マスタ検索</Typography>
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

                <TextField />
                <Typography noWrap variant="body2">
                  社名、かな、住所、TEL、FAX、メモから部分一致検索
                </Typography>
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
      <CustomersMasterTable /*customers={customers}*/ />
    </Container>
  );
};
