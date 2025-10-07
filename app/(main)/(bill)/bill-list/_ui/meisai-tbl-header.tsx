'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CheckboxElement,
  Controller,
  FieldPath,
  TextFieldElement,
  UseFieldArrayReturn,
  useFormContext,
  useWatch,
} from 'react-hook-form-mui';

import { FormDateX } from '@/app/(main)/_ui/date';

import { BillHeadValues } from '../_lib/types';
import { ReadOnlyYenNumberElement } from './yen';

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

  const nebikiAmt = useWatch({ control, name: `meisaiHeads.${index}.nebikiAmt` });
  const currentNebikiAftAmt = useWatch({ control, name: `meisaiHeads.${index}.nebikiAftAmt` });

  useEffect(() => {
    const sum = (meisaiList ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0);

    const nebikiAft = sum - (nebikiAmt ?? 0);
    if (nebikiAft !== Number(currentNebikiAftAmt) || 0) {
      setValue(`meisaiHeads.${index}.nebikiAftAmt`, nebikiAft);
    }
  }, [meisaiList, nebikiAmt, currentNebikiAftAmt, index, setValue]);

  return (
    <Box border={1} borderColor={'divider'} p={1}>
      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 size={4} sx={styles.container}>
          <TextFieldElement name={`meisaiHeads.${index}.seikyuMeisaiHeadNam`} control={control} fullWidth />
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

      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={3}>受注番号</Typography>
          <TextFieldElement
            name={`meisaiHeads.${index}.juchuHeadId`}
            control={control}
            sx={{
              width: 120,
              pointerEvents: 'none', // クリック不可にする
              backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
              color: '#888',
            }}
            slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
          />
        </Grid2>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={1}>機材明細番号</Typography>
          <TextFieldElement
            name={`meisaiHeads.${index}.juchuKizaiHeadId`}
            control={control}
            sx={{
              width: 120,
              pointerEvents: 'none', // クリック不可にする
              backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
              color: '#888',
            }}
            slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
          />
        </Grid2>
      </Grid2>

      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={5}>公演名</Typography>
          <TextFieldElement name={`meisaiHeads.${index}.koenNam`} control={control} sx={{ width: 400 }} />
        </Grid2>
        <Grid2 sx={styles.container}>
          <Typography marginRight={5}>貸出期間</Typography>
          <Controller
            control={control}
            name={`meisaiHeads.${index}.seikyuRange.strt`}
            render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} sx={{ mr: 1 }} readonly />}
          />
          <span>～</span>
          <Controller
            control={control}
            name={`meisaiHeads.${index}.seikyuRange.end`}
            render={({ field }) => <FormDateX value={field.value} onChange={field.onChange} sx={{ ml: 1 }} />}
          />
        </Grid2>
      </Grid2>

      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={3}>公演場所</Typography>
          <TextFieldElement name={`meisaiHeads.${index}.koenbashoNam`} control={control} sx={{ width: 400 }} />
        </Grid2>
        <Grid2 sx={styles.container}>
          <Typography marginRight={7}>担当者</Typography>
          <TextFieldElement name={`meisaiHeads.${index}.kokyakuTantoNam`} control={control} />
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
            項目
          </Typography>
        </Grid2>
        <Grid2 size={1}>
          <Typography variant="body2" fontWeight={500}>
            数量
          </Typography>
        </Grid2>
        <Grid2 size={0.8}>
          <Typography variant="body2" fontWeight={500}>
            本番日数
          </Typography>
        </Grid2>
        <Grid2 size={1.5}>
          <Typography variant="body2" fontWeight={500}>
            単価
          </Typography>
        </Grid2>
        <Grid2 size={2}>
          <Typography variant="body2" fontWeight={500}>
            金額
          </Typography>
        </Grid2>

        <Grid2 size={1} />
      </Grid2>
      {/* 明細  */}
      {children}

      {/* 明細ヘッダ下部 */}
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={1}>
        <Grid2 size={'grow'} />
        <Grid2 size={1}>
          <Typography textAlign="end">値引き</Typography>
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
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={1}>
        <Grid2 size={'grow'} />
        <Grid2 size={1}>
          <Typography textAlign="end">伝票計</Typography>
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${index}.nebikiAftAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
      <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={1}>
        <Grid2 size={'grow'} />
        <Grid2 size={1}>
          <Typography textAlign="end">消費税対象</Typography>
        </Grid2>
        <Grid2 size={2}>
          <CheckboxElement name={`meisaiHeads.${index}.zeiFlg`} control={control} size="medium" />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </Box>
  );
};

/* style
---------------------------------------------------------------------------------------------------- */
/** @type {{ [key: string]: React.CSSProperties }} style */
const styles: { [key: string]: React.CSSProperties } = {
  // コンテナ
  container: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 2,
    marginRight: 2,
  },
};
