'use client';

import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  Grid2,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import { customers } from '@/app/_lib/mock-data';

import { BackButton } from '../../_ui/back-button';
import { TwoDatePickers } from '../../_ui/date';
import { OrderTable } from './order-table';

/** 受注一覧画面 */
export const OrderList = () => {
  const [criteria, setCriteria] = useState('');
  const handleSelect = (event: SelectChangeEvent) => {
    setCriteria(event.target.value);
  };
  const [val, setVal] = useState('yesterday');
  const handleChange = (value: string) => {
    setVal(value);
  };
  const valIsSelect = val === 'select';

  const [orderStatus, setOrderStatus] = useState('');
  const handleOrder = (event: SelectChangeEvent) => {
    setOrderStatus(event.target.value);
  };

  const [customer, setCustomer] = useState('');
  const handleCustomerSelect = (event: SelectChangeEvent) => {
    setCustomer(event.target.value);
  };

  const [custSort, setCustSort] = useState('顧客名簿');
  const handleCustSortSelect = (event: SelectChangeEvent) => {
    setCustSort(event.target.value);
  };

  return (
    <Container disableGutters sx={{ minWidth: '100%', pt: 3 }} maxWidth={'xl'}>
      <Box width={'100%'} bgcolor={grey[300]} display={'flex'} p={2} justifyContent={'space-between'}>
        <Typography>受注検索</Typography>
        <BackButton sx={{}} label="戻る" />
      </Box>
      <Box width={'100%'} bgcolor={grey[200]} justifySelf={'center'} p={2}>
        <Stack justifyContent={'space-between'}>
          <Typography variant="body2">検索</Typography>
          <Button>
            検索
            <SearchIcon />
          </Button>
        </Stack>
        <Grid2 container mt={1} columns={7}>
          <Grid2 size={{ xs: 7, sm: 7, md: 'grow' }}>
            <FormControl sx={{ minWidth: '80%' }}>
              <InputLabel id="search">検索条件</InputLabel>
              <Select
                labelId="search"
                label="検索条件"
                onChange={handleSelect}
                value={criteria}
                sx={{ bgcolor: 'white' }}
              >
                <MenuItem value="出庫日が">出庫日が</MenuItem>
                <MenuItem value="入庫日が">入庫日が</MenuItem>
              </Select>
            </FormControl>
          </Grid2>
          <Grid2 container size={{ xs: 7, sm: 7, md: 6 }}>
            <Grid2 size={{ xs: 12, sm: 12, md: 4 }}>
              <FormControl>
                <Box display={'flex'} alignItems={'center'}>
                  <RadioGroup defaultValue={'past'} row>
                    {radioData.map((data) => (
                      <FormControlLabel
                        key={data.value}
                        value={data.value}
                        control={<Radio />}
                        onChange={() => handleChange(data.value)}
                        label={data.label}
                      />
                    ))}
                  </RadioGroup>
                </Box>
              </FormControl>
            </Grid2>
            {valIsSelect ? (
              <Grid2 size={{ xs: 12, sm: 12, md: 3, lg: 3, xl: 3 }}>
                <TwoDatePickers />
              </Grid2>
            ) : (
              ''
            )}
          </Grid2>
        </Grid2>
        <Grid2 container spacing={1} pt={1}>
          <Grid2 size={{ xs: 12, sm: 12, md: 5 }} spacing={1}>
            <Typography>顧客</Typography>
            <FormControl sx={{ ml: 1 }}>
              <Select value={customer} sx={{ minWidth: 300, bgcolor: 'white' }} onChange={handleCustomerSelect}>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.name}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>
          <Grid2>
            <Typography sx={{ pl: { xs: 0, sm: 0, md: 2 } }}>ソート</Typography>
            <Select value={custSort} onChange={handleCustSortSelect} sx={{ bgcolor: 'white', ml: 1 }}>
              <MenuItem value="顧客名簿">顧客名簿</MenuItem>
            </Select>
          </Grid2>
        </Grid2>
        <Stack pt={1}>
          <Typography>受注ステータス</Typography>
          <FormControl>
            <Select value={orderStatus} onChange={handleOrder} sx={{ minWidth: 80, bgcolor: 'white' }}>
              <MenuItem value="確定">確定</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Grid2 container mt={1} spacing={1}>
          <Grid2 size={{ xs: 12, sm: 12, md: 4.5 }}>
            <Typography>公演名</Typography>
            <TextField sx={{ bgcolor: 'white', ml: 1 }} />
          </Grid2>
          <Grid2 container size={{ xs: 12, sm: 12, md: 'grow' }}>
            <Grid2 size={{ xs: 12, sm: 12, md: 3.5 }}>
              <Typography>受注開始日～終了日</Typography>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 5 }}>
              <TwoDatePickers sx={{ bgcolor: 'white' }} />
            </Grid2>
          </Grid2>
        </Grid2>
      </Box>
      <OrderTable />
    </Container>
  );
};

/** ラヂオボタン用データ */
const radioData = [
  { value: 'lastMonth', label: '先月全て' },
  { value: 'thisMonth', label: '今月全て' },
  { value: 'yesterday', label: '昨日' },
  { value: 'today', label: '今日' },
  { value: 'tomorrow', label: '明日' },
  { value: 'tomorrowOnward', label: '明日以降' },
  { value: 'select', label: '指定期間' },
];
