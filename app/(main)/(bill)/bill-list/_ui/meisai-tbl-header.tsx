'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, TextField, Typography } from '@mui/material';
import { memo, useEffect, useRef, useState } from 'react';
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

/**
 * テーブル1つ分の小計・値引後金額を計算してフォームへ反映する非表示コンポーネント。
 * テーブル単位でしか監視しないことで、明細行の入力のたびにテーブルヘッダー本体
 * （＝配下の全行）まで再レンダリングされるのを防ぐ。
 * @returns {null} 何も描画しない
 */
const MeisaiTblShokeiCalculator = ({ index }: { index: number }) => {
  const { control, setValue } = useFormContext<BillHeadValues>();

  const meisaiList = useWatch({ control, name: `meisaiHeads.${index}.meisai` });
  const currentShokeiAmt = useWatch({ control, name: `meisaiHeads.${index}.shokeiAmt` });
  const nebikiAmt = useWatch({ control, name: `meisaiHeads.${index}.nebikiAmt` });
  const currentNebikiAftAmt = useWatch({ control, name: `meisaiHeads.${index}.nebikiAftAmt` });

  useEffect(() => {
    const sum = (meisaiList ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0);
    // shouldDirty: true にして、値が元に戻った際に isDirty が正しく再評価されるようにする
    if (sum !== (Number(currentShokeiAmt) || 0)) {
      setValue(`meisaiHeads.${index}.shokeiAmt`, sum, { shouldDirty: true });
    }

    const nebikiAft = sum - (nebikiAmt ?? 0);
    if (nebikiAft !== (Number(currentNebikiAftAmt) || 0)) {
      setValue(`meisaiHeads.${index}.nebikiAftAmt`, nebikiAft, { shouldDirty: true });
    }
  }, [meisaiList, currentShokeiAmt, nebikiAmt, currentNebikiAftAmt, index, setValue]);

  return null;
};

/**
 * 請求の明細ヘッダUIコンポーネント
 * @param param0
 * @returns 請求の明細ヘッダUIコンポーネント
 */
