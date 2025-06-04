'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
  Select,
  SelectChangeEvent,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import DateX, { RSuiteDateRangePicker } from '@/app/(main)/_ui/date';
import { SelectTable } from '@/app/(main)/_ui/table';
import { equipmentHeaders, equipmentRows, vehicleHeaders, vehicleRows } from '@/app/(main)/new-order/_lib/data';

import { CustomerSelectionDialog } from './customer-selection';
import { LocationSelectDialog } from './location-selection';

const NewOrder = () => {
  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };

  const equipmentTotal = equipmentRows.reduce((sum, row) => sum + row.quantity, 0);
  const priceTotal = equipmentRows.reduce((sum, row) => sum + row.price, 0);
  const issueTotal = vehicleRows.filter((row) => row.classification === '出庫').length;
  const returnTotal = vehicleRows.filter((row) => row.classification === '入庫').length;

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
      {/* --------------------------------受注ヘッダー------------------------------------- */}
      <Box bgcolor={grey[300]}>
        <Grid2 container display="flex" alignItems="center">
          <Grid2 size={4}>
            <Typography margin={1}>受注ヘッダー</Typography>
          </Grid2>
          <Grid2 size={4}>
            <Button sx={{ margin: 1 }}>編集</Button>
            <Button sx={{ margin: 1 }}>保存</Button>
          </Grid2>
          <Grid2 size={4}>
            <Button color="error" sx={{ margin: 1 }}>
              ー削除
            </Button>
            <Button sx={{ margin: 1 }}>コピー</Button>
          </Grid2>
        </Grid2>
        <Grid2 container spacing={{ xs: 0, sm: 0, md: 2 }}>
          <Grid2 size={{ xs: 12, sm: 12, md: 7 }} bgcolor={grey[200]}>
            <Grid2 container margin={2} spacing={2}>
              <Grid2 display="flex" direction="row" alignItems="center" size={{ sm: 12, md: 5 }}>
                <Typography marginRight={5} whiteSpace="nowrap">
                  受注番号
                </Typography>
                <TextField defaultValue={81694} disabled sx={{ bgcolor: grey[300] }}></TextField>
              </Grid2>
              <Grid2 display="flex" direction="row" alignItems="center" size={{ sm: 12, md: 7 }}>
                <Typography mr={2}>受注ステータス</Typography>
                <FormControl size="small" sx={{ width: 120 }}>
                  <Select value={selectStatus} onChange={statusChange} disabled sx={{ bgcolor: grey[300] }}>
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    <MenuItem value={'確定'}>確定</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
            </Grid2>
            <Box sx={styles.container}>
              <Typography marginRight={7}>受注日</Typography>
              <DateX disabled />
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>入力者</Typography>
              <FormControl disabled size="small" sx={{ width: '25%', bgcolor: grey[300] }}>
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
                disabled
              />
            </Box>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 12, md: 5 }} bgcolor={grey[200]}>
            <Box sx={styles.container}>
              <Typography marginRight={7}>公演名</Typography>
              <TextField disabled sx={{ width: '50%', bgcolor: grey[300] }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={5}>公演場所</Typography>
              <TextField disabled sx={{ width: '50%', bgcolor: grey[300] }}></TextField>
              <Button onClick={() => handleOpenLocationDialog()}>選択</Button>
              <Dialog open={locationDialogOpen} fullScreen>
                <LocationSelectDialog handleCloseLocationDialog={handleCloseLocationDailog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>相手</Typography>
              <TextField disabled sx={{ width: '50%', bgcolor: grey[300] }}></TextField>
              <Button onClick={() => handleOpenCustomerDialog()}>選択</Button>
              <Dialog open={customerDialogOpen} fullScreen>
                <CustomerSelectionDialog handleCloseCustDialog={handleCloseCustomerDialog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={3}>相手担当者</Typography>
              <TextField disabled sx={{ width: '50%', bgcolor: grey[300] }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>メモ</Typography>
              <TextField disabled sx={{ width: '50%', bgcolor: grey[300] }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>値引き</Typography>
              <TextField disabled sx={{ width: '30%', bgcolor: grey[300] }}></TextField>
            </Box>
          </Grid2>
        </Grid2>
      </Box>
      {/* --------------------------------受注明細（機材）------------------------------------- */}
      <Accordion sx={{ marginTop: 2, bgcolor: grey[300] }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" pt={2} sx={{ width: '100%' }} spacing={1}>
            <Grid2 size={{ sm: 12, md: 3 }}>
              <Typography margin={1}>受注明細(機材)</Typography>
              <Button
                href="/new-order/schedule"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                受注機材・スケジュール
              </Button>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 4 }} display="flex" alignItems="center" justifyItems={'stretch'}>
              <Box display="flex" sx={{ width: '100%' }} alignItems="center">
                <Typography mr={1}>機材数</Typography>
                <TextField
                  sx={{
                    mr: 2,
                    width: '10%',
                    minWidth: '45px',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 1,
                    },
                  }}
                  value={equipmentTotal}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
                <Typography mr={1}>合計金額</Typography>
                <TextField
                  sx={{
                    width: '25%',
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
              </Box>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 5 }} display="flex" justifyContent={'space-between'} px={{ md: 2 }}>
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
        <AccordionSummary expandIcon={<ExpandMoreIcon />} component="div">
          <Grid2 container alignItems="center" pt={2} sx={{ width: '100%' }} spacing={1}>
            <Grid2 size={{ xs: 12, sm: 12, md: 3 }}>
              <Typography margin={1}>(車両)</Typography>
              <Button
                href="/new-order/schedule"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                受注機材・スケジュール
              </Button>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 4 }} alignItems="center">
              <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
                <Typography mr={1}>出庫車両数</Typography>
                <TextField
                  sx={{
                    mr: 2,
                    width: '10%',
                    minWidth: '45px',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 1,
                    },
                  }}
                  value={issueTotal}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
                <Typography mr={1}>入庫車両数</Typography>
                <TextField
                  sx={{
                    width: '10%',
                    minWidth: '45px',
                    '& .MuiInputBase-input': {
                      textAlign: 'right',
                      padding: 1,
                    },
                  }}
                  value={returnTotal}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  disabled
                ></TextField>
              </Box>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 12, md: 5 }} display="flex" justifyContent={'space-between'} px={{ md: 2 }}>
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
