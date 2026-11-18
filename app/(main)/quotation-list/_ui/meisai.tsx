import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Dialog, Grid2, IconButton, TextField } from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { PrefilledAutocomplete } from '../../_ui/prefilled-autocomplete';
import { ReadOnlyYenField, YenInputField } from '../../_ui/yen-field';
import { quotationLaborSelectItems } from '../_lib/datas';
import { mergeMeisaiInto } from '../_lib/merge-meisai';
import { QuotHeadValues, SelectedEqptsValues } from '../_lib/types';
import { QuotEqptSelectionDialog } from './equipment-selection-dialog';

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

  /* useState ------------------------------------------------------ */
  // 機材追加ダイアログ制御
  const [eqSelectionDialogOpen, setEqSelectionDialogOpen] = useState(false);

  /* methods ------------------------------------------------------ */
  /** 機材選択ダイアログで選択された機材を明細行として追加する */
  const handleAddEqpts = (eqpts: SelectedEqptsValues[]) => {
    meisaiFields.append(
      eqpts.map((d) => ({
        nam: d.kizaiNam,
        qty: 0,
        honbanbiQty: 0,
        tankaAmt: d.regAmt,
        shokeiAmt: null,
      }))
    );
  };

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

    const newTargetMeisai = mergeMeisaiInto(target, currentItem);

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
                    <PrefilledAutocomplete
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
              {/* 入力中かどうかの状態は欄の中で持つので、1つの単価を入力しても他の行は再描画されない */}
              <YenInputField
                control={control}
                name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.tankaAmt`}
                editable={editable}
              />
            </Grid2>
            <Grid2 size={2}>
              <ReadOnlyYenField control={control} name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.shokeiAmt`} />
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
      <Grid2 container px={2} alignItems={'center'} spacing={1}>
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
        {sectionNam === 'kizai' && (
          <Button size="small" onClick={() => setEqSelectionDialogOpen(true)} disabled={!editable}>
            <AddIcon fontSize="small" />
            機材追加
          </Button>
        )}
      </Grid2>
      {sectionNam === 'kizai' && (
        <Dialog open={eqSelectionDialogOpen} fullScreen>
          <QuotEqptSelectionDialog
            onSelect={handleAddEqpts}
            handleCloseDialog={() => setEqSelectionDialogOpen(false)}
          />
        </Dialog>
      )}
    </Box>
  );
};

// props（index, sectionNam, editable）が変わらない限り再レンダリングされないようにし、
// 親（Quotation・MeisaiTblHeader）が別の理由で再レンダリングされてもテーブル全体が巻き込まれないようにする
export const MeisaiLines = memo(MeisaiLinesComponent);
