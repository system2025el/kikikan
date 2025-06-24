'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  Divider,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import DateX, { RSuiteDateRangePicker } from '@/app/(main)/_ui/date';
import { SelectTable } from '@/app/(main)/_ui/table';
import { equipmentHeaders, equipmentRows, vehicleHeaders, vehicleRows } from '@/app/(main)/new-order/_lib/data';

import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';

const NewOrder = () => {
  // 内税、外税
  const [selectTax, setSelectTax] = useState('外税');

  // 内税、外税変更
  const selectTaxChange = (event: SelectChangeEvent) => {
    setSelectTax(event.target.value);
  };

  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };

  const priceTotal = equipmentRows
    .filter((row) => typeof row.price === 'number')
    .reduce((sum, row) => sum + row.price, 0);

  const [buttonValue, setButtonValue] = useState<string | null>('');

  const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: string | null) => {
    setButtonValue(newAlignment);
  };

  const [selectStatus, setSelectStatus] = useState('処理中');

  const statusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };

  const [selectInputPerson, setselectInputPerson] = useState('');

  const inputPersonChange = (event: SelectChangeEvent) => {
    setselectInputPerson(event.target.value);
  };

  const [selectLocation, setSelectLocation] = useState('');

  const locationChange = (event: SelectChangeEvent) => {
    setSelectLocation(event.target.value);
  };

  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const handleOpenLocationDialog = () => {
    setLocationDialogOpen(true);
  };
  const handleCloseLocationDailog = () => {
    setLocationDialogOpen(false);
  };

  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const handleOpenCustomerDialog = () => {
    setCustomerDialogOpen(true);
  };
  const handleCloseCustomerDialog = () => {
    setCustomerDialogOpen(false);
  };

  const [selectPartner, setSelectPartner] = useState('');

  const partnerChange = (event: SelectChangeEvent) => {
    setSelectPartner(event.target.value);
  };

  const [dateRange, setDateRange] = useState<[Date, Date] | null>([new Date(), new Date()]);
  const handleDateChange = (range: [Date, Date] | null) => {
    setDateRange(range);
  };

  // const [rentalPeriod, setRentalPeriod] = useState<[Date, Date]>([new Date(), new Date()]);
  return (
    <Box>
      {/* --------------------------------受注ヘッダー------------------------------------- */}
      <Paper>
        <Grid2 container display="flex" alignItems="center" justifyContent="space-between">
          <Grid2>
            <Typography margin={1}>受注ヘッダー</Typography>
          </Grid2>
          <Grid2>
            <Button sx={{ margin: 1 }}>編集</Button>
            <Button sx={{ margin: 1 }}>保存</Button>
            <Button color="error" sx={{ margin: 1 }}>
              ー削除
            </Button>
            <Button sx={{ margin: 1 }}>コピー</Button>
          </Grid2>
        </Grid2>
        <Divider />
        <Grid2 container spacing={{ xs: 0, sm: 0, md: 2 }}>
          <Grid2 size={{ xs: 12, sm: 12, md: 7 }}>
            <Grid2 container margin={2} spacing={2}>
              <Grid2 display="flex" direction="row" alignItems="center">
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注番号
                </Typography>
                <TextField defaultValue={81694} disabled></TextField>
              </Grid2>
              <Grid2 display="flex" direction="row" alignItems="center">
                <Typography mr={2}>受注ステータス</Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select value={selectStatus} onChange={statusChange}>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={'確定'}>確定</MenuItem>
                    <MenuItem value={'処理中'}>処理中</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
            </Grid2>
            <Box sx={styles.container}>
              <Typography marginRight={7}>受注日</Typography>
              <DateX />
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>入力者</Typography>
              <FormControl disabled size="small" sx={{ width: '25%' }}>
                <Select value={selectInputPerson} onChange={inputPersonChange}>
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={'田中'}>田中</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={styles.container}>
              <Typography mr={2}>
                受注開始日/
                <br />
                受注終了日
              </Typography>
              <RSuiteDateRangePicker
                //styles={{ background: 'grey' }}
                value={dateRange}
                onChange={handleDateChange} /*val={rentalPeriod}*/
              />
            </Box>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 12, md: 5 }}>
            <Box sx={styles.container}>
              <Typography marginRight={7}>公演名</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={5}>公演場所</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
              <Button onClick={() => handleOpenLocationDialog()}>選択</Button>
              <Dialog open={locationDialogOpen} fullScreen>
                <LocationSelectDialog handleCloseLocationDialog={handleCloseLocationDailog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>相手</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
              <Button onClick={() => handleOpenCustomerDialog()}>選択</Button>
              <Dialog open={customerDialogOpen} fullScreen>
                <CustomerSelectionDialog handleCloseCustDialog={handleCloseCustomerDialog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={3}>相手担当者</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>メモ</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>値引き</Typography>
              <TextField sx={{ width: '30%' }}></TextField>
              <Typography>円</Typography>
              <Typography ml={4} mr={2}>
                税区分
              </Typography>
              <FormControl size="small" sx={{ width: '8%', minWidth: '80px' }}>
                <Select value={selectTax} onChange={selectTaxChange}>
                  <MenuItem value={'外税'}>外税</MenuItem>
                  <MenuItem value={'内税'}>内税</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Grid2>
        </Grid2>
      </Paper>
      {/* --------------------------------受注明細（機材）------------------------------------- */}
      <Accordion sx={{ marginTop: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" pt={2} sx={{ width: '100%' }} spacing={1}>
            <Grid2>
              <Typography>受注明細(機材)</Typography>
            </Grid2>
            <Grid2 container display="flex" alignItems="center" spacing={1}>
              <Typography>合計金額</Typography>
              <TextField
                sx={{
                  width: '40%',
                  minWidth: '90px',
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                    padding: 1,
                  },
                }}
                value={'¥' + priceTotal}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                disabled
              ></TextField>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button
                href="/new-order/equipment-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                ＋ 機材入力
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                編集
              </Button>
              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                － 削除
              </Button>
            </Grid2>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <SelectTable headers={equipmentHeaders} datas={equipmentRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
      {/* -------------------------車両----------------------------------- */}
      <Accordion sx={{ marginTop: 2 }} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" justifyContent="space-between" pt={2} sx={{ width: '100%' }} spacing={1}>
            <Grid2>
              <Typography>受注明細(車両)</Typography>
            </Grid2>
            <Grid2 container spacing={1}>
              <Button
                href="/new-order/vehicle-order-detail"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                ＋ 車両入力
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                編集
              </Button>
              <Button
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                － 削除
              </Button>
            </Grid2>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <SelectTable headers={vehicleHeaders} datas={vehicleRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default NewOrder;

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    margin: 1,
    marginLeft: 2,
  },
};
