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
  TextFieldElement,
  UseFieldArrayReturn,
  useFormContext,
  useWatch,
} from 'react-hook-form-mui';

import { QuotHeadValues } from '../_lib/types';
import { ReadOnlyYenNumberElement } from './yen';

export const MeisaiTblHeader = ({
  index,
  sectionNam,
  sectionFields,
  children,
}: {
  index: number;
  sectionNam: 'kizai' | 'labor' | 'other';
  sectionFields: UseFieldArrayReturn<QuotHeadValues>;
  children: React.ReactNode;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  /* 明細テーブルの順番を変えるボタン押下時 */
  const moveRow = (index: number, direction: number) => {
    sectionFields.move(index, index + direction);
  };

  const { control, setValue } = useFormContext<QuotHeadValues>();

  // 明細の監視
  const meisaiList = useWatch({
    control,
    name: `meisaiHeads.${sectionNam}.${index}.meisai`,
  });
  const currentShokeiAmt = useWatch({
    control,
    name: `meisaiHeads.${sectionNam}.${index}.shokeiAmt`,
  });

  const nebikiAmt = useWatch({ control, name: `meisaiHeads.${sectionNam}.${index}.nebikiAmt` });
  const currentNebikiAftAmt = useWatch({ control, name: `meisaiHeads.${sectionNam}.${index}.nebikiAftAmt` });

  useEffect(() => {
    const sum = (meisaiList ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0);

    // 計算結果が現在の値と異なる場合のみ更新
    if (sum !== (Number(currentShokeiAmt) || 0)) {
      setValue(`meisaiHeads.${sectionNam}.${index}.shokeiAmt`, sum, {
        shouldDirty: true, // isDirtyを更新する場合
      });
    }
    const nebikiAft = sum - (nebikiAmt ?? 0);
    if (nebikiAft !== Number(currentNebikiAftAmt) || 0) {
      setValue(`meisaiHeads.${sectionNam}.${index}.nebikiAftAmt`, nebikiAft);
    }
  }, [meisaiList, currentShokeiAmt, nebikiAmt, currentNebikiAftAmt, sectionNam, index, setValue]);

  return (
    <>
      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 size={1} />
        <Grid2 size={5} display={'flex'} alignItems={'base-line'}>
          <TextFieldElement name={`meisaiHeads.${sectionNam}.${index}.mituMeisaiHeadNam`} control={control} />
          <CheckboxElement
            name={`meisaiHeads.${sectionNam}.${index}.headNamDspFlg`}
            control={control}
            sx={{ ml: 1 }}
            label="タイトルを見積書に出力する"
          />
        </Grid2>
        <Grid2 size={'grow'} justifyItems={'end'}>
          <Box>
            <Button
              color="error"
              onClick={() => {
                sectionFields.remove(index);
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
            <Button disabled={index === sectionFields.fields.length - 1} onClick={() => moveRow(index, 1)}>
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
          <TextFieldElement
            name={`meisaiHeads.${sectionNam}.${index}.biko1`}
            control={control}
            fullWidth
            placeholder="備考１"
          />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <Typography textAlign="end">小計</Typography>
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${sectionNam}.${index}.shokeiAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
        <Grid2 size={3}>
          <TextFieldElement
            name={`meisaiHeads.${sectionNam}.${index}.biko2`}
            control={control}
            fullWidth
            placeholder="備考２"
          />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <TextFieldElement name={`meisaiHeads.${sectionNam}.${index}.nebikiNam`} control={control} />
        </Grid2>
        <Grid2 size={2}>
          <Controller
            name={`meisaiHeads.${sectionNam}.${index}.nebikiAmt`}
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
          <TextFieldElement
            name={`meisaiHeads.${sectionNam}.${index}.biko3`}
            control={control}
            fullWidth
            placeholder="備考３"
          />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <TextFieldElement name={`meisaiHeads.${sectionNam}.${index}.nebikiAftNam`} control={control} />
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${sectionNam}.${index}.nebikiAftAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </>
  );
};
