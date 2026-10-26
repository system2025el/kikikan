'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  Container,
  Dialog,
  FormControlLabel,
  Grid2,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { FormDateX } from '@/app/(main)/_ui/date';
import { LoadingOverlay } from '@/app/(main)/_ui/loading';

import { COPY_TARGET, CopyDialogSchema, CopyDialogValue, KokyakuValues } from '../_lib/types';
import { CustomerSelectionDialog } from './customer-selection';

export const CopyDialog = ({
  selectedCount,
  handleCopyConfirmed,
  handleCloseCopyDialog,
  lock,
}: {
  selectedCount: number;
  handleCopyConfirmed: (data: CopyDialogValue) => Promise<boolean | undefined>;
  handleCloseCopyDialog: () => void;
  lock: () => Promise<boolean | React.JSX.Element | undefined>;
}) => {
  // ローディング
  const [isLoading, setIsLoading] = useState(false);
  // 顧客選択ダイアログ制御
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);

  /* useForm ------------------------- */
  const { control, setError, setValue, clearErrors, handleSubmit } = useForm<CopyDialogValue>({
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      copyTarget: COPY_TARGET.self,
      juchuHeadid: '',
      kokyaku: { kokyakuId: null, kokyakuNam: '' },
      koenNam: '',
      headNam: '',
      shukoDat: null,
      nyukoDat: null,
    },
    resolver: zodResolver(CopyDialogSchema),
  });

  // コピー先
  const copyTarget = useWatch({ control, name: 'copyTarget' });

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

  // 顧客選択ダイアログで顧客選択
  const handleCustSelect = (customer: KokyakuValues) => {
    setValue('kokyaku', { kokyakuId: customer.kokyakuId, kokyakuNam: customer.kokyakuNam });
    clearErrors('kokyaku.kokyakuNam');
    setCustomerDialogOpen(false);
  };

  return (
    <Container sx={{ p: 1 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Typography>{selectedCount > 1 ? `コピー（${selectedCount}件を1明細に合体）` : 'コピー'}</Typography>
        {isLoading && <LoadingOverlay />}
        <Paper variant="outlined">
          <Grid2 container alignItems={'baseline'} spacing={2} p={2} width={'400px'}>
            <Box>
              <Typography>コピー先</Typography>
              <Controller
                name="copyTarget"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    row
                    value={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.value);
                      // 使わなくなった入力欄の値とエラーは残さない
                      setValue('juchuHeadid', '');
                      clearErrors(['juchuHeadid', 'kokyaku.kokyakuNam', 'koenNam']);
                    }}
                  >
                    <FormControlLabel value={COPY_TARGET.self} control={<Radio size="small" />} label="この伝票" />
                    <FormControlLabel value={COPY_TARGET.new} control={<Radio size="small" />} label="新規伝票" />
                    <FormControlLabel
                      value={COPY_TARGET.other}
                      control={<Radio size="small" />}
                      label="受注番号を指定"
                    />
                  </RadioGroup>
                )}
              />
            </Box>
            {copyTarget === COPY_TARGET.other && (
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
            )}
            {copyTarget === COPY_TARGET.new && (
              <>
                <Grid2 container alignItems={'baseline'} width={'100%'}>
                  <Typography mr={4}>顧客</Typography>
                  <Controller
                    name="kokyaku.kokyakuNam"
                    control={control}
                    render={({ field, fieldState }) => (
                      <>
                        <TextField
                          value={field.value}
                          slotProps={{ input: { readOnly: true } }}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                          sx={{ flex: 1 }}
                        />
                        <Button style={{ marginLeft: 5 }} onClick={() => setCustomerDialogOpen(true)}>
                          検索
                        </Button>
                      </>
                    )}
                  />
                </Grid2>
                <Grid2 container alignItems={'baseline'} width={'100%'}>
                  <Typography mr={2}>公演名</Typography>
                  <TextFieldElement name="koenNam" control={control} sx={{ flex: 1 }} />
                </Grid2>
                <Typography variant="body2" color="text.secondary">
                  新しい受注伝票を作成してコピーします
                </Typography>
              </>
            )}
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
      {/* 顧客検索ダイアログ（新規伝票の顧客） */}
      <Dialog open={customerDialogOpen} fullScreen>
        <CustomerSelectionDialog
          handleCustSelect={handleCustSelect}
          handleCloseCustDialog={() => setCustomerDialogOpen(false)}
          lock={lock}
        />
      </Dialog>
    </Container>
  );
};
