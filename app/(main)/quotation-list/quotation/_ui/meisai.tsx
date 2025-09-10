import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid2, IconButton, TextField, Typography } from '@mui/material';
import { Control, useFieldArray } from 'react-hook-form';
import { TextFieldElement } from 'react-hook-form-mui';

import { QuotHeadValues, QuotMaisaiHeadValues } from '../_lib/types';

/**
 *
 * @param param0
 * @returns
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
      {sectionNam !== 'labor' &&
        meisaiFields.fields.map((f, i) => (
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
                <TextFieldElement name={`meisaiHeads.${sectionNam}.${index}.meisai.${i}.nam`} control={control} />
              </Grid2>
              <Grid2 size={1}>
                <TextField />
              </Grid2>
              <Grid2 size={0.8}>
                <TextField />
              </Grid2>
              <Grid2 size={1.5}>
                <TextField />
              </Grid2>
              <Grid2 size={2}>
                <TextField />
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
