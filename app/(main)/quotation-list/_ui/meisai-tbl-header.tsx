'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
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
  editable,
  children,
}: {
  index: number;
  sectionNam: 'kizai' | 'labor' | 'other';
  sectionFields: UseFieldArrayReturn<QuotHeadValues>;
  editable: boolean;
  children: React.ReactNode;
}) => {
  /* useState ------------------------------------------------------ */
  /** フォーカスしている行 */
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  /* methods ------------------------------------------------------- */
  /* 明細テーブルの順番を変えるボタン押下時 */
  const moveRow = (index: number, direction: number) => {
    sectionFields.move(index, index + direction);
  };

  /* useForm ------------------------------------------------------- */
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

  /* 自動計算 ----------------------------------------------------- */
  const shokeiSum = useMemo(
    () => Math.round((meisaiList ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0)),
    [meisaiList]
  );
  const nebikiAft = useMemo(() => Math.round(shokeiSum - (nebikiAmt ?? 0)), [shokeiSum, nebikiAmt]);

  /* useEffect ---------------------------------------------------- */
  useEffect(() => {
    // 計算結果が現在の値と異なる場合のみ更新
    if (shokeiSum !== (Number(currentShokeiAmt) || 0)) {
      setValue(`meisaiHeads.${sectionNam}.${index}.shokeiAmt`, shokeiSum, { shouldDirty: false });
    }
    if (nebikiAft !== Number(currentNebikiAftAmt) || 0) {
      setValue(`meisaiHeads.${sectionNam}.${index}.nebikiAftAmt`, nebikiAft, { shouldDirty: false });
    }
  }, [currentShokeiAmt, currentNebikiAftAmt, shokeiSum, nebikiAft, sectionNam, index, setValue]);

  return (
    <>
      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 size={1} />
        <Grid2 size={5} display={'flex'} alignItems={'base-line'}>
          <TextFieldElement
            name={`meisaiHeads.${sectionNam}.${index}.mituMeisaiHeadNam`}
            control={control}
            disabled={!editable}
          />
          <CheckboxElement
            name={`meisaiHeads.${sectionNam}.${index}.headNamDspFlg`}
            control={control}
            sx={{ ml: 1 }}
            label="タイトルを見積書に出力する"
            disabled={!editable}
          />
        </Grid2>
        <Grid2 size={'grow'} justifyItems={'end'}>
          <Box>
            <Button
              color="error"
              onClick={() => {
                sectionFields.remove(index);
              }}
              disabled={!editable}
            >
              <DeleteIcon fontSize="small" />
              削除
            </Button>
          </Box>
        </Grid2>
        <Grid2 size={1} justifyItems={'end'}>
          <Stack spacing={1}>
            <Button disabled={index === 0 || !editable} onClick={() => moveRow(index, -1)}>
              <ArrowUpwardIcon fontSize="small" />
            </Button>
            <Button disabled={index === sectionFields.fields.length - 1 || !editable} onClick={() => moveRow(index, 1)}>
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
            disabled={!editable}
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
            disabled={!editable}
          />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <TextFieldElement
            name={`meisaiHeads.${sectionNam}.${index}.nebikiNam`}
            control={control}
            disabled={!editable}
          />
        </Grid2>
        <Grid2 size={2}>
          <Controller
            name={`meisaiHeads.${sectionNam}.${index}.nebikiAmt`}
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                value={
                  editingIndex === index
                    ? (field.value ?? '')
                    : typeof field.value === 'number' && !isNaN(field.value)
                      ? `¥-${Math.abs(field.value).toLocaleString()}`
                      : `¥0`
                }
                type="text"
                onFocus={(e) => {
                  setEditingIndex(index);
                  const rawValue = String(field.value ?? '');
                  setTimeout(() => {
                    e.target.value = rawValue;
                  }, 1);
                }}
                onBlur={(e) => {
                  const rawValue = e.target.value.replace(/[¥,]/g, '');
                  const numericValue = Math.abs(Number(rawValue));
                  field.onChange(numericValue);
                  setEditingIndex(null);
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
                disabled={!editable}
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
            disabled={!editable}
          />
        </Grid2>
        <Grid2 size={'grow'} />
        <Grid2 size={1.5}>
          <TextFieldElement
            name={`meisaiHeads.${sectionNam}.${index}.nebikiAftNam`}
            control={control}
            disabled={!editable}
          />
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${sectionNam}.${index}.nebikiAftAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </>
  );
};
