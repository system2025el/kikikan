'use client';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  FormControl,
  Grid2,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import Link from 'next/link';
import { useState } from 'react';

import DateX, { RSuiteDateRangePicker, TwoDatePickers } from '@/app/(main)/_ui/date';
import { SelectTable } from '@/app/(main)/_ui/table';
import { equipmentHeaders, equipmentRows, vehicleHeaders, vehicleRows } from '@/app/(main)/new-order/_lib/data';

import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';

const NewOrder = () => {
  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };

  const total = equipmentRows.reduce((sum, row) => sum + row.price, 0);

  const [buttonValue, setButtonValue] = useState<string | null>('');

  const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: string | null) => {
    setButtonValue(newAlignment);
  };

  const [selectStatus, setSelectStatus] = useState('');

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
      <Box bgcolor={grey[300]}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography margin={1}>受注ヘッダー</Typography>
          <Box width={'40%'} textAlign={'end'}>
            <Button sx={{ margin: 1 }}>編集</Button>
            <Button sx={{ margin: 1 }}>保存</Button>
          </Box>
          <Button color="error" sx={{ ml: '20%' }}>
            ー削除
          </Button>
          <Button sx={{ margin: 1 }}>コピー</Button>
        </Box>
        <Box display="flex">
          <Box sx={{ width: '55%' }} bgcolor={grey[200]}>
            <Box sx={styles.container}>
              <Typography marginRight={5} whiteSpace="nowrap">
                受注番号
              </Typography>
              <TextField disabled></TextField>
              <Typography mx={2}>受注ステータス</Typography>
              <FormControl size="small" sx={{ width: '20%' }}>
                <Select value={selectStatus} onChange={statusChange}>
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  <MenuItem value={'確定'}>確定</MenuItem>
                </Select>
              </FormControl>
            </Box>
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
              <RSuiteDateRangePicker value={dateRange} onChange={handleDateChange} /*val={rentalPeriod}*/ />
            </Box>
          </Box>
          <Box sx={{ width: '45%' }} marginLeft={2} bgcolor={grey[200]}>
            <Box sx={styles.container}>
              <Typography marginRight={7}>公演名</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={5}>公演場所</Typography>
              <TextField disabled sx={{ width: '50%' }}></TextField>
              <Button onClick={() => handleOpenLocationDialog()}>選択</Button>
              <Dialog open={locationDialogOpen} fullScreen>
                <LocationSelectDialog handleCloseLocationDialog={handleCloseLocationDailog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>相手</Typography>
              <TextField disabled sx={{ width: '50%' }}></TextField>
              <Button onClick={() => handleOpenCustomerDialog()}>選択</Button>
              <Dialog open={customerDialogOpen} fullScreen>
                <CustomerSelectionDialog handleCloseCustDialog={handleCloseCustomerDialog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={3}>相手担当者</Typography>
              <TextField disabled sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>メモ</Typography>
              <TextField sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>値引き</Typography>
              <TextField sx={{ width: '30%' }}></TextField>
            </Box>
          </Box>
        </Box>
      </Box>
      {/* --------------------------------受注明細（機材）------------------------------------- */}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandLessIcon />} component="div">
          <Grid2 container alignItems="center" pt={2} sx={{ width: '100%' }}>
            <Grid2 size={3}>
              <Typography margin={1}>受注明細（機材）</Typography>
              <Button
                href="/new-order/schedule"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                受注機材・スケジュール
              </Button>
            </Grid2>
            <Grid2 size={4} display="flex" alignItems="center" justifyItems={'stretch'}>
              <Box display="flex" sx={{ width: '100%' }} alignItems="center">
                <Typography mx={1}>機材数</Typography>
                <TextField
                  sx={{ width: '10%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
                <Typography mx={1}>合計金額</Typography>
                <TextField
                  sx={{ width: '40%' }}
                  defaultValue={'¥' + total}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
              </Box>
            </Grid2>
            <Grid2 size={5} display={'flex'} justifyContent={'space-between'} px={2}>
              <Box>
                <Button
                  href="/new-order/equipment-order-detail"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  ＋ 機材入力
                </Button>
              </Box>
              <Box>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  編集
                </Button>
              </Box>
              <Box>
                <Button
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  － 削除
                </Button>
              </Box>
            </Grid2>
          </Grid2>
        </AccordionSummary>
        <AccordionDetails sx={{ padding: 0 }}>
          <SelectTable headers={equipmentHeaders} datas={equipmentRows} onSelectionChange={handleSelectionChange} />
        </AccordionDetails>
      </Accordion>
      {/* -------------------------車両----------------------------------- */}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandLessIcon />} component="div">
          <Grid2 container alignItems="center" pt={2} sx={{ width: '100%' }}>
            <Grid2 size={3}>
              <Typography margin={1}>（車両）</Typography>
              <Button
                href="/new-order/schedule"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                受注機材・スケジュール
              </Button>
            </Grid2>
            <Grid2 size={2} alignItems="center" justifyItems={'stretch'}>
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                <Typography mx={1}>出庫車両数</Typography>
                <TextField
                  sx={{ width: '20%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
              </Box>
            </Grid2>
            <Grid2 size={2} alignItems="center" justifyItems={'stretch'}>
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                <Typography mx={1}>入庫車両数</Typography>
                <TextField
                  sx={{ width: '20%' }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
              </Box>
            </Grid2>
            <Grid2 size={5} display={'flex'} justifyContent={'space-between'} px={2}>
              <Box>
                <Button
                  href="/new-order/vehicle-order-detail"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  ＋ 車両入力
                </Button>
              </Box>
              <Box>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  編集
                </Button>
              </Box>
              <Box>
                <Button
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  － 削除
                </Button>
              </Box>
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
