'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Divider, Grid2, Paper, Stack, TextField, Typography } from '@mui/material';

import { BackButton } from '../../_ui/back-button';
import { LocationMasterTable } from './location-master-table';

export const LocationMaster = () => {
  return (
    <>
      <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
        <Paper variant="outlined">
          <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
            <Typography>公演場所マスタ検索</Typography>
            <BackButton sx={{ ml: '40%' }} label={'戻る'} />
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
                    地域
                  </Typography>
                  <TextField />
                  <Button>選択</Button>
                </Stack>
                <Box>
                  <Button type="submit">
                    <SearchIcon />
                    検索
                  </Button>
                </Box>
              </Stack>
              <Stack alignItems={'center'} mt={1}>
                <Typography noWrap width={100}>
                  キーワード
                </Typography>
                <TextField id="a" />
                <Typography noWrap variant="body2">
                  場所、住所、Tel、Faxから検索
                </Typography>
              </Stack>
            </form>
          </Box>
        </Paper>
        <LocationMasterTable />
      </Container>
    </>
  );
};
