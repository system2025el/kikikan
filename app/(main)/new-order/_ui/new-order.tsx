'use client';

import {
  Box,
  Button,
  FormControl,
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

import Date from '@/app/(main)/_ui/date';
import SelectTable from '@/app/(main)/_ui/table';
import { carHeaders, carRows, eqyipmentHeaders, eqyipmentRows } from '@/app/(main)/new-order/_lib/data';

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

  const [selectPartner, setSelectPartner] = useState('');

  const partnerChange = (event: SelectChangeEvent) => {
    setSelectPartner(event.target.value);
  };

  return (
    <Box>
      <Box bgcolor={grey[400]}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography margin={1}>受注ヘッダー</Typography>
          <Box>
            <Button variant="contained" sx={{ margin: 1 }}>
              編集
            </Button>
            <Button variant="contained" sx={{ margin: 1 }}>
              保存
            </Button>
          </Box>
          <Button variant="contained" sx={{ margin: 1 }}>
            複製
          </Button>
        </Box>
        <Box display="flex">
          <Stack sx={{ width: '55%' }} bgcolor={grey[300]}>
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
              <Date />
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
              <Typography marginRight={5}>公演開始</Typography>
              <Date />
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={5}>公演終了</Typography>
              <Date />
            </Box>
            <Button variant="contained" sx={{ width: '20%', margin: 2 }}>
              スケジュール表
            </Button>
          </Stack>
          <Stack sx={{ width: '45%' }} marginLeft={2} bgcolor={grey[300]}>
            <Box sx={styles.container}>
              <Typography marginRight={7}>公演名</Typography>
              <TextField size="small" sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={5}>公演場所</Typography>
              <TextField disabled size="small" sx={{ width: '8%', marginRight: 4 }}></TextField>
              <TextField disabled size="small" sx={{ width: '50%' }}></TextField>
              <Button variant="contained">選択</Button>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>相手</Typography>
              <TextField disabled size="small" sx={{ width: '8%', marginRight: 4 }}></TextField>
              <TextField disabled size="small" sx={{ width: '50%' }}></TextField>
              <Button variant="contained">選択</Button>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={9}>メモ</Typography>
              <TextField size="small" sx={{ width: '50%' }}></TextField>
            </Box>
            <Box sx={styles.container}>
              <Typography marginRight={7}>値引き</Typography>
              <TextField size="small" sx={{ width: '30%' }}></TextField>
            </Box>
          </Stack>
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" bgcolor={grey[400]} sx={{ marginTop: 2 }}>
        <Box display="flex" sx={{ width: '20%' }}>
          <Typography margin={1}>受注明細（機材・車両）</Typography>
        </Box>
        <Box display="flex" sx={{ width: '60%' }} alignItems="center" margin={1}>
          <Typography mx={1}>機材数</Typography>
          <TextField size="small" sx={{ width: '5%' }}></TextField>
          <Typography mx={1}>車両数</Typography>
          <TextField size="small" sx={{ width: '5%' }}></TextField>
          <Typography mx={1}>合計金額</Typography>
          <TextField size="small" sx={{ width: '20%' }}></TextField>
          <Button variant="contained" sx={{ mx: 3 }} href="/new-order/equipment-order-detail">
            ＋ 機材入力
          </Button>
          <Button variant="contained" href="/new-order/vehicle-order-detail">
            ＋ 車両入力
          </Button>
        </Box>
        <Box display="flex" sx={{ width: '20%' }}>
          <Button variant="contained" sx={{ bgcolor: 'red' }}>
            － 削除
          </Button>
        </Box>
      </Box>
      <SelectTable headers={eqyipmentHeaders} rows={eqyipmentRows} onSelectionChange={handleSelectionChange} />
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
