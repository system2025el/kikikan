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
import { useEffect, useState } from 'react';

import { TwoDatePickers } from '../../_ui/date';
import { QuotTableValues } from '../_lib/types';
import { QuotationListTable } from './quotation-list-table';

export const QuotationList = ({ quots }: { quots: QuotTableValues[] }) => {
  /* useState -------------------------------------------- */
  /* 受注一覧 */
  const [quotList, setQuotList] = useState<QuotTableValues[]>(quots ?? []);
  /* テーブルのページ */
  const [page, setPage] = useState(1);
  /* ローディングかどうか */
  const [isLoading, setIsLoading] = useState(true);

  /* useEffect --------------------------------------- */
  useEffect(() => {
    setIsLoading(false);
  }, []);
  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2}>
          <Typography noWrap>見積検索</Typography>
        </Box>
        <Divider />
        <Box width={'100%'} p={2}>
          <form>
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
            <Stack width={'40%'} pt={1} sx={{ width: '100%' }} justifyContent={'space-between'}>
              <Typography noWrap>見積メモ</Typography>
              <TextField />
              <Box mt={1} alignSelf={'end'} justifySelf={'end'}>
                <Button type="submit">
                  <SearchIcon />
                  検索
                </Button>
              </Box>
            </Stack>
          </form>
        </Box>
      </Paper>
      <QuotationListTable
        quots={quotList}
        isLoading={isLoading}
        page={page}
        setIsLoading={setIsLoading}
        setPage={setPage}
      />
    </Container>
  );
};
