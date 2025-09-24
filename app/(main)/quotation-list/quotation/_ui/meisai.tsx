import { Label } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, IconButton, Select, TextField, Typography } from '@mui/material';
import { Control, useFieldArray } from 'react-hook-form';
import { SelectElement, TextFieldElement } from 'react-hook-form-mui';

import { QuotHeadValues, QuotMaisaiHeadValues } from '../_lib/types';

/**
 * 動的フォーム（見積の明細項目部分）
 * @param param0
 * @returns 見積の明細項目のUIコンポーネント
 */
export const MeisaiLines = ({
  control,
  index,
  sectionNam,
}: {
  control: Control<QuotHeadValues>;
  index: number;
  sectionNam: 'kizai' | 'labor' | 'other';
}) => {
  const meisaiFields = useFieldArray({ control, name: `meisaiHeads.${sectionNam}.${index}.meisai` });

  /* 明細項目の順番を帰るボタン押下時 */
  const moveRow = (i: number, direction: number) => {
    meisaiFields.move(i, i + direction);
  };

  return (
    <Box>
      {meisaiFields.fields.map((f, i) => (
        <Box key={f.id}>
          <Grid2 container px={2} my={0.5} alignItems={'center'} spacing={0.5}>
            <Grid2 size={0.5} justifyItems={'end'}>
              <Box>
                <IconButton size="small" onClick={() => meisaiFields.remove(i)}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Box>
            </Grid2>
            <Grid2 size={'grow'}>
              {sectionNam !== 'labor' ? (
                <TextFieldElement name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.nam`} control={control} />
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
              />
            </Grid2>
            <Grid2 size={1.5}>
              <TextFieldElement
                name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.tankaAmt`}
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
              />
            </Grid2>
            <Grid2 size={2}>
              <TextFieldElement
                name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.shokeiAmt`}
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
              />
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
                disabled={i === 0}
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
                disabled={i === meisaiFields.fields.length - 1}
              >
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Grid2>
          </Grid2>
        </Box>
      ))}
      <Grid2 container px={2} alignItems={'center'}>
        <Grid2 size={0.5} />
        <Button size="small" onClick={() => meisaiFields.append({ nam: null })}>
          <AddIcon fontSize="small" />
          項目
        </Button>
      </Grid2>
    </Box>
  );
};
