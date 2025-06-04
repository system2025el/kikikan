'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Paper, Stack, TextField, Typography } from '@mui/material';
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
          <Stack justifyContent={'space-between'}>
            <Typography variant="body2">検索</Typography>
          </Stack>
          <Form action="">
            <Stack direction={'row'} justifyContent={'space-between'} spacing={1} py={1}>
              <Button>あ</Button>
              <Button>か</Button>
              <Button>さ</Button>
              <Button>た</Button>
              <Button>な</Button>
              <Button>は</Button>
              <Button>ま</Button>
              <Button>や</Button>
              <Button>ら</Button>
              <Button>わ</Button>
              <Button>英数</Button>
              <Button>全て</Button>
              <TextField fullWidth placeholder="検索"></TextField>
            </Stack>
            <Divider />
            <Stack justifyContent={'space-between'} alignItems={'start'} mt={1}>
              <Stack>
                <Typography noWrap id="a">
                  顧客キーワード
                </Typography>
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
          </Form>
          <Typography></Typography>
        </Box>
      </Paper>
      <CustomersMasterTable />
    </Container>
  );
};
