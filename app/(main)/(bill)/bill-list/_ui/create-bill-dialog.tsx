import { Box, Button, Dialog, DialogActions, DialogTitle, Grid2, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CheckboxElement, SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { toJapanYMDString } from '@/app/(main)/_lib/date-conversion';
import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormDateX } from '@/app/(main)/_ui/date';
import { SelectTypes } from '@/app/(main)/_ui/form-box';
import { Loading } from '@/app/(main)/_ui/loading';

export const CreateBillDialog = ({
  kokyakuId,
  tantouNam,
  custs,
  open,
  setDialogOpen,
}: {
  kokyakuId: number;
  tantouNam: string | null;
  custs: SelectTypes[];
  open: boolean;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  /* useForm ------------------------------------------------------------ */
  const { control, handleSubmit, reset } = useForm<{
    kokyaku: number;
    tantouNam: string | null;
    date: Date | null;
    showDetailFlg: boolean;
  }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { kokyaku: kokyakuId ?? undefined, tantouNam: tantouNam, showDetailFlg: false },
  });

  /* methods ------------------------------------------------------------- */
  /* 自動生成押下時 */
  const onSubmit = async (data: {
    kokyaku: number;
    tantouNam: string | null;
    date: Date | null;
    showDetailFlg: boolean;
  }) => {
    window.open(
      `bill-list/create?kokyakuId=${data.kokyaku}&date=${toJapanYMDString(data.date ?? undefined, '-')}&flg=${data.showDetailFlg}&tantou=${data.tantouNam}`
    );
    setDialogOpen(false);
    reset();
  };

  useEffect(() => {
    reset({ kokyaku: kokyakuId ?? undefined, tantouNam: tantouNam, showDetailFlg: false });
  }, [kokyakuId, tantouNam, reset]);

  return (
    <Dialog
      open={open}
      onClose={() => {
        reset();
        setDialogOpen(false);
      }}
    >
      <DialogTitle display={'flex'} justifyContent={'end'}>
        <CloseMasterDialogButton
          handleCloseDialog={() => {
            reset();
            setDialogOpen(false);
          }}
        />
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid2 container direction={'column'} px={4} pt={4} spacing={0.5} minWidth={300} minHeight={200}>
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Typography mr={9}>相手</Typography>
            <SelectElement
              name="kokyaku"
              control={control}
              options={custs}
              sx={{ width: 400 }}
              rules={{ required: '必須項目です。', min: { value: 1, message: '選択してください' } }}
            />
          </Grid2>
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Typography mr={3}>相手担当者</Typography>
            <TextFieldElement name="tantouNam" control={control} />
          </Grid2>
          <Grid2 display={'flex'} alignItems={'baseline'}>
            <Typography mr={9}>年月日</Typography>
            <Typography mr={1}>～</Typography>
            <Controller
              control={control}
              name="date"
              rules={{ required: '選択してください' }}
              render={({ field, fieldState }) => (
                <FormDateX
                  value={field.value}
                  onChange={field.onChange}
                  sx={{
                    mr: 1,
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Grid2>
          <Grid2 display={'flex'} alignItems={'center'}>
            <Typography mr={5}>詳細表示</Typography>
            <CheckboxElement size="medium" name={'showDetailFlg'} control={control} />
          </Grid2>
        </Grid2>
        <DialogActions>
          <Button type="submit">自動生成</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
