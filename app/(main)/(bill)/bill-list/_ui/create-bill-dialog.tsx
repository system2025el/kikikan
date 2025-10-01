import { Button, Dialog, DialogActions, DialogTitle, Grid2, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { CheckboxElement, TextFieldElement } from 'react-hook-form-mui';

import { toJapanMonthString } from '@/app/(main)/_lib/date-conversion';
import { CloseMasterDialogButton } from '@/app/(main)/_ui/buttons';
import { FormDateX, FormMonthX } from '@/app/(main)/_ui/date';
import { Loading } from '@/app/(main)/_ui/loading';
import { getChosenCustomerName } from '@/app/(main)/(masters)/customers-master/_lib/funcs';

export const CreateBillDialog = ({
  kokyakuId,
  setDialogOpen,
}: {
  kokyakuId: number;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  /* useState ------------------------------------------------------------ */
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* useForm ------------------------------------------------------------ */
  const { control, handleSubmit, reset } = useForm<{
    kokyaku: { id: number; name: string | null };
    month: Date | null;
    showDetailFlg: boolean;
  }>({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { showDetailFlg: false },
  });

  /* methods ------------------------------------------------------------- */
  const onSubmit = async (data: {
    kokyaku: { id: number; name: string | null };
    month: Date | null;
    showDetailFlg: boolean;
  }) => {
    console.log(data);
    router.push(
      `bill-list/create?kokyakuId=${data.kokyaku.id}&date=${toJapanMonthString(data.month ?? undefined)}&flg=${data.showDetailFlg}`
    );
  };

  /* useEffect ----------------------------------------------------------- */
  useEffect(() => {
    const getCustInfo = async () => {
      const kokyakuNam = await getChosenCustomerName(kokyakuId);
      reset({ kokyaku: { id: kokyakuId, name: kokyakuNam ?? null }, month: new Date() });
    };
    getCustInfo();
    setIsLoading(false);
  }, [kokyakuId]);
  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'end'}>
        <CloseMasterDialogButton
          handleCloseDialog={() => {
            reset();
            setDialogOpen(false);
            router.back();
          }}
        />
      </DialogTitle>
      {isLoading ? (
        <Loading />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid2 container direction={'column'} px={4} pt={4} spacing={2}>
            <Grid2 display={'flex'} alignItems={'baseline'}>
              <Typography mr={9}>相手</Typography>
              <TextFieldElement
                name="kokyaku.name"
                control={control}
                sx={{
                  width: 400,
                  pointerEvents: 'none', // クリック不可にする
                  backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
                  color: '#888',
                }}
                slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
              />
            </Grid2>
            <Grid2 display={'flex'} alignItems={'baseline'}>
              <Typography mr={9}>年月日</Typography>
              <Typography mr={1}>～</Typography>
              <Controller
                control={control}
                name="month"
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
      )}
    </>
  );
};
