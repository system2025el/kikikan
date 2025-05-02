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

import DateX from '@/app/(main)/_ui/date';
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

        <Button sx={{ margin: 1 }} href="/new-order">
          戻る
        </Button>
      </Box>
      <Box display="flex" sx={{ bgcolor: grey[300] }}>
        <Box sx={{ width: '60%' }}>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={3} whiteSpace="nowrap">
              受注番号
            </Typography>
            <TextField disabled></TextField>
            <Typography mx={2} whiteSpace="nowrap">
              受注ステータス
            </Typography>
            <TextField disabled>確定</TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={5} whiteSpace="nowrap">
              受注日
            </Typography>
            <TextField disabled></TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={5} whiteSpace="nowrap">
              入力者
            </Typography>
            <TextField disabled></TextField>
          </Box>
        </Box>
        <Box sx={{ width: '40%' }}>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={5} whiteSpace="nowrap">
              公演名
            </Typography>
            <TextField defaultValue="A/Zepp Tour"></TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={3} whiteSpace="nowrap">
              公演場所
            </Typography>
            <TextField defaultValue="Zepp Osaka"></TextField>
          </Box>
          <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
            <Typography marginRight={7} whiteSpace="nowrap">
              相手
            </Typography>
            <TextField defaultValue="(株)シアターブレーン"></TextField>
          </Box>
        </Box>
      </Box>
      <Box display={'flex'} marginTop={2} px={1} sx={{ bgcolor: grey[400] }} alignItems={'center'}>
        <Typography whiteSpace="nowrap" textAlign={'center'}>
          車両入力
        </Typography>
        <Box ml={'35%'}>
          <Button sx={{ margin: 1 }}>編集</Button>
          <Button sx={{ margin: 1 }}>保存</Button>
        </Box>
      </Box>
      <Box display="flex" sx={{ bgcolor: grey[300] }}>
        <Box sx={{ width: '100%' }}>
          <Stack spacing={1} alignItems="center" margin={1} marginLeft={2}>
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
            <Button color="error">削除</Button>
          </Stack>
          <Stack spacing={1} alignItems="center" margin={1} marginLeft={2}>
            <Box width={79.5}></Box>
            <FormControl size="small" sx={{ width: '10%' }}>
              <Select value={selectStatus} onChange={selectStatusChange}>
                <MenuItem value={'入力中'}>入力中</MenuItem>
                <MenuItem value={'準備可'}>準備可</MenuItem>
                <MenuItem value={'作業中'}>作業中</MenuItem>
                <MenuItem value={'OK'}>OK</MenuItem>
              </Select>
            </FormControl>
            <Button color="error">削除</Button>
          </Stack>
          <Box display="flex" alignItems="center" margin={1} marginLeft={14}>
            <Button>＋車両追加</Button>
          </Box>
          <Stack spacing={1} alignItems="center" margin={1} marginLeft={2}>
            <Typography whiteSpace={'nowrap'}>区分</Typography>
            <Box width={42}></Box>
            <FormControl size="small" sx={{ width: '10%' }}>
              <Select value={selectSituation} onChange={selectSituationChange}>
                <MenuItem value={'出庫'}>出庫</MenuItem>
                <MenuItem value={'返却'}>返却</MenuItem>
                <MenuItem value={'K→Y移動'}>K→Y移動</MenuItem>
                <MenuItem value={'Y→K移動'}>Y→K移動</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack spacing={1} alignItems="center" margin={1} marginLeft={2} sx={{ width: '60%' }}>
            <Typography marginRight={8} whiteSpace="nowrap">
              日時
            </Typography>
            <Box width={42}></Box>
            <DateX />
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
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

export default VehicleOrderDetail;
