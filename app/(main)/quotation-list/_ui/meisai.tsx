import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, IconButton, TextField } from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { QuotHeadValues } from '../_lib/types';
import { ReadOnlyYenNumberElement } from './yen';

/**
 * 動的フォーム（見積の明細項目部分）
 * @param param0
 * @returns 見積の明細項目のUIコンポーネント
 */
export const MeisaiLines = ({
  index,
  sectionNam,
  editable,
}: {
  index: number;
  sectionNam: 'kizai' | 'labor' | 'other';
  editable: boolean;
}) => {
  /** フォーカスしている行 */
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  /* useForm ----------------------------------------------------- */
  const { control, setValue } = useFormContext<QuotHeadValues>();
  // フォームのフィールド（明細）
  const meisaiFields = useFieldArray({ control, name: `meisaiHeads.${sectionNam}.${index}.meisai` });
  // 明細行の監視
  const watchedMeisai = useWatch({
    control,
    name: `meisaiHeads.${sectionNam}.${index}.meisai`,
  });

  /* methods ------------------------------------------------------ */
  /** 明細項目の順番を帰るボタン押下時 */
  const moveRow = (i: number, direction: number) => {
    meisaiFields.move(i, i + direction);
  };

  /* useEffect ---------------------------------------------------- */
  /* 小計の計算 */
  useEffect(() => {
    watchedMeisai?.forEach((m, i) => {
      const qty = Number(m.qty) || 0;
      const honbanbiQty = Number(m.honbanbiQty) || 0;
      const tankaAmt = Number(m.tankaAmt) || 0;
      // 小計を計算
      const theShokei = (qty * (honbanbiQty * 1000) * tankaAmt) / 1000;
      const currentShokei = Math.round(Number(m.shokeiAmt) || 0);
      const newShokei = Math.round(theShokei);
      // 現在の小計の値と比較し、異なっていればフォームの値を更新する
      // (無限ループを防ぐため、値が違う場合のみsetValueを実行)
      if (newShokei !== currentShokei) {
        setValue(`meisaiHeads.${sectionNam}.${index}.meisai.${i}.shokeiAmt`, newShokei, { shouldDirty: false });
      }
    });
  }, [watchedMeisai, sectionNam, index, setValue]); // 依存配列に監視対象などを設定

  return (
    <Box>
      {meisaiFields.fields.map((f, i) => (
        <Box key={f.id}>
          <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
            <Grid2 size={0.5} justifyItems={'end'}>
              <Box>
                <IconButton size="small" onClick={() => meisaiFields.remove(i)} disabled={!editable} color="error">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid2>
            <Grid2 size={'grow'}>
              {sectionNam !== 'labor' ? (
                <TextFieldElement
                  name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.nam`}
                  control={control}
                  disabled={!editable}
                />
              ) : (
                <SelectElement
                  name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.nam`}
                  control={control}
                  options={[
                    { id: 'チーフ', label: 'チーフ' },
                    { id: 'サブチーフ', label: 'サブチーフ' },
                    { id: 'システム', label: 'システム' },
                    { id: '機材テク', label: '機材テク' },
                    { id: '...', label: '...' },
                  ]}
                  sx={{ width: 242.5 }}
                  disabled={!editable}
                />
              )}
            </Grid2>
            <Grid2 size={1}>
              <TextFieldElement
                name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.qty`}
                control={control}
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
                disabled={!editable}
              />
            </Grid2>
            <Grid2 size={0.8}>
              <TextFieldElement
                name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.honbanbiQty`}
                control={control}
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
                disabled={!editable}
              />
            </Grid2>
            <Grid2 size={1.5}>
              <Controller
                name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.tankaAmt`}
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    value={
                      editingIndex === i
                        ? (field.value ?? '')
                        : typeof field.value === 'number' && !isNaN(field.value)
                          ? `¥${Math.abs(field.value).toLocaleString()}`
                          : `¥0`
                    }
                    type="text"
                    onFocus={(e) => {
                      setEditingIndex(i);
                      const rawValue = String(field.value ?? '');
                      e.target.value = rawValue;
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
            <Grid2 size={2}>
              <ReadOnlyYenNumberElement name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.shokeiAmt`} />
            </Grid2>
            <Grid2 size={1}>
              <IconButton
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
                size="small"
                onClick={() => moveRow(i, -1)}
                disabled={i === 0 || !editable}
              >
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
                size="small"
                onClick={() => moveRow(i, 1)}
                disabled={i === meisaiFields.fields.length - 1 || !editable}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Grid2>
          </Grid2>
        </Box>
      ))}
      <Grid2 container px={2} alignItems={'center'}>
        <Grid2 size={0.5} />
        <Button size="small" onClick={() => meisaiFields.append({ nam: null })} disabled={!editable}>
          <AddIcon fontSize="small" />
          項目
        </Button>
      </Grid2>
    </Box>
  );
};
