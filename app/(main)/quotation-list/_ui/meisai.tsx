import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Autocomplete, Box, Button, Grid2, IconButton, TextField } from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { quotationLaborSelectItems } from '../_lib/datas';
import { QuotHeadValues } from '../_lib/types';
import { ReadOnlyYenNumberElement } from './yen';

/**
 * 明細1行分の小計金額を計算してフォームへ反映する非表示コンポーネント。
 * 行単位でしか監視しないことで、1行の数量・本番日数・単価を入力した際に
 * 同じテーブル内の他の行まで再レンダリングされるのを防ぐ。
 * @returns {null} 何も描画しない
 */
const MeisaiRowShokeiCalculator = ({
  sectionNam,
  index,
  rowIndex,
}: {
  sectionNam: 'kizai' | 'labor' | 'other';
  index: number;
  rowIndex: number;
}) => {
  const { control, setValue } = useFormContext<QuotHeadValues>();

  const qty = useWatch({ control, name: `meisaiHeads.${sectionNam}.${index}.meisai.${rowIndex}.qty` });
  const honbanbiQty = useWatch({
    control,
    name: `meisaiHeads.${sectionNam}.${index}.meisai.${rowIndex}.honbanbiQty`,
  });
  const tankaAmt = useWatch({ control, name: `meisaiHeads.${sectionNam}.${index}.meisai.${rowIndex}.tankaAmt` });
  const currentShokeiAmt = useWatch({
    control,
    name: `meisaiHeads.${sectionNam}.${index}.meisai.${rowIndex}.shokeiAmt`,
  });

  useEffect(() => {
    const q = Number(qty) || 0;
    const h = Number(honbanbiQty) || 0;
    const t = Number(tankaAmt) || 0;
    // 小計を計算
    const newShokei = Math.round((q * (h * 1000) * t) / 1000);
    const currentShokei = Math.round(Number(currentShokeiAmt) || 0);
    // 現在の小計の値と比較し、異なっていればフォームの値を更新する
    // (無限ループを防ぐため、値が違う場合のみsetValueを実行)
    if (newShokei !== currentShokei) {
      // shouldDirty: true にして、値が元に戻った際に isDirty が正しく再評価されるようにする
      setValue(`meisaiHeads.${sectionNam}.${index}.meisai.${rowIndex}.shokeiAmt`, newShokei, { shouldDirty: true });
    }
  }, [qty, honbanbiQty, tankaAmt, currentShokeiAmt, sectionNam, index, rowIndex, setValue]);

  return null;
};

/**
 * 明細1行分の単価セル。
 * フォーカス中かどうかの状態を行単位で持つことで、1つのセルにフォーカス／
 * フォーカスアウトした際に同じテーブル内の他の行まで再レンダリングされるのを防ぐ。
 */
