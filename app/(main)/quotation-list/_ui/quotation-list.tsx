'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { OrderTable } from '../../order-list/_ui/order-table';
import { QuotaionListTable } from '../quotation/_ui/quotation-list-table';

export const QuotationList = () => {
  return (
    <Container disableGutters sx={{ minWidth: '100%', p: 3 }} maxWidth={'xl'}>
      <Box width={'100%'} bgcolor={grey[300]} py={2} display={'flex'} p={2} justifyContent={'space-between'}>
        <Typography>見積検索</Typography>
        <Button>戻る</Button>
      </Box>
      <Box width={'100%'} bgcolor={grey[200]} justifySelf={'center'} p={2}>
        <Stack justifyContent={'space-between'}>
          <Typography variant="body2">検索</Typography>
          <Button>
            検索
            <SearchIcon />
          </Button>
        </Stack>
      </Box>
      <QuotaionListTable />
    </Container>
  );
};
