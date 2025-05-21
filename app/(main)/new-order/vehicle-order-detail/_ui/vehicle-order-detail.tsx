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
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import DateX from '@/app/(main)/_ui/date';
import Time from '@/app/(main)/_ui/time';

const VehicleOrderDetail = () => {
  const [selectStatus, setSelectStatus] = useState('入力中');
  const [selectSituation, setSelectSituation] = useState('出庫');
  const [selectPlace, setSelectPlace] = useState('立合');

  const selectStatusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };
  const selectSituationChange = (event: SelectChangeEvent) => {
    setSelectSituation(event.target.value);
  };
  const selectPlaceChange = (event: SelectChangeEvent) => {
    setSelectPlace(event.target.value);
  };
  /** 動的フォーム準備 */
  // フォームの型定義
  type FormValue = {
    profile: {
      vehicleName: string;
    }[];
  };
  // デフォルト値
  const defaultValue = { vehicleName: '' };

  // React hook formの設定
  const { control, handleSubmit } = useForm<FormValue>({
    mode: 'onTouched',
    defaultValues: {
      profile: [defaultValue],
    },
  });
  // useFieldArrayの設定と関数呼び出し
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'profile',
  });
  // フォーム送信処理
  const onSubmit = async (data: FormValue) => {
    console.log(data.profile);
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

      {/* ----------------下側------------------ */}
      <Box display={'flex'} marginTop={2} px={1} sx={{ bgcolor: grey[400] }} alignItems={'center'}>
        <Typography whiteSpace="nowrap" textAlign={'center'}>
          車両入力
        </Typography>
        <Box ml={'35%'}>
          <Button sx={{ margin: 1 }}>編集</Button>
          {/* フォーム送信ボタン */}
          <Button onClick={handleSubmit(onSubmit)}>保存</Button>
        </Box>
      </Box>
      <Box display="flex" sx={{ bgcolor: grey[300] }}>
        <Box sx={{ width: '100%' }}>
          <Stack pl={13} py={1}>
            {/* フォーム追加ボタン */}
            <Button onClick={() => append(defaultValue)}>+車両追加</Button>
          </Stack>
          <Stack spacing={1} margin={1} marginLeft={2}>
            <Typography marginRight={2} marginTop={10} whiteSpace="nowrap">
              車両サイズ
            </Typography>
            {/* --動的フォーム-- */}
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              {/* 動的に追加される入力フォーム */}
              {fields.map((field, index) => {
                return (
                  <Stack key={field.id} direction={'row'} spacing={1} my={1}>
                    <Controller
                      name={`profile.${index}.vehicleName`}
                      control={control}
                      render={({ field }) => (
                        <Select {...field} sx={{ minWidth: '20vw' }}>
                          <MenuItem value={'11t'}>11t</MenuItem>
                          <MenuItem value={'2t'}>2t</MenuItem>
                          <MenuItem value={'4t'}>4t</MenuItem>
                          <MenuItem value={'ハイエース'}>ハイエース</MenuItem>
                        </Select>
                      )}
                    />
                    <Button color="error" onClick={() => remove(index)}>
                      削除
                    </Button>
                  </Stack>
                );
              })}
            </Box>
            {/*  */}
          </Stack>
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
