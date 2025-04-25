'use client';

import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { grey } from '@mui/material/colors';
import { useState } from 'react';

import Date from '@/app/(main)/_ui/date';
import Time from '@/app/(main)/_ui/time';

const VehicleOrderDetail = () => {
  const [selectcar, setSelectcar] = useState('ハイエース');
  const [selectStatus, setSelectStatus] = useState('入力中');
  const [selectSituation, setSelectSituation] = useState('出庫');
  const [selectPlace, setSelectPlace] = useState('立合');

  const selectCarChange = (event: SelectChangeEvent) => {
    setSelectcar(event.target.value);
  };
  const selectStatusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };
  const selectSituationChange = (event: SelectChangeEvent) => {
    setSelectSituation(event.target.value);
  };
  const selectPlaceChange = (event: SelectChangeEvent) => {
    setSelectPlace(event.target.value);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ bgcolor: grey[400] }}>
        <Typography margin={1}>受注明細（車両）</Typography>
        <Box>
          <Button variant="contained" sx={{ margin: 1 }}>
            編集
          </Button>
          <Button variant="contained" sx={{ margin: 1 }}>
            保存
          </Button>
        </Box>
        <Button variant="contained" sx={{ margin: 1 }} href="/new-order">
          戻る
        </Button>
      </Box>
      <Box display="flex" sx={{ bgcolor: grey[300] }}>
        <Stack sx={{ width: '60%' }}>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={3} whiteSpace="nowrap">
              受注番号
            </Typography>
            <TextField size="small" disabled></TextField>
            <Typography mx={2} whiteSpace="nowrap">
              受注ステータス
            </Typography>
            <TextField size="small" disabled>
              確定
            </TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={5} whiteSpace="nowrap">
              受注日
            </Typography>
            <TextField size="small" disabled></TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={5} whiteSpace="nowrap">
              入力者
            </Typography>
            <TextField size="small" disabled></TextField>
          </Box>
        </Stack>
        <Stack sx={{ width: '40%' }}>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={5} whiteSpace="nowrap">
              公演名
            </Typography>
            <TextField size="small" defaultValue="A/Zepp Tour"></TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={3} whiteSpace="nowrap">
              公演場所
            </Typography>
            <TextField size="small" defaultValue="Zepp Osaka"></TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={7} whiteSpace="nowrap">
              相手
            </Typography>
            <TextField size="small" defaultValue="(株)シアターブレーン"></TextField>
          </Box>
        </Stack>
      </Box>
      <Box display="flex" marginTop={2} sx={{ bgcolor: grey[300] }}>
        <Stack sx={{ width: '100%' }}>
          <Typography whiteSpace="nowrap">車両入力</Typography>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={2} whiteSpace="nowrap">
              車両サイズ
            </Typography>
            <FormControl size="small" sx={{ width: '10%' }}>
              <Select value={selectcar} onChange={selectCarChange}>
                <MenuItem value={'11t'}>11t</MenuItem>
                <MenuItem value={'2t'}>2t</MenuItem>
                <MenuItem value={'4t'}>4t</MenuItem>
                <MenuItem value={'ハイエース'}>ハイエース</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={2} whiteSpace="nowrap">
              ステータス
            </Typography>
            <FormControl size="small" sx={{ width: '10%' }}>
              <Select value={selectStatus} onChange={selectStatusChange}>
                <MenuItem value={'入力中'}>入力中</MenuItem>
                <MenuItem value={'準備可'}>準備可</MenuItem>
                <MenuItem value={'作業中'}>作業中</MenuItem>
                <MenuItem value={'OK'}>OK</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={14}>
            <Button variant="contained">スケジュール表</Button>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={14}>
            <FormControl size="small" sx={{ width: '10%' }}>
              <Select value={selectSituation} onChange={selectSituationChange}>
                <MenuItem value={'出庫'}>出庫</MenuItem>
                <MenuItem value={'返却'}>返却</MenuItem>
                <MenuItem value={'K→Y移動'}>K→Y移動</MenuItem>
                <MenuItem value={'Y→K移動'}>Y→K移動</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2} sx={{ width: '60%' }}>
            <Typography marginRight={8} whiteSpace="nowrap">
              日時
            </Typography>
            <Date />
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              時刻
            </Typography>
            <Time />
            <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
              作業場所
            </Typography>
            <FormControl size="small" sx={{ width: '25%' }}>
              <Select value={selectPlace} onChange={selectPlaceChange}>
                <MenuItem value={'立合'}>立合</MenuItem>
                <MenuItem value={'KICKS'}>KICKS</MenuItem>
                <MenuItem value={'YARD'}>YARD</MenuItem>
                <MenuItem value={'厚木'}>厚木</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default VehicleOrderDetail;
