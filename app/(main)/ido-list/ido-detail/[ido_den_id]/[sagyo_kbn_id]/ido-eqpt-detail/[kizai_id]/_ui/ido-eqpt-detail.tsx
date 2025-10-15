'use client';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid2,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { BackButton } from '@/app/(main)/_ui/buttons';
import { Loading } from '@/app/(main)/_ui/loading';

import { IdoEqptDetailTable } from './ido-eqpt-detail-table';

export const IdoEqptDetail = () => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);

  // 選択タグ
  const [selected, setSelected] = useState<number[]>([]);

  /* useForm ------------------- */
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty, defaultValues },
  } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      resultAdjQty: 0,
    },
  });

  return (
    <Box>
      <Box display={'flex'} justifyContent={'end'} mb={1}>
        <BackButton label={'戻る'} />
      </Box>
      <Paper variant="outlined">
        <form /*onSubmit={handleSubmit(onSubmit)}*/>
          <Box display={'flex'} justifyContent={'space-between'} alignItems="center" p={2}>
            <Typography fontSize={'large'}>移動詳細(RFIDタグ)</Typography>
            <Button type="submit">保存</Button>
          </Box>
          <Divider />
          <Grid2 container spacing={5} p={2}>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材名</Typography>
              <TextField value={'X001'} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>棚番</Typography>
              <TextField value={'A3-1-1'} disabled />
            </Box>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>機材メモ</Typography>
              <TextField value={'XXXXXXXXXXXXXXXXXXXX'} disabled />
            </Box>
          </Grid2>
          <Grid2 container spacing={2} p={2}>
            <Typography>移動予定数</Typography>
            <Typography>{1}</Typography>
          </Grid2>
          <Grid2 container alignItems={'center'} spacing={5} p={1}>
            <Typography>全{'XX'}件</Typography>
            <Button color="error" /*onClick={handleDelete}*/>クリア</Button>
            <Box display={'flex'} alignItems={'center'}>
              <Typography mr={2}>補正数</Typography>
              <Controller
                name="resultAdjQty"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="number"
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        field.onChange(Number(e.target.value));
                      }
                    }}
                    sx={{
                      width: 150,
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                  />
                )}
              />
            </Box>
          </Grid2>
        </form>
        {isLoading ? (
          <Loading />
        ) : (
          <IdoEqptDetailTable /*datas={IdoEqptDetailList}*/ selected={selected} setSelected={setSelected} />
        )}
      </Paper>
    </Box>
  );
};
