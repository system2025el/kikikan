'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Dialog, DialogTitle, Grid2, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { CheckboxElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { useUserStore } from '@/app/_lib/stores/usestore';

import { toJapanYMDAndDayString } from '../../_lib/date-conversion';
import { CloseMasterDialogButton } from '../../_ui/buttons';
import { insertWeeklyData } from '../_lib/funcs';
import { WeeklySchema, WeeklyValues } from '../_lib/types';

/**
 * スケジュールの日直・メモ・祝日フラグを決めるダイアログ
 * @param param0
 * @returns {JSX.Element} ダイアログコンポーネント
 */
export const TantoDialog = ({
  open,
  datas,
  setOpen,
  refetch,
}: {
  open: boolean;
  datas: WeeklyValues;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  refetch: () => void;
}) => {
  /* ログインユーザー */
  const user = useUserStore((state) => state.user);

  /* useState ---------------------------------------------------------------- */
  /** 処理中 */
  const [isProcessing, setIsProcessing] = useState(false);

  /* useForm ----------------------------------------------------------------- */
  const {
    reset,
    handleSubmit,
    control,
    formState: { isDirty, errors },
  } = useForm<WeeklyValues>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: zodResolver(WeeklySchema),
    defaultValues: { dat: '', tantoNam: '', mem: '', holidayFlg: false },
  });

  /* methods ----------------------------------------------------------------- */
  const onSubmit = async (data: WeeklyValues) => {
    setIsProcessing(true);
    await insertWeeklyData(
      {
        ...data,
        dat: datas.dat,
      },
      user?.name ?? ''
    );
    setOpen(false);
    setIsProcessing(false);
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
      fullWidth
    >
      <DialogTitle display={'flex'} justifyContent={'space-between'}>
        {datas.dat}
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
          <Typography mr={5}>日直</Typography>
          <TextFieldElement name="tantoNam" control={control} fullWidth />
        </Grid2>
        <Grid2 display={'flex'} alignItems={'center'}>
          <Typography mr={5}>メモ</Typography>
          <TextFieldElement name="mem" control={control} multiline fullWidth />
        </Grid2>
        <Grid2 display={'flex'} alignItems={'center'}>
          <Typography mr={1}>祝日フラグ</Typography>
          <CheckboxElement name="holidayFlg" control={control} />
        </Grid2>
        <Box display={'flex'} justifyContent={'end'} width={'100%'}>
          <Button type="submit" loading={isProcessing} disabled={!isDirty}>
            保存
          </Button>
        </Box>
      </Grid2>
    </Dialog>
  );
};
