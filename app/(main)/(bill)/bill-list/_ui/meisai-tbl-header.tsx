'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  Control,
  Controller,
  FieldPath,
  TextFieldElement,
  UseFieldArrayReturn,
  useFormContext,
  useWatch,
} from 'react-hook-form-mui';

import { BillHeadValues } from '../_lib/types';

export const MeisaiTblHeader = ({
  index,
  fields,
  children,
}: {
  index: number;
  fields: UseFieldArrayReturn<BillHeadValues>;
  children: React.ReactNode;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  /* 明細テーブルの順番を変えるボタン押下時 */
  const moveRow = (index: number, direction: number) => {
    fields.move(index, index + direction);
  };

  const { control, setValue } = useFormContext<BillHeadValues>();

  // 明細の監視
  const meisaiList = useWatch({
    control,
    name: `meisaiHeads.${index}.meisai`,
  });
  const currentShokeiAmt = useWatch({
    control,
    name: `meisaiHeads.${index}.shokeiAmt`,
  });

  const nebikiAmt = useWatch({ control, name: `meisaiHeads.${index}.nebikiAmt` });
  const currentNebikiAftAmt = useWatch({ control, name: `meisaiHeads.${index}.nebikiAftAmt` });

  useEffect(() => {
    const sum = (meisaiList ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0);

    // 計算結果が現在の値と異なる場合のみ更新
    if (sum !== (Number(currentShokeiAmt) || 0)) {
      setValue(`meisaiHeads.${index}.shokeiAmt`, sum, {
        shouldDirty: true, // isDirtyを更新する場合
      });
    }
    const nebikiAft = sum - (nebikiAmt ?? 0);
    if (nebikiAft !== Number(currentNebikiAftAmt) || 0) {
      setValue(`meisaiHeads.${index}.nebikiAftAmt`, nebikiAft);
    }
  }, [meisaiList, currentShokeiAmt, nebikiAmt, currentNebikiAftAmt, index, setValue]);

  return (
    <>
      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 size={1} />
        <Grid2 size={5} display={'flex'} alignItems={'base-line'}>
          <TextFieldElement name={`meisaiHeads.${index}.seikyuMeisaiHeadNam`} control={control} />
          <CheckboxElement
            name={`meisaiHeads.${index}.headNamDspFlg`}
            control={control}
            sx={{ ml: 1 }}
            label="タイトルを請求書に出力する"
          />
        </Grid2>
        <Grid2 size={'grow'} justifyItems={'end'}>
          <Box>
            <Button
              color="error"
              onClick={() => {
                fields.remove(index);
              }}
            >
              <DeleteIcon fontSize="small" />
              削除
            </Button>
          </Box>
        </Grid2>
        <Grid2 size={1} justifyItems={'end'}>
          <Stack spacing={1}>
            <Button disabled={index === 0} onClick={() => moveRow(index, -1)}>
              <ArrowUpwardIcon fontSize="small" />
            </Button>
            <Button disabled={index === fields.fields.length - 1} onClick={() => moveRow(index, 1)}>
              <ArrowDownwardIcon fontSize="small" />
            </Button>
          </Stack>
        </Grid2>
      </Grid2>
      <Grid2
        container
        px={2}
        my={0.5}
        sx={{ backgroundColor: 'primary.light', color: 'primary.contrastText' }}
        alignItems={'end'}
        spacing={0.5}
      >
        <Grid2 size={0.5} />
        <Grid2 size={'grow'}>
          <Typography variant="body2" fontWeight={500}>
            名称
          </Typography>
        </Grid2>
        <Grid2 size={1}>
          <Typography variant="body2" fontWeight={500}>
            数量
          </Typography>
        </Grid2>
        <Grid2 size={0.8}>
          <Typography variant="body2" fontWeight={500}>
            使用日
          </Typography>
        </Grid2>
        <Grid2 size={1.5}>
          <Typography variant="body2" fontWeight={500}>
            単価
          </Typography>
        </Grid2>
        <Grid2 size={2}>
          <Typography variant="body2" fontWeight={500}>
            小計
          </Typography>
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
      {/* 明細  */}
      {children}
      {/* 明細ヘッダ下部 */}
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
        <Grid2 size={3}>
          <TextFieldElement name={`meisaiHeads.${index}.biko1`} control={control} fullWidth placeholder="備考１" />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <Typography textAlign="end">小計</Typography>
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${index}.shokeiAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
        <Grid2 size={3}>
          <TextFieldElement name={`meisaiHeads.${index}.biko2`} control={control} fullWidth placeholder="備考２" />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <TextFieldElement name={`meisaiHeads.${index}.nebikiNam`} control={control} />
        </Grid2>
        <Grid2 size={2}>
          <Controller
            name={`meisaiHeads.${index}.nebikiAmt`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={
                  isEditing
                    ? (field.value ?? '')
                    : typeof field.value === 'number' && !isNaN(field.value)
                      ? `${'-'}¥${Math.abs(field.value).toLocaleString()}`
                      : `${'-'}¥0`
                }
                type="text"
                onFocus={(e) => {
                  setIsEditing(true);
                  const rawValue = String(field.value ?? '');
                  setTimeout(() => {
                    e.target.value = rawValue;
                  }, 1);
                }}
                onBlur={(e) => {
                  const rawValue = e.target.value.replace(/[¥,]/g, '');
                  const numericValue = Math.abs(Number(rawValue));
                  field.onChange(numericValue);
                  setIsEditing(false);
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  if (/^\d*$/.test(raw)) {
                    field.onChange(Number(raw));
                    e.target.value = raw;
                  }
                }}
                sx={(theme) => ({
                  '.MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldState.error?.message && theme.palette.error.main,
                  },
                  '.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldState.error?.message && theme.palette.error.main,
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: fieldState.error?.message && theme.palette.error.main,
                  },
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '.MuiFormHelperText-root': {
                    color: theme.palette.error.main,
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                })}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
        <Grid2 size={3}>
          <TextFieldElement name={`meisaiHeads.${index}.biko3`} control={control} fullWidth placeholder="備考３" />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <TextFieldElement name={`meisaiHeads.${index}.nebikiAftNam`} control={control} />
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${index}.nebikiAftAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </>
  );
};

/**
 *
 * @param param0 請求用
 * @returns
 */
export const ReadOnlyYenNumberElement = <TFieldName extends FieldPath<BillHeadValues>>({
  name,
}: {
  name: TFieldName;
}) => {
  const { control } = useFormContext<BillHeadValues>();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={
            typeof field.value === 'number' && !isNaN(field.value)
              ? field.value >= 0
                ? `¥${Math.abs(field.value).toLocaleString()}`
                : `-¥${Math.abs(field.value).toLocaleString()}`
              : `¥0`
          }
          type="text"
          onFocus={(e) => {
            const rawValue = String(field.value ?? '');
            setTimeout(() => {
              e.target.value = rawValue;
            }, 1);
          }}
          onBlur={(e) => {
            const rawValue = e.target.value.replace(/[¥,]/g, '');
            const numericValue = Number(rawValue);
            field.onChange(numericValue);
          }}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '');
            if (/^\d*$/.test(raw)) {
              field.onChange(Number(raw));
              e.target.value = raw;
            }
          }}
          sx={(theme) => ({
            '.MuiOutlinedInput-notchedOutline': {
              borderColor: fieldState.error?.message && theme.palette.error.main,
            },
            '.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: fieldState.error?.message && theme.palette.error.main,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: fieldState.error?.message && theme.palette.error.main,
            },
            '& .MuiInputBase-input': {
              textAlign: 'right',
            },
            '.MuiFormHelperText-root': {
              color: theme.palette.error.main,
            },
            '& input[type=number]::-webkit-inner-spin-button': {
              WebkitAppearance: 'none',
              margin: 0,
            },
            pointerEvents: 'none', // クリック不可にする
            backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
            color: '#888',
          })}
          slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
          helperText={fieldState.error?.message}
        />
      )}
    />
  );
};
