'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Box, Button, Container, Grid2, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { validationMessages } from '@/app/(main)/_lib/validation-messages';
import { DateTime } from '@/app/(main)/_ui/date';
import { Loading, LoadingOverlay } from '@/app/(main)/_ui/loading';

import { CopyDialogSchema, CopyDialogValue, EqTableValues } from '../_lib/types';

export const CopyDialog = ({
  selectEqHeader,
  handleCopyConfirmed,
  handleCloseCopyDialog,
}: {
  selectEqHeader: EqTableValues | null;
  handleCopyConfirmed: (data: CopyDialogValue) => Promise<boolean | undefined>;
  handleCloseCopyDialog: () => void;
}) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);

  /* useForm ------------------------- */
  const { control, setError, handleSubmit } = useForm({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      juchuHeadid: '',
      headNam: '',
      kicsShukoDat: null,
      kicsNyukoDat: null,
      yardShukoDat: null,
      yardNyukoDat: null,
    },
    resolver: zodResolver(CopyDialogSchema(selectEqHeader)),
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
        <Typography>コピー</Typography>
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
              <Typography>機材明細名</Typography>
              <TextFieldElement name="headNam" control={control} />
            </Grid2>
            <Box>
              <Typography>出庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <Controller
                  name="kicsShukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateTime
                      {...field}
                      date={field.value}
                      onChange={(date) => field.onChange(date?.toDate())}
                      onAccept={() => {}}
                      fieldstate={fieldState}
                      disabled={!selectEqHeader?.kicsShukoDat}
                      onClear={() => {
                        field.onChange(null);
                      }}
                    />
                  )}
                />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <Controller
                  name="yardShukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateTime
                      {...field}
                      date={field.value}
                      onChange={(date) => field.onChange(date?.toDate())}
                      onAccept={() => {}}
                      fieldstate={fieldState}
                      disabled={!selectEqHeader?.yardShukoDat}
                      onClear={() => {
                        field.onChange(null);
                      }}
                    />
                  )}
                />
              </Grid2>
            </Box>
            <Box>
              <Typography>入庫日時</Typography>
              <Grid2>
                <TextField defaultValue={'K'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <Controller
                  name="kicsNyukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateTime
                      {...field}
                      date={field.value}
                      onChange={(date) => field.onChange(date?.toDate())}
                      onAccept={() => {}}
                      fieldstate={fieldState}
                      disabled={!selectEqHeader?.kicsNyukoDat}
                      onClear={() => {
                        field.onChange(null);
                      }}
                    />
                  )}
                />
              </Grid2>
              <Grid2>
                <TextField defaultValue={'Y'} disabled sx={{ width: '10%', minWidth: 50 }} />
                <Controller
                  name="yardNyukoDat"
                  control={control}
                  render={({ field, fieldState }) => (
                    <DateTime
                      {...field}
                      date={field.value}
                      onChange={(date) => field.onChange(date?.toDate())}
                      onAccept={() => {}}
                      fieldstate={fieldState}
                      disabled={!selectEqHeader?.yardNyukoDat}
                      onClear={() => {
                        field.onChange(null);
                      }}
                    />
                  )}
                />
              </Grid2>
            </Box>
          </Grid2>
        </Paper>
        <Box display={'flex'} justifyContent={'end'} my={1}>
          <Grid2 container spacing={2}>
            <Button type="submit">確定</Button>
            <Button onClick={handleCloseCopyDialog}>戻る</Button>
          </Grid2>
        </Box>
      </form>
    </Container>
  );
};
