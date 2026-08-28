'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Container, DialogContent, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { FormDateX } from '@/app/(main)/_ui/date';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';

import { CopyDialogSchema, CopyDialogValue } from '../_lib/types';

export const CopyDialog = ({
  selectedCount,
  handleCopyConfirmed,
  handleCloseCopyDialog,
}: {
  selectedCount: number;
  handleCopyConfirmed: (data: CopyDialogValue) => Promise<boolean | undefined>;
  handleCloseCopyDialog: () => void;
}) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);

  /* useForm ------------------------- */
  const { control, setError, handleSubmit } = useForm<CopyDialogValue>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      juchuHeadid: '',
      headNam: '',
      shukoDat: null,
      nyukoDat: null,
    },
    resolver: zodResolver(CopyDialogSchema),
  });

  const onSubmit = async (data: CopyDialogValue) => {
    setIsLoading(true);
    const copyResult = await handleCopyConfirmed(data);
    if (copyResult === false) {
      setError('juchuHeadid', {
        type: 'manual',
        message: '受注番号がありません',
      });
    }
    setIsLoading(false);
  };

  return (
    <Container sx={{ p: 1 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Typography>{selectedCount > 1 ? `コピー（${selectedCount}件を1明細に合体）` : 'コピー'}</Typography>
        {isLoading && <LoadingOverlay />}
        <Paper variant="outlined">
          <Grid2 container alignItems={'baseline'} spacing={2} p={2} width={'400px'}>
            <Grid2 container alignItems={'baseline'}>
              <Typography mr={2}>受注番号</Typography>
              <Controller
                name="juchuHeadid"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    type="text"
                    onChange={(e) => {
                      if (e.target.value === '' || /^\d*$/.test(e.target.value)) {
                        field.onChange(e.target.value);
                      }
                    }}
                    sx={{
                      '& .MuiInputBase-input': {
                        textAlign: 'right',
                        width: 150,
                      },
                    }}
                    slotProps={{
                      input: {
                        style: { textAlign: 'right' },
                        inputMode: 'numeric',
                      },
                    }}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid2>
            <Grid2 container alignItems={'baseline'}>
              <Typography>受注明細名</Typography>
              <TextFieldElement name="headNam" control={control} />
            </Grid2>
            <Box>
              <Typography>出庫日</Typography>
              <Grid2>
                <Controller
                  name="shukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormDateX
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid2>
            </Box>
            <Box>
              <Typography>入庫日</Typography>
              <Grid2>
                <Controller
                  name="nyukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <FormDateX
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid2>
            </Box>
            <Typography variant="body2" color="text.secondary">
              コピー先はYARDの出庫・入庫（0:00）で作成されます
            </Typography>
          </Grid2>
        </Paper>
        <Box display={'flex'} justifyContent={'end'} my={1}>
          <Grid2 container spacing={2}>
            <Button type="submit" loading={isLoading}>
              確定
            </Button>
            <Button onClick={handleCloseCopyDialog}>戻る</Button>
          </Grid2>
        </Box>
      </form>
    </Container>
  );
};
