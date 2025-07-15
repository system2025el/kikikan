'use client';

import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  Container,
  Divider,
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
import dayjs from 'dayjs';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

import { BackButton } from '@/app/(main)/_ui/buttons';
import DateX from '@/app/(main)/_ui/date';
import Time from '@/app/(main)/_ui/time';

const VehicleOrderDetail = () => {
  const [selectStatus, setSelectStatus] = useState('入力中');

  const selectStatusChange = (event: SelectChangeEvent) => {
    setSelectStatus(event.target.value);
  };

  /** 動的フォーム準備 */
  // フォームの型定義
  type FormValue = {
    vehicles: {
      vehicleName: string;
    }[];
    situation: string;
    date: string;
    time: string;
    place: string;
  };
  // デフォルト値
  const defaultValue = { vehicleName: '' };

  // React hook formの設定
  const { control, handleSubmit } = useForm<FormValue>({
    mode: 'onTouched',
    defaultValues: {
      vehicles: [defaultValue],
      situation: '出庫',
      date: '',
      time: '',
      place: '立合',
    },
  });
  // useFieldArrayの設定と関数呼び出し
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'vehicles',
  });
  // フォーム送信処理
  const onSubmit = async (data: FormValue) => {
    console.log(data);
  };

  function setError(newError: string | null): void {
    throw new Error('Function not implemented.');
  }

  return (
    <Container disableGutters sx={{ minWidth: '100%' }} maxWidth={'xl'}>
      <Paper variant="outlined">
        <Box width={'100%'} display={'flex'} p={2} justifyContent={'space-between'} alignItems={'center'}>
          <Typography>受注明細（車両）</Typography>
          <BackButton label={'戻る'} />
        </Box>
        <Divider />
        <Box display="flex">
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
              <TextField defaultValue="A/Zepp Tour" disabled></TextField>
            </Box>
            <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
              <Typography marginRight={3} whiteSpace="nowrap">
                公演場所
              </Typography>
              <TextField defaultValue="Zepp Osaka" disabled></TextField>
            </Box>
            <Box display="flex" alignItems="center" margin={1} marginLeft={2}>
              <Typography marginRight={7} whiteSpace="nowrap">
                相手
              </Typography>
              <TextField defaultValue="(株)シアターブレーン" disabled></TextField>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* ----------------下側------------------ */}
      <Paper variant="outlined" sx={{ mt: 2 }}>
        <Box display={'flex'} px={1} alignItems={'center'}>
          <Typography whiteSpace="nowrap">車両入力</Typography>
          <Box ml={'35%'}>
            <Button sx={{ margin: 1 }}>編集</Button>
            {/* フォーム送信ボタン */}
            <Button onClick={handleSubmit(onSubmit)}>保存</Button>
          </Box>
        </Box>
        <Divider />

        <Box sx={{ width: '100%' }}>
          <Stack mt={1}>
            <Box width={100}></Box>
            {/* フォーム追加ボタン */}
            <Button onClick={() => append(defaultValue)}>
              <AddIcon fontSize="small" />
              車両追加
            </Button>
          </Stack>
          <Stack spacing={1} marginLeft={2}>
            <Box width={80}>
              <Typography whiteSpace="nowrap">車両サイズ</Typography>
            </Box>
            {/* --動的フォーム-- */}
            <Box component="form" noValidate onSubmit={handleSubmit(onSubmit)}>
              {/* 動的に追加される入力フォーム */}
              {fields.map((field, index) => {
                return (
                  <Stack key={field.id} direction={'row'} spacing={1} my={1}>
                    <Controller
                      name={`vehicles.${index}.vehicleName`}
                      control={control}
                      render={({ field }) => (
                        <Select {...field} sx={{ minWidth: '20vw', bgcolor: 'white' }}>
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
            <Box width={80}>
              <Typography whiteSpace={'nowrap'}>区分</Typography>
            </Box>
            <Controller
              name="situation"
              control={control}
              render={({ field }) => (
                <Select {...field} sx={{ minWidth: '10vw', bgcolor: 'white' }}>
                  <MenuItem value="出庫">出庫</MenuItem>
                  <MenuItem value="入庫">入庫</MenuItem>
                  <MenuItem value="移動Y-K">移動Y→K</MenuItem>
                  <MenuItem value="移動K-Y">移動K→Y</MenuItem>
                </Select>
              )}
            />
          </Stack>
          <Grid2
            container
            display={'flex'}
            spacing={1}
            alignItems="center"
            margin={1}
            marginLeft={2}
            sx={{ width: '80%' }}
          >
            <Grid2 size={{ sm: 12, md: 'grow' }} display={'flex'} alignItems={'center'}>
              <Box width={80}>
                <Typography marginRight={8} whiteSpace="nowrap">
                  日時
                </Typography>
              </Box>
              <Controller name="date" control={control} render={({ field }) => <DateX sx={{ bgcolor: 'white' }} />} />
            </Grid2>
            <Grid2 size={{ sm: 12, md: 'grow' }} display={'flex'} alignItems={'center'}>
              <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
                時刻
              </Typography>
              <Controller name="time" control={control} render={({ field }) => <Time sx={{ bgcolor: 'white' }} />} />
            </Grid2>
            <Grid2 size={{ sm: 12, md: 4 }} display={'flex'} alignItems={'center'}>
              <Typography marginLeft={5} marginRight={2} whiteSpace="nowrap">
                作業場所
              </Typography>
              <Controller
                name="place"
                control={control}
                render={({ field }) => (
                  <Select {...field} sx={{ minWidth: '10vw', bgcolor: 'white' }}>
                    <MenuItem value="立合">立合</MenuItem>
                    <MenuItem value="YARD">YARD</MenuItem>
                    <MenuItem value="KICD-K">KICD</MenuItem>
                    <MenuItem value="厚木-Y">厚木</MenuItem>
                  </Select>
                )}
              />
            </Grid2>
          </Grid2>
        </Box>
      </Paper>
    </Container>
  );
};

export default VehicleOrderDetail;
