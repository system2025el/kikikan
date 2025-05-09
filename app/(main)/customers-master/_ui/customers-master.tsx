'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Divider, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import Form from 'next/form';
import { useRouter } from 'next/navigation';

import { CustomersMasterTable } from './customers-table';

export const CustomersMaster = () => {
  return (
    <>
      <SearchArea />
      <CustomersMasterTable />
    </>
  );
};

const SearchArea = () => {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };
  return (
    <>
      <Box width={'100%'} bgcolor={grey[300]} py={2} alignItems={'center'} p={2} display={'flex'}>
        <Typography>顧客マスタ検索</Typography>
        <Button sx={{ ml: '40%' }} onClick={() => handleBack()}>
          戻る
        </Button>
      </Box>
      <Box width={'100%'} bgcolor={grey[200]} p={2}>
        <Stack justifyContent={'space-between'}>
          <Typography variant="body1">検索</Typography>
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
          <Stack justifyContent={'space-between'} width={'70%'} alignItems={'start'} pt={1}>
            <Stack display={'flex'}>
              <Typography id="a">顧客キーワード</Typography>
              <Box>
                <TextField id="a" />
                <Typography variant="body2">社名、かな、略称、住所、TEL、FAX、メモから部分一致検索</Typography>
              </Box>
            </Stack>
            <Box>
              <Button type="submit">
                検索
                <SearchIcon />
              </Button>
            </Box>
          </Stack>
        </Form>
        <Typography></Typography>
      </Box>
    </>
  );
};
