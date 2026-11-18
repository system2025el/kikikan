'use client';

import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, Stack, TextField, Typography } from '@mui/material';
import { memo, useEffect, useMemo, useRef } from 'react';
import { CheckboxElement, TextFieldElement, UseFieldArrayReturn, useFormContext, useWatch } from 'react-hook-form-mui';

import { ReadOnlyYenField, YenInputField } from '@/app/(main)/_ui/yen-field';

import { mergeMeisaiInto } from '../_lib/merge-meisai';
import { QuotHeadValues } from '../_lib/types';

/**
 * テーブル1つ分の小計・値引後金額を計算してフォームへ反映する非表示コンポーネント。
 * テーブル単位でしか監視しないことで、明細行の入力のたびにテーブルヘッダー本体
 * （＝配下の全行）まで再レンダリングされるのを防ぐ。
 * @returns {null} 何も描画しない
 */
const MeisaiTblShokeiCalculator = ({
  sectionNam,
  index,
}: {
  sectionNam: 'kizai' | 'labor' | 'other';
  index: number;
}) => {
  const { control, setValue } = useFormContext<QuotHeadValues>();

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

  const shokeiSum = useMemo(
    () => Math.round((meisaiList ?? []).reduce((acc, item) => acc + (item.shokeiAmt ?? 0), 0)),
    [meisaiList]
  );
  const nebikiAft = useMemo(() => Math.round(shokeiSum - (nebikiAmt ?? 0)), [shokeiSum, nebikiAmt]);

  useEffect(() => {
    // 計算結果が現在の値と異なる場合のみ更新
    // shouldDirty: true にして、値が元に戻った際に isDirty が正しく再評価されるようにする
    if (shokeiSum !== (Number(currentShokeiAmt) || 0)) {
      setValue(`meisaiHeads.${sectionNam}.${index}.shokeiAmt`, shokeiSum, { shouldDirty: true });
    }
    // 請求側（bill-list）の `(Number(x) || 0)` とはわざと揃えていない。
    // 優先順位で `(nebikiAft !== Number(x)) || 0` と解釈されるため、新規追加直後の明細ヘッダー
    // （nebikiAftAmt が undefined → Number が NaN）では値引後金額が 0 でも必ず setValue され、0 が保存される。
    // 請求側の書き方にすると 0 のときセットされず null で保存され、見積PDF（usePdf の drawShokei）で空欄になる。
    if (nebikiAft !== Number(currentNebikiAftAmt) || 0) {
      setValue(`meisaiHeads.${sectionNam}.${index}.nebikiAftAmt`, nebikiAft, { shouldDirty: true });
    }
  }, [currentShokeiAmt, currentNebikiAftAmt, shokeiSum, nebikiAft, sectionNam, index, setValue]);

  return null;
};

const MeisaiTblHeaderComponent = ({
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
  /* methods ------------------------------------------------------- */
  /* 明細テーブルの順番を変えるボタン押下時 */
  const moveRow = (direction: number) => {
    sectionFields.move(index, index + direction);
  };

  /* useForm ------------------------------------------------------- */
  const { control, setValue, getValues } = useFormContext<QuotHeadValues>();

  /* ref */
  const inputRef = useRef<HTMLInputElement>(null);

  /* 一括変更ボタン押下 */
  const handleBulkChange = () => {
    const newValue = Number(inputRef.current?.value);
    const meisaiList = getValues(`meisaiHeads.${sectionNam}.${index}.meisai`);
    if (!inputRef.current?.value || isNaN(newValue) || !meisaiList) return;

    const updatedMeisai = meisaiList.map((item) => ({
      ...item,
      honbanbiQty: newValue,
    }));

    setValue(`meisaiHeads.${sectionNam}.${index}.meisai`, updatedMeisai, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  /* 明細一括合算 */
  const handleMerge = () => {
    const targetPath = `meisaiHeads.${sectionNam}.${index - 1}.meisai` as const;
    const target = getValues(targetPath);
    const meisaiList = getValues(`meisaiHeads.${sectionNam}.${index}.meisai`);

    if (!target || !meisaiList) return;

    // 前の行を足し込んだ結果に、次の行を順に足し込む
    const newMeisai = meisaiList.reduce((acc, m) => mergeMeisaiInto(acc, m), target);

    setValue(targetPath, newMeisai, {
      shouldDirty: true,
      shouldValidate: true,
    });

    sectionFields.remove(index);
  };

  return (
    <>
      <MeisaiTblShokeiCalculator sectionNam={sectionNam} index={index} />
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
          <Box display={'flex'} alignItems={'end'}>
            <Grid2 container alignItems={'end'} spacing={1} mr={1}>
              {index !== 0 && sectionNam === 'kizai' && <Button onClick={handleMerge}>一括合算</Button>}
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
            <Button disabled={index === 0 || !editable} onClick={() => moveRow(-1)}>
              <ArrowUpwardIcon fontSize="small" />
            </Button>
            <Button disabled={index === sectionFields.fields.length - 1 || !editable} onClick={() => moveRow(1)}>
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
          <ReadOnlyYenField control={control} name={`meisaiHeads.${sectionNam}.${index}.shokeiAmt`} />
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
          <YenInputField
            control={control}
            name={`meisaiHeads.${sectionNam}.${index}.nebikiAmt`}
            editable={editable}
            minus
            selectOnFocus
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
          <ReadOnlyYenField control={control} name={`meisaiHeads.${sectionNam}.${index}.nebikiAftAmt`} />
        </Grid2>
        <Grid2 size={1} />
      </Grid2>
    </>
  );
};

/**
 * sectionFields（useFieldArrayの戻り値）は親が再レンダリングされるたびに
 * 新しいオブジェクト参照になるため、既定の shallow compare では memo が効かない。
 * 実際にこのコンポーネントの表示に影響する値（行数・並び順に relevant な index）だけを
 * 比較することで、親（Quotation）が isDirty 等の変化で再レンダリングされても、
 * 内容が変わっていないテーブルは再レンダリングされないようにする。
 */
export const MeisaiTblHeader = memo(
  MeisaiTblHeaderComponent,
  (prev, next) =>
    prev.index === next.index &&
    prev.sectionNam === next.sectionNam &&
    prev.editable === next.editable &&
    prev.sectionFields.fields.length === next.sectionFields.fields.length
);
