'use client';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, Container, FormControl, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';

import { TwoDatePickers } from '../../_ui/date';
import { QuotaionListTable } from './quotation-list-table';

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
        <Stack>
          <Stack>
            <Typography>見積番号</Typography>
            <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
            　～　 <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
          </Stack>
          <Stack pt={1}>
            <Typography>請求番号</Typography>
            <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
            　～　 <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
          </Stack>
        </Stack>
        <Stack pt={1}>
          <Typography>見積日</Typography>
          <TwoDatePickers />
        </Stack>
        <Stack width={'30%'} pt={1}>
          <Typography>見積件名</Typography>
          <FormControl sx={{ minWidth: '70%' }}>
            <Select>
              <MenuItem></MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack width={'30%'} pt={1}>
          <Typography>見積相手</Typography>
          <FormControl sx={{ minWidth: '70%' }}>
            <Select>
              <MenuItem></MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Stack width={'40%'} pt={1}>
          <Typography>見積メモ</Typography>
          <TextField />
        </Stack>
      </Box>
      <QuotaionListTable />
    </Container>
  );
};
