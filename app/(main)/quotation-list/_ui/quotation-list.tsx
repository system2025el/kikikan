'use client';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';

import { BackButton } from '../../_ui/buttons';
import { TwoDatePickers } from '../../_ui/date';
import { QuotaionListTable } from './quotation-list-table';

export const QuotationList = () => {
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography noWrap>見積検索</Typography>
          <BackButton label="戻る" />
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <Stack justifyContent={'space-between'}>
            <Typography noWrap variant="body2">
              検索
            </Typography>
            <Button>
              <SearchIcon />
              検索
            </Button>
          </Stack>
          <Grid2 container spacing={1} mt={1}>
            <Grid2 size={{ sm: 12, md: 6 }} display={'flex'} alignItems={'center'}>
              <Typography noWrap>見積番号</Typography>
              <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
              　～　 <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
            </Grid2>
            <Grid2 size={{ sm: 12, md: 6 }} display={'flex'} alignItems={'center'}>
              <Typography noWrap>請求番号</Typography>
              <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
              　～　 <TextField type="number" sx={{ width: '35%', bgcolor: 'white' }} />
            </Grid2>
          </Grid2>
          <Stack pt={1}>
            <Typography noWrap>見積日</Typography>
            <TwoDatePickers sx={{ bgcolor: 'white' }} />
          </Stack>
          <Stack width={'30%'} pt={1}>
            <Typography noWrap>見積件名</Typography>
            <FormControl sx={{ minWidth: '70%', bgcolor: 'white' }}>
              <Select>
                <MenuItem></MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack width={'30%'} pt={1}>
            <Typography noWrap>見積相手</Typography>
            <FormControl sx={{ minWidth: '70%', bgcolor: 'white' }}>
              <Select>
                <MenuItem></MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack width={'40%'} pt={1}>
            <Typography noWrap>見積メモ</Typography>
            <TextField />
          </Stack>
        </Box>
      </Paper>
      <QuotaionListTable />
    </Container>
  );
};
