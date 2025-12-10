'use client';

import { Box, Button, Dialog, DialogTitle, Grid2, Stack, Typography } from '@mui/material';
import { CheckboxElement, TextFieldElement, useForm } from 'react-hook-form-mui';

import { toJapanYMDAndDayString } from '../../_lib/date-conversion';
import { CloseMasterDialogButton } from '../../_ui/buttons';
import { insertWeeklyData } from '../_lib/funcs';

export const TantoDialog = ({
  open,
  date,
  setOpen,
}: {
  open: boolean;
  date: string;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useForm ----------------------------------------------------------------- */
  const { handleSubmit, control, reset } = useForm({
    defaultValues: { tantoNam: null, mem: null, holidayFlg: false },
  });

  /* methods ----------------------------------------------------------------- */
  const onSubmit = async (data: { tantoNam: string | null; mem: string | null; holidayFlg: boolean }) => {
    await insertWeeklyData({ ...data, dat: date });
    setOpen(false);
  };

  /* useEffect --------------------------------------------------------------- */

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle display={'flex'} justifyContent={'space-between'}>
        {toJapanYMDAndDayString(date)}
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
