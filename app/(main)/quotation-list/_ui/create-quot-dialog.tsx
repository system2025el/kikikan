'use client';

import { Button, DialogActions, DialogTitle, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { TextFieldElement, useForm } from 'react-hook-form-mui';

import { CloseMasterDialogButton } from '../../_ui/buttons';
import { LoadingOverlay } from '../../_ui/loading';
import { QuotSearchValues } from '../_lib/types';

/**
 * 見積書作成確認ダイアログ
 * @param param0
 * @returns {JSX.Element} 見積作成時のダイアログコンポーネント
 */
export const CreateQuotDialog = ({
  inputRef,
  searchParams,
  setDialogOpen,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  searchParams: QuotSearchValues;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const router = useRouter();
  /** ローディング */
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* methods ------------------------------------- */
  /** 自動生成ボタン押下 */
  const onSubmit = (data: { juchuHeadId: number | null }) => {
    console.log(data.juchuHeadId, 'の見積もりを自動生成');
    sessionStorage.setItem('quotListSearchParams', JSON.stringify(searchParams));
    setIsLoading(true);
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
      {isLoading && <LoadingOverlay />}
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
              sessionStorage.setItem('quotListSearchParams', JSON.stringify(searchParams));
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
