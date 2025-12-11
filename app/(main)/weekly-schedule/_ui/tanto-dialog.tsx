'use client';

import { Box, Button, Dialog, DialogTitle, Grid2, Stack, Typography } from '@mui/material';
import { useEffect } from 'react';
import { CheckboxElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { toJapanYMDAndDayString } from '../../_lib/date-conversion';
import { CloseMasterDialogButton } from '../../_ui/buttons';
import { insertWeeklyData } from '../_lib/funcs';

export const TantoDialog = ({
  open,
  datas,
  setOpen,
  refetch,
}: {
  open: boolean;
  datas: { dat: string; tantoNam: string | null; mem: string | null; holidayFlg: boolean };
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refetch: () => void;
}) => {
  /* ログインユーザー */
  const user = useUserStore((state) => state.user);

  /* useForm ----------------------------------------------------------------- */
  const { reset, handleSubmit, control } = useForm<{
    dat: string;
    tantoNam: string | null;
    mem: string | null;
    holidayFlg: boolean;
  }>({
    defaultValues: { dat: '', tantoNam: null, mem: null, holidayFlg: false },
  });

  /* methods ----------------------------------------------------------------- */
  const onSubmit = async (data: { dat: string; tantoNam: string | null; mem: string | null; holidayFlg: boolean }) => {
    await insertWeeklyData(
      {
        ...data,
        dat: datas.dat,
      },
      user?.name ?? ''
    );
    setOpen(false);
    refetch();
  };

  /* useEffect --------------------------------------------------------------- */
  useEffect(() => {
    reset(datas);
    console.log(datas);
  }, [datas, reset]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        setOpen(false);
      }}
    >
      <DialogTitle display={'flex'} justifyContent={'space-between'}>
        {toJapanYMDAndDayString(datas.dat)}
        <CloseMasterDialogButton handleCloseDialog={() => setOpen(false)} />
      </DialogTitle>
      <Grid2
        container
        direction={'column'}
        spacing={1}
        component={'form'}
        onSubmit={handleSubmit(onSubmit)}
        mb={2}
        mx={4}
      >
        <Grid2 display={'flex'} alignItems={'center'}>
          <Typography mr={5}>担当者</Typography>
          <TextFieldElement name="tantoNam" control={control} />
        </Grid2>
        <Grid2 display={'flex'} alignItems={'center'}>
          <Typography mr={7}>メモ</Typography>
          <TextFieldElement name="mem" control={control} />
        </Grid2>
        <Grid2 display={'flex'} alignItems={'center'}>
          <Typography mr={1}>祝日フラグ</Typography>
          <CheckboxElement name="holidayFlg" control={control} />
        </Grid2>
        <Box display={'flex'} justifyContent={'end'} width={'100%'}>
          <Button type="submit">保存</Button>
        </Box>
      </Grid2>
    </Dialog>
  );
};