const MeisaiRowTankaAmtField = ({
  sectionNam,
  index,
  rowIndex,
  editable,
}: {
  sectionNam: 'kizai' | 'labor' | 'other';
  index: number;
  rowIndex: number;
  editable: boolean;
}) => {
  const { control } = useFormContext<QuotHeadValues>();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Controller
      name={`meisaiHeads.${sectionNam}.${index}.meisai.${rowIndex}.tankaAmt`}
      control={control}
      render={({ field, fieldState }) => (
        <TextField
          {...field}
          value={
            isEditing
              ? (field.value ?? '')
              : typeof field.value === 'number' && !isNaN(field.value)
                ? `¥${Math.abs(field.value).toLocaleString()}`
                : `¥0`
          }
          type="text"
          onFocus={(e) => {
            setIsEditing(true);
            const rawValue = String(field.value ?? '');
            e.target.value = rawValue;
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
  );
};

/**
 * 動的フォーム（見積の明細項目部分）
 * @param param0
 * @returns 見積の明細項目のUIコンポーネント
 */
const MeisaiLinesComponent = ({
  index,
  sectionNam,
  editable,
}: {
  index: number;
  sectionNam: 'kizai' | 'labor' | 'other';
  editable: boolean;
}) => {
  /* useForm ----------------------------------------------------- */
  const { control, setValue, getValues } = useFormContext<QuotHeadValues>();
  // フォームのフィールド（明細）
  const meisaiFields = useFieldArray({ control, name: `meisaiHeads.${sectionNam}.${index}.meisai` });

  /* methods ------------------------------------------------------ */
  /** 明細項目の順番を帰るボタン押下時 */
  const moveRow = (i: number, direction: number) => {
    meisaiFields.move(i, i + direction);
  };

  /* 明細行の合算 */
  const mergeRow = (i: number) => {
    const targetPath = `meisaiHeads.${sectionNam}.${index - 1}.meisai` as const;
    const target = getValues(targetPath);

    const currentItem = getValues(`meisaiHeads.${sectionNam}.${index}.meisai.${i}`);

    if (!target || !currentItem) return;

    const newTargetMeisai = [...target];
    const targetIndex = newTargetMeisai.findIndex((d) => d.nam === currentItem.nam);

    if (targetIndex !== -1) {
      const targetQty = Number(newTargetMeisai[targetIndex].qty) || 0;
      const targetHonbanbiQty = Number(newTargetMeisai[targetIndex].honbanbiQty) || 0;
      const targetTankaAmt = Number(newTargetMeisai[targetIndex].tankaAmt) || 0;

      // 返却明細
      if ((currentItem.qty ?? 0) < 0) {
        // 単価一致
        if (targetTankaAmt === (currentItem.tankaAmt ?? 0)) {
          if (targetQty === -1 * (currentItem.qty ?? 0) && targetHonbanbiQty === (currentItem.honbanbiQty ?? 0)) {
            // 数量、本番日数一致対象から削除
            newTargetMeisai.splice(targetIndex, 1);
          } else if (
            targetQty === -1 * (currentItem.qty ?? 0) &&
            targetHonbanbiQty !== (currentItem.honbanbiQty ?? 0)
          ) {
            // 数量一致、本番日数不一致なら本番日数のみ減らす
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              honbanbiQty: targetHonbanbiQty - (currentItem.honbanbiQty ?? 0),
            };
          } else if (
            targetQty !== -1 * (currentItem.qty ?? 0) &&
            targetHonbanbiQty === (currentItem.honbanbiQty ?? 0)
          ) {
            // 数量不一致、本番日数一致なら数量のみ減らす
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              qty: targetQty + (currentItem.qty ?? 0),
            };
          } else if (
            targetQty !== -1 * (currentItem.qty ?? 0) &&
            targetHonbanbiQty !== (currentItem.honbanbiQty ?? 0)
          ) {
            // 数量不一致、本番日数不一致なら本番日数を減らし、数量を減らして本番日数が返却分の項目を追加
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              honbanbiQty: targetHonbanbiQty - (currentItem.honbanbiQty ?? 0),
            };
            newTargetMeisai.push({
              ...currentItem,
              id: null,
              qty: targetQty + (currentItem.qty ?? 0),
              honbanbiQty: currentItem.honbanbiQty,
            });
          }
          // 単価不一致
        } else {
          if (targetQty === -1 * (currentItem.qty ?? 0) && targetHonbanbiQty === (currentItem.honbanbiQty ?? 0)) {
            // 数量、本番日数一致なら単価のみ減らす
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              tankaAmt: targetTankaAmt - (currentItem.tankaAmt ?? 0),
            };
          } else if (
            targetQty === -1 * (currentItem.qty ?? 0) &&
            targetHonbanbiQty !== (currentItem.honbanbiQty ?? 0)
          ) {
            // 数量一致、本番日数不一致なら本番日数を減らし、単価を減らした返却分の本番日数で項目追加
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              honbanbiQty: targetHonbanbiQty - (currentItem.honbanbiQty ?? 0),
            };
            newTargetMeisai.push({
              ...newTargetMeisai[targetIndex],
              id: null,
              honbanbiQty: currentItem.honbanbiQty,
              tankaAmt: targetTankaAmt - (currentItem.tankaAmt ?? 0),
            });
          } else if (targetQty !== -1 * (currentItem.qty ?? 0)) {
            // 数量不一致なら項目追加
            newTargetMeisai.push({ ...currentItem, id: null });
          }
        }

        // 追加明細
      } else {
        // 単価一致
        if (targetTankaAmt === (currentItem.tankaAmt ?? 0)) {
          if (targetHonbanbiQty === (currentItem.honbanbiQty ?? 0)) {
            // 本番日数一致なら数量のみ増やす
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              qty: targetQty + (currentItem.qty ?? 0),
            };
          } else if (targetQty === (currentItem.qty ?? 0)) {
            // 数量一致なら本番日数のみ増やす
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              honbanbiQty: targetHonbanbiQty + (currentItem.honbanbiQty ?? 0),
            };
          } else {
            // 数量、本番日数不一致なら項目追加
            newTargetMeisai.push({ ...currentItem, id: null });
          }
          // 単価不一致
        } else {
          if (targetQty === (currentItem.qty ?? 0) && targetHonbanbiQty === (currentItem.honbanbiQty ?? 0)) {
            // 数量、本番日数一致なら単価のみ増やす
            newTargetMeisai[targetIndex] = {
              ...newTargetMeisai[targetIndex],
              tankaAmt: targetTankaAmt + (currentItem.tankaAmt ?? 0),
            };
          } else {
            // 数量または本番日数不一致なら項目追加
            newTargetMeisai.push({ ...currentItem, id: null });
          }
        }
      }
    } else {
      // 一致する名称がない場合は、新しく追加
      newTargetMeisai.push({ ...currentItem, id: null });
    }

    setValue(targetPath, newTargetMeisai, {
      shouldDirty: true,
      shouldValidate: true,
    });

    meisaiFields.remove(i);
  };

  return (
    <Box>
      {meisaiFields.fields.map((f, i) => (
        <Box key={f.id}>
          <MeisaiRowShokeiCalculator sectionNam={sectionNam} index={index} rowIndex={i} />
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
                  fullWidth
                />
              ) : (
                <Controller
                  name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.nam`}
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      {...field}
                      getOptionKey={(option) => (typeof option === 'string' ? option : option.id)}
                      onChange={(_, value) => {
                        const label = typeof value === 'string' ? value : (value?.label ?? '');
                        field.onChange(label);
                      }}
                      freeSolo
                      autoSelect
                      sx={{ width: 300 }}
                      renderInput={(params) => <TextField {...params} />}
                      options={quotationLaborSelectItems}
                      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
                    />
                  )}
                />
              )}
            </Grid2>
            {index !== 0 && sectionNam === 'kizai' && <Button onClick={() => mergeRow(i)}>合算</Button>}
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
              <MeisaiRowTankaAmtField sectionNam={sectionNam} index={index} rowIndex={i} editable={editable} />
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
        <Button
          size="small"
          onClick={() =>
            meisaiFields.append({ nam: '', qty: null, honbanbiQty: null, tankaAmt: null, shokeiAmt: null })
          }
          disabled={!editable}
        >
          <AddIcon fontSize="small" />
          項目
        </Button>
      </Grid2>
    </Box>
  );
};

// props（index, sectionNam, editable）が変わらない限り再レンダリングされないようにし、
// 親（Quotation・MeisaiTblHeader）が別の理由で再レンダリングされてもテーブル全体が巻き込まれないようにする
export const MeisaiLines = memo(MeisaiLinesComponent);