const MeisaiTblHeaderComponent = ({
  index,
  fields,
  editable,
  children,
}: {
  index: number;
  fields: UseFieldArrayReturn<BillHeadValues>;
  children: React.ReactNode;
  editable: boolean;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  /* 明細テーブルの順番を変えるボタン押下時 */
  const moveRow = (index: number, direction: number) => {
    fields.move(index, index + direction);
  };

  const { control, setValue, getValues } = useFormContext<BillHeadValues>();

  /* ref */
  const inputRef = useRef<HTMLInputElement>(null);

  /* 一括変更ボタン押下 */
  const handleBulkChange = () => {
    const newValue = Number(inputRef.current?.value);
    const meisaiList = getValues(`meisaiHeads.${index}.meisai`);
    if (!inputRef.current?.value || isNaN(newValue) || !meisaiList) return;

    const updatedMeisai = meisaiList.map((item) => ({
      ...item,
      honbanbiQty: newValue,
    }));

    setValue(`meisaiHeads.${index}.meisai`, updatedMeisai, {
      shouldDirty: true, // フォームが変更されたことを親に通知
      shouldValidate: true, // バリデーションを走らせる
    });
  };

  return (
    <Box border={1} borderColor={'divider'} p={1}>
      <MeisaiTblShokeiCalculator index={index} />
      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 size={4} sx={styles.container}>
          <TextFieldElement
            name={`meisaiHeads.${index}.seikyuMeisaiHeadNam`}
            control={control}
            fullWidth
            disabled={!editable}
          />
        </Grid2>
        <Grid2 size={'grow'} justifyItems={'end'}>
          <Box display={'flex'} alignItems={'end'}>
            <Grid2 container alignItems={'end'} spacing={1} mr={1}>
              <TextField
                type="number"
                slotProps={{
                  htmlInput: {
                    step: 'any',
                  },
                }}
                sx={{
                  width: '60px',
                  '& .MuiInputBase-input': {
                    textAlign: 'right',
                  },
                  '& input[type=number]::-webkit-inner-spin-button': {
                    WebkitAppearance: 'none',
                    margin: 0,
                  },
                }}
                inputRef={inputRef}
                onFocus={(e) => e.target.select()}
              />
              <Button onClick={handleBulkChange} disabled={!editable}>
                本番日数一括変更
              </Button>
            </Grid2>
            <Button
              color="error"
              onClick={() => {
                fields.remove(index);
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
            <Button disabled={index === fields.fields.length - 1 || !editable} onClick={() => moveRow(index, 1)}>
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
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
            disabled={!editable}
          />
        </Grid2>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={1}>受注明細番号</Typography>
          <TextFieldElement
            name={`meisaiHeads.${index}.juchuKizaiHeadId`}
            control={control}
            sx={{
              width: 120,
              pointerEvents: 'none', // クリック不可にする
              backgroundColor: '#f5f5f5', // グレー背景で無効っぽく
              color: '#888',
              '& .MuiInputBase-input': {
                textAlign: 'right',
              },
              '& input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
            }}
            slotProps={{ input: { readOnly: true, onFocus: (e) => e.target.blur() } }}
            disabled={!editable}
          />
        </Grid2>
      </Grid2>

      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={5}>公演名</Typography>
          <TextFieldElement
            name={`meisaiHeads.${index}.koenNam`}
            control={control}
            sx={{ width: 400 }}
            disabled={!editable}
          />
        </Grid2>
        <Grid2 sx={styles.container}>
          <Typography marginRight={5}>貸出期間</Typography>
          <Controller
            control={control}
            name={`meisaiHeads.${index}.seikyuRange.strt`}
            render={({ field, fieldState: { error } }) => (
              <FormDateX
                value={field.value}
                onChange={field.onChange}
                sx={{ mr: 1 }}
                error={!!error}
                helperText={error?.message}
                disabled={!editable}
              />
            )}
          />
          <span>～</span>
          <Controller
            control={control}
            name={`meisaiHeads.${index}.seikyuRange.end`}
            render={({ field, fieldState: { error } }) => (
              <FormDateX
                value={field.value}
                onChange={field.onChange}
                sx={{ ml: 1 }}
                error={!!error}
                helperText={error?.message}
                disabled={!editable}
              />
            )}
          />
        </Grid2>
      </Grid2>

      <Grid2 container alignItems={'end'} my={0.5}>
        <Grid2 sx={styles.container} size={4}>
          <Typography marginRight={3}>公演場所</Typography>
          <TextFieldElement
            name={`meisaiHeads.${index}.koenbashoNam`}
            control={control}
            sx={{ width: 400 }}
            disabled={!editable}
          />
        </Grid2>
        <Grid2 sx={styles.container}>
          <Typography marginRight={7}>担当者</Typography>
          <TextFieldElement name={`meisaiHeads.${index}.kokyakuTantoNam`} control={control} disabled={!editable} />
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
          <Typography textAlign="end">小計</Typography>
        </Grid2>
        <Grid2 size={2}>
          <ReadOnlyYenNumberElement name={`meisaiHeads.${index}.shokeiAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
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
                      ? `¥-${Math.abs(field.value).toLocaleString()}`
                      : `¥0`
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
                  // 空欄のまま何も入力されなかった場合は 0 ではなく null に戻し、
                  // 未編集の値が誤って dirty 扱いになるのを防ぐ
                  const numericValue = rawValue === '' ? null : Math.abs(Number(rawValue));
                  field.onChange(numericValue);
                  setIsEditing(false);
                }}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  if (/^\d*$/.test(raw)) {
                    // 空欄になった場合は 0 ではなく null にし、値が0の状態から
                    // バックスペースで消しても表示が0に戻ってしまわないようにする
                    field.onChange(raw === '' ? null : Number(raw));
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
          <CheckboxElement name={`meisaiHeads.${index}.zeiFlg`} control={control} size="medium" disabled={!editable} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </Box>
  );
};

/**
 * fields（useFieldArrayの戻り値）は親が再レンダリングされるたびに
 * 新しいオブジェクト参照になるため、既定の shallow compare では memo が効かない。
 * 実際にこのコンポーネントの表示に影響する値（行数・並び順に relevant な index）だけを
 * 比較することで、親（Bill）が isDirty 等の変化で再レンダリングされても、
 * 内容が変わっていないテーブルは再レンダリングされないようにする。
 */
export const MeisaiTblHeader = memo(
  MeisaiTblHeaderComponent,
  (prev, next) =>
    prev.index === next.index &&
    prev.editable === next.editable &&
    prev.fields.fields.length === next.fields.fields.length
);

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
