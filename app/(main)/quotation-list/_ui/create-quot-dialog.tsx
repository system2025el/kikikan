'use client';

import { Button, DialogActions, DialogTitle, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { CloseMasterDialogButton } from '../../_ui/buttons';

export const CreateQuotDialog = ({
  setDialogOpen,
}: {
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  /* methods ------------------------------------- */
  /* 自動生成ボタン押下 */
  const onSubmit = (data: { juchuHeadId: number | null }) => {
    console.log(data.juchuHeadId, 'の見積もりを自動生成');
    router.push(`/quotation-list/create?juchuId=${data.juchuHeadId}`);
  };

  /* useForm ------------------------------------- */
  const { control, handleSubmit } = useForm<{ juchuHeadId: number | null }>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { juchuHeadId: null },
  });
  return (
    <>
      <DialogTitle display={'flex'} justifyContent={'space-between'}>
        受注番号から自動生成
        <CloseMasterDialogButton handleCloseDialog={() => setDialogOpen(false)} />
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack p={4}>
          <Typography>受注番号</Typography>
          <TextFieldElement
            name={'juchuHeadId'}
            control={control}
            inputRef={inputRef}
            rules={{
              required: '数字を入力してください',
            }}
            sx={{
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            type="number"
          />
        </Stack>
        <DialogActions>
          <Button type="submit">自動生成</Button>
          <Button
            onClick={() => {
              setDialogOpen(false);
              router.push('/quotation-list/create');
            }}
          >
            手動生成
          </Button>
        </DialogActions>
      </form>
    </>
  );
};
