'use client';

import {
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
import SelectTable from '@/app/(main)/_ui/table';
import { carHeaders, carRows, eqyipmentHeaders, eqyipmentRows } from '@/app/(main)/new-order/_lib/data';

import { LocationSelectDialog } from './location-selection';

const NewOrder = () => {
  const handleSelectionChange = (selectedIds: (string | number)[]) => {
    console.log('選択されたID:', selectedIds);
  };

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

  const [selectPartner, setSelectPartner] = useState('');

  const partnerChange = (event: SelectChangeEvent) => {
    setSelectPartner(event.target.value);
  };

  // const [rentalPeriod, setRentalPeriod] = useState<[Date, Date]>([new Date(), new Date()]);
  return (
    <Box>
      <Box bgcolor={grey[400]}>
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
          <Box sx={{ width: '55%' }} bgcolor={grey[300]}>
            <Box sx={styles.container}>
              <Typography marginRight={5} whiteSpace="nowrap">
                受注番号
              </Typography>
              <TextField size="small" disabled></TextField>
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
              <Typography>
                レンタル開始/
                <br />
                レンタル終了
              </Typography>
              <RSuiteDateRangePicker /*val={rentalPeriod}*/ />
            </Box>
          </Box>
          <Box sx={{ width: '45%' }} marginLeft={2} bgcolor={grey[300]}>
            <Box sx={styles.container}>
              <Typography marginRight={7}>公演名</Typography>
              <TextField size="small" sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={5}>公演場所</Typography>
              <TextField disabled size="small" sx={{ width: '8%', marginRight: 4 }}></TextField>
              <TextField disabled size="small" sx={{ width: '50%' }}></TextField>
              <Button onClick={() => handleOpenLocationDialog()}>選択</Button>
              <Dialog open={locationDialogOpen} fullScreen>
                <LocationSelectDialog handleCloseLocationDialog={handleCloseLocationDailog} />
              </Dialog>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>相手</Typography>
              <TextField disabled size="small" sx={{ width: '8%', marginRight: 4 }}></TextField>
              <TextField disabled size="small" sx={{ width: '50%' }}></TextField>
              <Button>選択</Button>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>メモ</Typography>
              <TextField size="small" sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>値引き</Typography>
              <TextField size="small" sx={{ width: '30%' }}></TextField>
            </Box>
          </Box>
        </Box>
      </Box>
      {/* --------------------------------受注明細（機材）------------------------------------- */}
      <Box bgcolor={grey[400]} sx={{ marginTop: 2 }}>
        <Grid2 container alignItems="center" pt={2}>
          <Grid2 size={3}>
            <Typography margin={1}>受注明細（機材）</Typography>
          </Grid2>
          <Grid2 size={4} display="flex" alignItems="center" justifyItems={'stretch'}>
            <Box display="flex" sx={{ width: '100%' }} alignItems="center">
              <Typography mx={1}>機材数</Typography>
              <TextField size="small" sx={{ width: '10%' }}></TextField>
              <Typography mx={1}>車両数</Typography>
              <TextField size="small" sx={{ width: '10%' }}></TextField>
              <Typography mx={1}>合計金額</Typography>
              <TextField size="small" sx={{ width: '40%' }}></TextField>
            </Box>
          </Grid2>
          <Grid2 size={5} display={'flex'} justifyContent={'space-between'} pr={1}>
            <Box>
              <Button href="/new-order/vehicle-order-detail">＋ 車両入力</Button>
            </Box>
            <Box>
              <Button>編集</Button>
            </Box>
            <Box>
              <Button color="error">－ 削除</Button>
            </Box>
          </Grid2>
        </Grid2>
        <Button href="/new-order/schedule">受注機材・スケジュール</Button>
      </Box>
      <SelectTable headers={eqyipmentHeaders} rows={eqyipmentRows} onSelectionChange={handleSelectionChange} />
      {/* -------------------------車両----------------------------------- */}
      <Box bgcolor={grey[400]} justifyContent={'space-between'}>
        <Grid2 container alignItems="center" pt={2}>
          <Grid2 size={3}>
            <Typography margin={1}>（車両）</Typography>
          </Grid2>
          <Grid2 size={4} display="flex" alignItems="center" justifyItems={'stretch'}>
            <Box display="flex" sx={{ width: '100%' }}></Box>
          </Grid2>
          <Grid2 size={5} display={'flex'} justifyContent={'space-between'} pr={1}>
            <Box>
              <Button href="/new-order/equipment-order-detail">＋ 機材入力</Button>
            </Box>
            <Box>
              <Button>編集</Button>
            </Box>
            <Box>
              <Button color="error">－ 削除</Button>
            </Box>
          </Grid2>
        </Grid2>
        <Button href="/new-order/schedule">受注機材・スケジュール</Button>
      </Box>
      <SelectTable headers={carHeaders} rows={carRows} onSelectionChange={handleSelectionChange} />
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
